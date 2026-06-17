// ─────────────────────────────────────────
// Diccionario de clasificación de prioridad
// Configurable — RF-3: reglas documentadas
// ─────────────────────────────────────────
//
// Regla de negocio: cada tipo de emergencia
// tiene un nivel de prioridad fijo, asignado
// según severidad esperada del incidente.

const priorityRules = {
  "panico":      "critico",
  "robo":        "critico",
  "agresion":    "critico",
  "accidente":   "alto",
  "incendio":    "alto",
  "sospechoso":  "medio",
  "ruido":       "medio",
};

// Prioridad por defecto si el tipo no está en el diccionario
// (nunca debe perderse una alerta por un tipo desconocido)
const DEFAULT_PRIORITY = "medio";

/**
 * Clasifica una alerta según su emergency_type.
 * @param {string} emergencyType
 * @returns {string} nivel de prioridad: "critico" | "alto" | "medio"
 */
function classify(emergencyType) {
  const normalized = (emergencyType || "").toLowerCase().trim();
  return priorityRules[normalized] ?? DEFAULT_PRIORITY;
}

module.exports = { classify, priorityRules, DEFAULT_PRIORITY };
