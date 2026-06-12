const Redis = require("ioredis");

// Configuración de entorno
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const STREAM_IN  = process.env.STREAM_IN  || "alerts-stream"; // De donde leemos (MS1)
const STREAM_OUT = process.env.STREAM_OUT || "geo-stream";    // A donde mandamos (para MS3)
const CONSUMER_GROUP = "geo-group";
const CONSUMER_NAME  = `geo-worker-${Date.now()}`;

const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

// Función simple para simular geocercas
function determinarZona(lat, lon) {
  // Coordenadas base (centro imaginario)
  const latCentro = 20.0500;
  const lonCentro = -99.3400;

  if (lat >= latCentro && lon >= lonCentro) return "Zona Noreste";
  if (lat >= latCentro && lon < lonCentro)  return "Zona Noroeste";
  if (lat < latCentro && lon >= lonCentro)  return "Zona Sureste";
  return "Zona Suroeste";
}

async function init() {
  console.log(`[MS2-Geo] Iniciando servicio. Conectando a Redis: ${REDIS_HOST}:${REDIS_PORT}`);

  // Crear el grupo de consumidores si no existe
  try {
    await redis.xgroup("CREATE", STREAM_IN, CONSUMER_GROUP, "0", "MKSTREAM");
    console.log(`[MS2-Geo] Grupo de consumo ${CONSUMER_GROUP} listo.`);
  } catch (err) {
    if (!err.message.includes("BUSYGROUP")) {
      console.error("[MS2-Geo] Error creando grupo:", err);
    }
  }

  // Bucle infinito para escuchar nuevas alertas
  while (true) {
    try {
      // Leemos del stream esperando hasta 5 segundos (bloqueo)
      const data = await redis.xreadgroup(
        "GROUP", CONSUMER_GROUP, CONSUMER_NAME,
        "BLOCK", 5000,
        "STREAMS", STREAM_IN, ">"
      );

      if (data) {
        const stream = data[0];
        const messages = stream[1];

        for (const message of messages) {
          const messageId = message[0];
          const fields = message[1];

          // Extraer el payload JSON que mandó el MS1
          const payloadIndex = fields.indexOf("payload");
          if (payloadIndex !== -1) {
            const payload = JSON.parse(fields[payloadIndex + 1]);
            
            // 1. Ejecutar la lógica de negocio (Geolocalización)
            const zona = determinarZona(payload.lat, payload.lon);
            payload.zona = zona;
            
            console.log(`[MS2-Geo] Alerta procesada: Dispositivo ${payload.device_id} ubicado en ${zona}`);

            // 2. Empujar al nuevo stream para el MS3
            await redis.xadd(
              STREAM_OUT, "*",
              "payload", JSON.stringify(payload),
              "device_id", payload.device_id,
              "geo_processed_at", Date.now().toString()
            );

            // 3. Marcar el mensaje como procesado en este stream (ACK)
            await redis.xack(STREAM_IN, CONSUMER_GROUP, messageId);
          }
        }
      }
    } catch (error) {
      console.error("[MS2-Geo] Error procesando stream:", error);
    }
  }
}

init();