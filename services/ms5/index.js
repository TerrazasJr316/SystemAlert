const express = require("express");
const { Pool } = require("pg");

// ─────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const PG_HOST = process.env.PG_HOST || "postgres-replica";  // ← SIEMPRE la réplica
const PG_PORT = process.env.PG_PORT || 5432;
const PG_DB = process.env.PG_DB || "c5db";
const PG_USER = process.env.PG_USER || "postgres";
const PG_PASSWORD = process.env.PG_PASSWORD || "postgres";

function log(msg) {
  console.log(`[MS5] ${new Date().toISOString()} — ${msg}`);
}

// ─────────────────────────────────────────
// Pool de conexiones — siempre contra la réplica
// Esto es la decisión arquitectónica clave de MS5:
// nunca lee del master, garantizando que las
// escrituras (MS2/MS3) no compitan con las lecturas
// del historial (RNF-3: consistencia eventual)
// ─────────────────────────────────────────
const pool = new Pool({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DB,
  user: PG_USER,
  password: PG_PASSWORD,
  max: 10,
});

pool.on("error", (err) => {
  log(`Error en el pool de PostgreSQL (réplica): ${err.message} — pg reintenta automáticamente`);
});

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  next();
});

app.use(express.json());

// ─────────────────────────────────────────
// GET /api/v1/incidents
// Filtros opcionales: from, to, zone, priority, limit, offset
// RF-5: consultable por rango de fechas, zona, prioridad
// ─────────────────────────────────────────
app.get("/api/v1/incidents", async (req, res) => {
  const { from, to, zone, priority } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (from) {
    conditions.push(`created_at >= $${paramIndex++}`);
    values.push(from);
  }
  if (to) {
    conditions.push(`created_at <= $${paramIndex++}`);
    values.push(to);
  }
  if (zone) {
    conditions.push(`zone = $${paramIndex++}`);
    values.push(zone);
  }
  if (priority) {
    conditions.push(`priority = $${paramIndex++}`);
    values.push(priority);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT id, stream_id, device_id, lat, lon, zone, emergency_type,
           description, priority, received_at, created_at
    FROM incidents
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    log(`GET /incidents — ${result.rows.length} resultados | filtros=${JSON.stringify(req.query)}`);
    res.json({
      data: result.rows,
      pagination: { limit, offset, count: result.rows.length },
    });
  } catch (err) {
    log(`ERROR en query: ${err.message}`);
    res.status(500).json({ error: "Error al consultar el historial" });
  }
});

// ─────────────────────────────────────────
// GET /api/v1/incidents/:id — detalle de un incidente
// ─────────────────────────────────────────
app.get("/api/v1/incidents/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM incidents WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    log(`ERROR en query detalle: ${err.message}`);
    res.status(500).json({ error: "Error al consultar el incidente" });
  }
});

// ─────────────────────────────────────────
// Health check
// ─────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", service: "ms5" }));

app.listen(PORT, () => {
  log(`MS5 escuchando en puerto ${PORT} — leyendo desde ${PG_HOST}`);
});
