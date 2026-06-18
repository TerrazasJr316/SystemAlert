const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const { classify } = require("./priorityRules");

// ─────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────
const GRPC_PORT = process.env.GRPC_PORT || "50051";
const PROTO_PATH = path.join(__dirname, "proto", "priority.proto");

function log(msg) {
  console.log(`[MS3] ${new Date().toISOString()} — ${msg}`);
}

// ─────────────────────────────────────────
// Carga del contrato .proto
// ─────────────────────────────────────────
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const priorityProto = grpc.loadPackageDefinition(packageDefinition).c5.priority;

// ─────────────────────────────────────────
// Implementación del RPC ClassifyAlert
// ─────────────────────────────────────────
function classifyAlert(call, callback) {
  const req = call.request;

  log(`Solicitud recibida — device=${req.device_id} tipo=${req.emergency_type} zona=${req.zone}`);

  try {
    const priority = classify(req.emergency_type);

    log(`✓ Clasificado | device=${req.device_id} | tipo=${req.emergency_type} | prioridad=${priority}`);

    callback(null, {
      priority: priority,
      success: true,
      error_message: "",
    });
  } catch (err) {
    log(`ERROR al clasificar: ${err.message}`);
    callback(null, {
      priority: "medio",
      success: false,
      error_message: err.message,
    });
  }
}

// ─────────────────────────────────────────
// Arranque del servidor gRPC
// ─────────────────────────────────────────
function main() {
  const server = new grpc.Server();

  server.addService(priorityProto.PriorityService.service, {
    ClassifyAlert: classifyAlert,
  });

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        log(`ERROR al iniciar servidor: ${err.message}`);
        process.exit(1);
      }
      log(`Servidor gRPC escuchando en puerto ${port}`);
    }
  );
}

main();
