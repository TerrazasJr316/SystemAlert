import { useState, useEffect, useCallback } from "react";

const PRIORITY_LABEL = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
};

export default function HistoryPanel({ apiUrl }) {
  const [incidents, setIncidents] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (priorityFilter) params.set("priority", priorityFilter);
    if (zoneFilter) params.set("zone", zoneFilter);
    params.set("limit", "20");

    try {
      const res = await fetch(`${apiUrl}/api/v1/incidents?${params}`);
      if (!res.ok) throw new Error(`MS5 respondió ${res.status}`);
      const json = await res.json();
      setIncidents(json.data);
    } catch (err) {
      setError("No se pudo conectar con el historial (MS5)");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, priorityFilter, zoneFilter]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000); // refresca cada 5s
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  return (
    <section className="history-panel">
      <div className="history-header">
        <span className="history-title">Historial de incidentes</span>

        <div className="history-filters">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="history-select"
          >
            <option value="">Toda prioridad</option>
            <option value="critico">Crítico</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
          </select>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="history-select"
          >
            <option value="">Toda zona</option>
            <option value="Norte">Norte</option>
            <option value="Sur">Sur</option>
            <option value="Centro">Centro</option>
            <option value="Oriente">Oriente</option>
            <option value="Poniente">Poniente</option>
          </select>

          <button className="history-refresh" onClick={fetchIncidents}>
            ↻ Actualizar
          </button>
        </div>
      </div>

      {error && <div className="history-error">{error}</div>}

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Dispositivo</th>
              <th>Zona</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id}>
                <td className="mono">#{inc.id}</td>
                <td className="mono">{inc.device_id}</td>
                <td>{inc.zone}</td>
                <td>{inc.emergency_type}</td>
                <td>
                  <span className={`alert-pill alert-pill--${inc.priority}`}>
                    {PRIORITY_LABEL[inc.priority] || inc.priority}
                  </span>
                </td>
                <td className="mono muted">
                  {new Date(inc.created_at).toLocaleString("es-MX")}
                </td>
              </tr>
            ))}
            {!loading && incidents.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="history-empty">
                  No hay incidentes con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .history-panel {
          background: var(--bg-panel);
          padding: 14px 24px 18px;
          max-height: 280px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .history-title {
          font-size: 13px;
          font-weight: 600;
        }
        .history-filters {
          display: flex;
          gap: 8px;
        }
        .history-select {
          background: var(--bg-panel-raised);
          border: 1px solid var(--border-hairline);
          color: var(--text-primary);
          font-size: 12px;
          padding: 5px 8px;
          border-radius: 5px;
          font-family: var(--font-sans);
        }
        .history-refresh {
          background: var(--bg-panel-raised);
          border: 1px solid var(--border-hairline);
          color: var(--text-secondary);
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
        }
        .history-refresh:hover {
          color: var(--text-primary);
        }
        .history-error {
          font-size: 12px;
          color: var(--priority-critico);
        }
        .history-table-wrap {
          overflow-y: auto;
          flex: 1;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .history-table thead th {
          text-align: left;
          color: var(--text-tertiary);
          font-weight: 500;
          font-size: 11px;
          padding: 6px 10px;
          border-bottom: 1px solid var(--border-hairline);
          position: sticky;
          top: 0;
          background: var(--bg-panel);
        }
        .history-table tbody td {
          padding: 7px 10px;
          border-bottom: 1px solid var(--border-hairline);
        }
        .history-table .mono {
          font-family: var(--font-mono);
        }
        .history-table .muted {
          color: var(--text-tertiary);
        }
        .history-empty {
          text-align: center;
          color: var(--text-tertiary);
          padding: 20px;
        }
        .alert-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .alert-pill--critico {
          background: var(--priority-critico-dim);
          color: var(--priority-critico);
        }
        .alert-pill--alto {
          background: var(--priority-alto-dim);
          color: var(--priority-alto);
        }
        .alert-pill--medio {
          background: var(--priority-medio-dim);
          color: var(--priority-medio);
        }
      `}</style>
    </section>
  );
}
