const { Server } = require("socket.io");
const Redis = require("ioredis");
const http = require("http");

// ─────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────
const WS_PORT          = process.env.WS_PORT || 4000;
const REDIS_HOST        = process.env.REDIS_HOST || "redis";
const REDIS_PORT        = process.env.REDIS_PORT || 6379;
const NOTIF_STREAM      = process.env.NOTIF_STREAM || "notifications-stream";
const CONSUMER_GROUP    = process.env.CONSUMER_GROUP || "ms4-group";
const CONSUMER_NAME     = process.env.CONSUMER_NAME || "ms4-consumer-1";

function log(msg) {
  console.log(`[MS4] ${new Date().toISOString()} — ${msg}`);
}

// ─────────────────────────────────────────
// Servidor HTTP + WebSocket (socket.io)
// ─────────────────────────────────────────
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },  // demo — en producción restringir al dominio del dashboard
});

io.on("connection", (socket) => {
  log(`Operador conectado: ${socket.id}`);
  socket.on("disconnect", () => log(`Operador desconectado: ${socket.id}`));
});

httpServer.listen(WS_PORT, () => {
  log(`Servidor WebSocket escuchando en puerto ${WS_PORT}`);
});

// ─────────────────────────────────────────
// Cliente Redis — consumer group con tolerancia a fallos
// ─────────────────────────────────────────
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

async function ensureConsumerGroup() {
  try {
    await redis.xgroup("CREATE", NOTIF_STREAM, CONSUMER_GROUP, "0", "MKSTREAM");
    log(`Consumer group '${CONSUMER_GROUP}' creado en '${NOTIF_STREAM}'`);
  } catch (err) {
    if (err.message.includes("BUSYGROUP")) {
      log(`Consumer group '${CONSUMER_GROUP}' ya existía — continuando`);
    } else {
      throw err;
    }
  }
}

// ─────────────────────────────────────────
// Loop de consumo — esto es la clave de la
// tolerancia a fallos: si MS4 estuvo caído,
// al reiniciar retoma desde el último ACK
// ─────────────────────────────────────────
async function consumeLoop() {
  while (true) {
    try {
      const results = await redis.xreadgroup(
        "GROUP", CONSUMER_GROUP, CONSUMER_NAME,
        "COUNT", 1,
        "BLOCK", 2000,
        "STREAMS", NOTIF_STREAM, ">"
      );

      if (!results) continue;

      for (const [streamName, messages] of results) {
        for (const [messageId, fields] of messages) {
          await processNotification(messageId, fields);
        }
      }
    } catch (err) {
      log(`ERROR en consumeLoop: ${err.message} — reintentando en 2s`);
      await sleep(2000);
    }
  }
}

async function processNotification(messageId, fields) {
  // fields viene como ["data", "{...json...}"]
  const dataIndex = fields.indexOf("data");
  const rawData = fields[dataIndex + 1];

  let notification;
  try {
    notification = JSON.parse(rawData);
  } catch (err) {
    log(`DESCARTADO ${messageId} — JSON inválido: ${err.message}`);
    await redis.xack(NOTIF_STREAM, CONSUMER_GROUP, messageId);
    return;
  }

  log(`✓ Notificación recibida | device=${notification.device_id} | prioridad=${notification.priority}`);

  // Emitir a todos los operadores conectados vía WebSocket
  io.emit("new_alert", notification);

  // ACK — confirma procesamiento. Si MS4 se cae ANTES de este punto,
  // el mensaje queda pendiente y se reentrega al reiniciar.
  await redis.xack(NOTIF_STREAM, CONSUMER_GROUP, messageId);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────
// Arranque
// ─────────────────────────────────────────
async function main() {
  log("MS4 iniciado");
  await ensureConsumerGroup();
  await consumeLoop();
}

main();
