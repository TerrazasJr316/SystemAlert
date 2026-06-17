import os
import time
import json
import grpc
import redis
import psycopg2

import priority_pb2
import priority_pb2_grpc

from geo_zones import get_zone

# ─────────────────────────────────────────
# Configuración desde variables de entorno
# ─────────────────────────────────────────
REDIS_HOST       = os.getenv("REDIS_HOST", "redis")
REDIS_PORT       = int(os.getenv("REDIS_PORT", 6379))
REDIS_STREAM     = os.getenv("REDIS_STREAM", "alerts-stream")
CONSUMER_GROUP   = os.getenv("CONSUMER_GROUP", "ms2-group")
CONSUMER_NAME    = os.getenv("CONSUMER_NAME", "ms2-consumer-1")

NOTIF_STREAM     = os.getenv("NOTIF_STREAM", "notifications-stream")

MS3_HOST         = os.getenv("MS3_HOST", "ms3")
MS3_PORT         = os.getenv("MS3_PORT", "50051")

PG_HOST          = os.getenv("PG_HOST", "postgres-master")
PG_PORT          = os.getenv("PG_PORT", "5432")
PG_DB            = os.getenv("PG_DB", "c5db")
PG_USER          = os.getenv("PG_USER", "postgres")
PG_PASSWORD      = os.getenv("PG_PASSWORD", "postgres")


def log(msg: str):
    print(f"[MS2] {time.strftime('%Y-%m-%dT%H:%M:%S')} — {msg}", flush=True)


# ─────────────────────────────────────────
# Conexión a Redis
# ─────────────────────────────────────────
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def ensure_consumer_group():
    try:
        r.xgroup_create(
            name=REDIS_STREAM,
            groupname=CONSUMER_GROUP,
            id="0",
            mkstream=True,
        )
        log(f"Consumer group '{CONSUMER_GROUP}' creado en stream '{REDIS_STREAM}'")
    except redis.exceptions.ResponseError as e:
        if "BUSYGROUP" in str(e):
            log(f"Consumer group '{CONSUMER_GROUP}' ya existía — continuando")
        else:
            raise


# ─────────────────────────────────────────
# Conexión a PostgreSQL (master — solo escritura)
# Se reconecta perezosamente si se cae
# ─────────────────────────────────────────
_pg_conn = None


def get_pg_connection():
    global _pg_conn
    if _pg_conn is None or _pg_conn.closed:
        retries = 10
        for attempt in range(1, retries + 1):
            try:
                _pg_conn = psycopg2.connect(
                    host=PG_HOST, port=PG_PORT, dbname=PG_DB,
                    user=PG_USER, password=PG_PASSWORD,
                )
                _pg_conn.autocommit = True
                log("Conexión a PostgreSQL (master) establecida")
                break
            except psycopg2.OperationalError as e:
                log(f"PostgreSQL no disponible (intento {attempt}/{retries}): {e}")
                time.sleep(3)
        else:
            raise RuntimeError("No se pudo conectar a PostgreSQL tras varios intentos")
    return _pg_conn


def persist_incident(alert: dict, priority: str, stream_id: str):
    """
    Inserta el incidente clasificado en PostgreSQL master.
    Usa ON CONFLICT para ser idempotente ante reintentos del mismo stream_id.
    """
    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO incidents
                (stream_id, device_id, lat, lon, zone, emergency_type, description, priority)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (stream_id) DO NOTHING
            """,
            (
                stream_id,
                alert["device_id"],
                float(alert["lat"]),
                float(alert["lon"]),
                alert["zone"],
                alert["emergency_type"],
                alert.get("description", ""),
                priority,
            ),
        )


# ─────────────────────────────────────────
# Cliente gRPC hacia MS3
# ─────────────────────────────────────────
def classify_with_ms3(alert: dict, stream_id: str) -> str:
    channel = grpc.insecure_channel(f"{MS3_HOST}:{MS3_PORT}")
    stub = priority_pb2_grpc.PriorityServiceStub(channel)

    request = priority_pb2.AlertGeoRequest(
        device_id=alert["device_id"],
        lat=float(alert["lat"]),
        lon=float(alert["lon"]),
        timestamp=int(alert["timestamp"]),
        emergency_type=alert["emergency_type"],
        description=alert.get("description", ""),
        zone=alert["zone"],
        stream_id=stream_id,
    )

    try:
        response = stub.ClassifyAlert(request, timeout=2.0)
        if response.success:
            return response.priority
        else:
            log(f"MS3 respondió error: {response.error_message}")
            return "medio"
    except grpc.RpcError as e:
        log(f"ERROR gRPC al llamar MS3: {e.code()} — {e.details()}")
        return "medio"
    finally:
        channel.close()


# ─────────────────────────────────────────
# Loop principal — consumo del Redis Stream
# ─────────────────────────────────────────
def main():
    log("MS2 iniciado")
    ensure_consumer_group()

    while True:
        try:
            results = r.xreadgroup(
                groupname=CONSUMER_GROUP,
                consumername=CONSUMER_NAME,
                streams={REDIS_STREAM: ">"},
                count=1,
                block=2000,
            )

            if not results:
                continue

            for stream_name, messages in results:
                for message_id, fields in messages:
                    process_alert(message_id, fields)

        except redis.exceptions.ConnectionError as e:
            log(f"Redis desconectado, reintentando en 2s: {e}")
            time.sleep(2)


def process_alert(message_id: str, fields: dict):
    log(f"Procesando alerta {message_id} — device={fields.get('device_id')}")

    try:
        lat = float(fields["lat"])
        lon = float(fields["lon"])
    except (KeyError, ValueError) as e:
        log(f"DESCARTADO {message_id} — coordenadas inválidas: {e}")
        r.xack(REDIS_STREAM, CONSUMER_GROUP, message_id)
        return

    zone = get_zone(lat, lon)
    fields["zone"] = zone

    priority = classify_with_ms3(fields, message_id)

    log(f"✓ Alerta {message_id} | zona={zone} | prioridad={priority}")

    # 1. Persistir en PostgreSQL master
    try:
        persist_incident(fields, priority, message_id)
        log(f"✓ Persistido en PostgreSQL | stream_id={message_id}")
    except Exception as e:
        # No perdemos la alerta — si Postgres falla, no hacemos ACK
        # y el mensaje queda pendiente para reintento
        log(f"ERROR al persistir en PostgreSQL: {e} — NO se hace ACK, se reintentará")
        return

    # 2. Publicar a Redis Stream de notificaciones para MS4
    try:
        notif_payload = {
            "device_id": fields["device_id"],
            "lat": fields["lat"],
            "lon": fields["lon"],
            "zone": zone,
            "emergency_type": fields["emergency_type"],
            "description": fields.get("description", ""),
            "priority": priority,
            "stream_id": message_id,
        }
        r.xadd(NOTIF_STREAM, {"data": json.dumps(notif_payload)})
        log(f"✓ Publicado a '{NOTIF_STREAM}' para MS4")
    except Exception as e:
        log(f"ERROR al publicar notificación: {e} — el incidente ya está persistido, no se pierde")

    # 3. ACK — confirma que el mensaje fue completamente procesado
    r.xack(REDIS_STREAM, CONSUMER_GROUP, message_id)


if __name__ == "__main__":
    main()

