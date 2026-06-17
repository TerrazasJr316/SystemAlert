const PRIORITY_LABEL = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
};

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "ahora";
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `hace ${minutes}min`;
}

export default function LiveFeed({ alerts, selectedAlert, onSelectAlert }) {
  return (
    <aside className="live-feed">
      <div className="live-feed-header">
        <span className="live-feed-title">Alertas en vivo</span>
        <span className="live-feed-badge">● en vivo</span>
      </div>

      <div className="live-feed-list">
        {alerts.length === 0 && (
          <div className="live-feed-empty">
            Sin alertas todavía. Las notificaciones del ESP32 aparecerán aquí en tiempo real.
          </div>
        )}

        {alerts.map((alert, idx) => {
          const isSelected = selectedAlert?.stream_id === alert.stream_id;
          return (
            <button
              key={`${alert.stream_id}-${idx}`}
              className={`alert-card ${isSelected ? "alert-card--selected" : ""}`}
              onClick={() => onSelectAlert(alert)}
              style={{ "--priority-border": `var(--priority-${alert.priority})` }}
            >
              <div className="alert-card-top">
                <span className="alert-card-device">{alert.device_id}</span>
                <span className={`alert-pill alert-pill--${alert.priority}`}>
                  {PRIORITY_LABEL[alert.priority] || alert.priority}
                </span>
              </div>
              <div className="alert-card-meta">
                {alert.emergency_type} · {alert.zone}
              </div>
              <div className="alert-card-time">{timeAgo(alert._receivedAt)}</div>
            </button>
          );
        })}
      </div>

      <style>{`
        .live-feed {
          display: flex;
          flex-direction: column;
          background: var(--bg-panel);
          min-height: 0;
        }
        .live-feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-hairline);
        }
        .live-feed-title {
          font-size: 13px;
          font-weight: 600;
        }
        .live-feed-badge {
          font-size: 10px;
          color: var(--status-ok);
          font-family: var(--font-mono);
        }
        .live-feed-list {
          overflow-y: auto;
          flex: 1;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .live-feed-empty {
          padding: 24px 12px;
          font-size: 12px;
          color: var(--text-tertiary);
          line-height: 1.6;
          text-align: center;
        }
        .alert-card {
          background: var(--bg-panel-raised);
          border: 1px solid var(--border-hairline);
          border-left: 3px solid var(--priority-border);
          border-radius: 6px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          color: inherit;
          transition: background 0.15s ease;
        }
        .alert-card:hover {
          background: #212b39;
        }
        .alert-card--selected {
          background: #212b39;
          box-shadow: 0 0 0 1px var(--priority-border);
        }
        .alert-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .alert-card-device {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 500;
        }
        .alert-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
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
        .alert-card-meta {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .alert-card-time {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 4px;
          font-family: var(--font-mono);
        }
      `}</style>
    </aside>
  );
}
