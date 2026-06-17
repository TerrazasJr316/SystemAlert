import { useEffect, useState } from "react";

export default function TopBar({ connected }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">
          C5 <span className="topbar-title-accent">/</span> Centro de Mando
        </span>
        <div className="topbar-status">
          <span
            className={`status-dot ${connected ? "status-dot--ok" : "status-dot--down"}`}
            aria-hidden="true"
          />
          {connected ? "Sistema en línea" : "Reconectando..."}
        </div>
      </div>
      <div className="topbar-right">
        <span className="topbar-clock">{formattedTime}</span>
      </div>
      <style>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: var(--bg-panel);
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .topbar-title {
          font-family: var(--font-mono);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .topbar-title-accent {
          color: var(--text-tertiary);
        }
        .topbar-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot--ok {
          background: var(--status-ok);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-ok) 20%, transparent);
        }
        .status-dot--down {
          background: var(--priority-alto);
        }
        .topbar-clock {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </header>
  );
}
