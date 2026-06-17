import { useState, useEffect } from "react";
import { Bell, Cpu, MapPin, Clock, ChevronRight } from "lucide-react";

const PRIORITY_LABEL = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
};

const PRIORITY_ICON_BG = {
  critico: "bg-priority-critico/20 border-priority-critico/30",
  alto: "bg-priority-alto/20 border-priority-alto/30",
  medio: "bg-priority-medio/20 border-priority-medio/30",
};

const PRIORITY_ICON_COLOR = {
  critico: "text-priority-critico",
  alto: "text-priority-alto",
  medio: "text-priority-medio",
};

function TimeAgo({ timestamp }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return <span className="text-status-ok">ahora</span>;
  if (seconds < 60) return <span>hace {seconds}s</span>;
  const minutes = Math.floor(seconds / 60);
  return <span>hace {minutes}min</span>;
}

export default function LiveFeed({ alerts, selectedAlert, onSelectAlert }) {
  return (
    <aside className="flex flex-col min-h-0 bg-panel border-l border-border-hairline">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-hairline bg-panel/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-priority-critico/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-priority-critico" />
          </div>
          <span className="text-sm font-semibold text-gray-200">Alertas en Vivo</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-status-ok/10 border border-status-ok/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-ok opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-ok" />
          </span>
          <span className="text-[10px] font-mono text-status-ok font-medium">EN VIVO</span>
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-panel-raised border border-border-subtle flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Sin alertas</p>
            <p className="text-gray-600 text-xs mt-1 text-center px-4">
              Las notificaciones del ESP32 aparecerán aquí en tiempo real
            </p>
          </div>
        )}

        {alerts.map((alert, idx) => {
          const isSelected = selectedAlert?.stream_id === alert.stream_id;
          const iconColor = PRIORITY_ICON_COLOR[alert.priority] || PRIORITY_ICON_COLOR.medio;
          const iconBg = PRIORITY_ICON_BG[alert.priority] || PRIORITY_ICON_BG.medio;

          return (
            <button
              key={`${alert.stream_id}-${idx}`}
              onClick={() => onSelectAlert(alert)}
              className={`
                w-full text-left p-3.5 rounded-xl border transition-all duration-200 animate-slide-in group
                ${
                  isSelected
                    ? "bg-panel-hover border-accent-blue/30 shadow-lg shadow-accent-blue/5"
                    : "bg-panel-raised border-border-hairline hover:bg-panel-hover hover:border-border-subtle"
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Priority icon */}
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconBg}`}
                >
                  <Bell className={`w-4 h-4 ${iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-gray-500" />
                      <span className="font-mono text-xs font-medium text-gray-200">
                        {alert.device_id}
                      </span>
                    </div>
                    <span className={`priority-pill priority-pill--${alert.priority}`}>
                      {PRIORITY_LABEL[alert.priority] || alert.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {alert.zone}
                    </span>
                    <span>·</span>
                    <span>{alert.emergency_type}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
                      <Clock className="w-3 h-3" />
                      <TimeAgo timestamp={alert._receivedAt} />
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${
                        isSelected ? "translate-x-0.5 text-accent-blue" : "group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
