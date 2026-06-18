const mqtt   = require("mqtt");
const Redis  = require("ioredis");

// ─────────────────────────────────────────
// Configuración desde variables de entorno
// ─────────────────────────────────────────
const INSTANCE_ID   = process.env.INSTANCE_ID   || "ms1-local";
const MQTT_BROKER   = process.env.MQTT_BROKER   || "localhost";
const MQTT_PORT     = process.env.MQTT_PORT     || 1883;
const MQTT_TOPIC    = process.env.MQTT_TOPIC    || "$share/grupo-ms1/alerts/panic/+";
const REDIS_HOST    = process.env.REDIS_HOST    || "localhost";
const REDIS_PORT    = process.env.REDIS_PORT    || 6379;
const REDIS_STREAM  = process.env.REDIS_STREAM  || "alerts-stream";

// ─────────────────────────────────────────
// Conexión Redis
// ─────────────────────────────────────────
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

redis.on("connect", () => log("Redis conectado"));
redis.on("error",   (err) => log(`Redis error: ${err.message}`));

// ─────────────────────────────────────────
// Conexión MQTT
// ─────────────────────────────────────────
const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  clientId: `ms1-${INSTANCE_ID}-${Date.now()}`,  // único por instancia
  clean: true,
  reconnectPeriod: 2000,
});

client.on("connect", () => {
  log(`MQTT conectado al broker ${MQTT_BROKER}:${MQTT_PORT}`);
  client.subscribe(MQTT_TOPIC, { qos: 1 }, (err) => {
    if (err) log(`Error al suscribirse: ${err.message}`);
    else     log(`Suscrito a: ${MQTT_TOPIC}`);
  });
});

client.on("error",      (err) => log(`MQTT error: ${err.message}`));
client.on("reconnect",  ()    => log("MQTT reconectando..."));

// ─────────────────────────────────────────
// Procesamiento de mensajes entrantes
// ─────────────────────────────────────────
client.on("message", async (topic, rawMessage) => {
  log(`Mensaje recibido en topic: ${topic}`);

  // 1. Parsear JSON
  let payload;
  try {
    payload = JSON.parse(rawMessage.toString());
  } catch {
    log(`DESCARTADO — payload no es JSON válido: ${rawMessage.toString()}`);
    return;
  }

  // 2. Validar campos requeridos
  const error = validatePayload(payload);
  if (error) {
    log(`DESCARTADO — validación fallida: ${error}`);
    return;
  }

  // 3. Escribir en Redis Stream
  try {
    const streamId = await redis.xadd(
      REDIS_STREAM,
      "*",                               // ID autogenerado por Redis (timestamp)
      "device_id",      payload.device_id,
      "lat",            String(payload.lat),
      "lon",            String(payload.lon),
      "timestamp",      String(payload.timestamp),
      "emergency_type", payload.emergency_type,
      "description",    payload.description || "",
      "received_by",    INSTANCE_ID,      // para la demo: muestra qué instancia procesó
      "received_at",    Date.now().toString()
    );

    log(`Alerta encolada en Redis Stream | id=${streamId} | device=${payload.device_id} | tipo=${payload.emergency_type}`);
  } catch (err) {
    log(`ERROR al escribir en Redis: ${err.message}`);
  }
});

// ─────────────────────────────────────────
// Validación del payload (RF-2)
// ─────────────────────────────────────────
function validatePayload(payload) {
  const required = ["device_id", "lat", "lon", "timestamp", "emergency_type"];

  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null) {
      return `campo requerido ausente: ${field}`;
    }
  }

  if (typeof payload.lat !== "number" || typeof payload.lon !== "number") {
    return "lat y lon deben ser números";
  }

  if (payload.lat < -90  || payload.lat > 90)  return "lat fuera de rango (-90 a 90)";
  if (payload.lon < -180 || payload.lon > 180) return "lon fuera de rango (-180 a 180)";

  if (typeof payload.device_id !== "string" || payload.device_id.trim() === "") {
    return "device_id debe ser un string no vacío";
  }

  return null; // válido
}

// ─────────────────────────────────────────
// Logger con instancia identificada
// ─────────────────────────────────────────
function log(msg) {
  console.log(`[${INSTANCE_ID}] ${new Date().toISOString()} — ${msg}`);
}

log(`MS1 iniciado`);
