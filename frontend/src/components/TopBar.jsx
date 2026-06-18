import { useEffect, useState } from "react";
import { Shield, Wifi, WifiOff, Clock } from "lucide-react";

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

  const formattedDate = time.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="relative flex items-center justify-between px-6 py-3.5 bg-panel border-b border-border-hairline">
      {/* Gradient accent line at the top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-blue opacity-60" />

      <div className="flex items-center gap-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-blue/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {connected && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-ok rounded-full border-2 border-panel animate-pulse-dot" />
            )}
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-wide text-white">
              C5 <span className="text-gray-500">/</span>{" "}
              <span className="bg-gradient-to-r from-accent-blue to-accent-cyan bg-clip-text text-transparent">
                Centro de Mando
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              Sistema de Alertas en Tiempo Real
            </p>
          </div>
        </div>

        {/* Connection status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300
            ${
              connected
                ? "bg-status-ok/10 text-status-ok border border-status-ok/20"
                : "bg-priority-alto/10 text-priority-alto border border-priority-alto/20 animate-pulse"
            }`}
        >
          {connected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {connected ? "Sistema en línea" : "Reconectando..."}
        </div>
      </div>

      {/* Clock */}
      <div className="flex items-center gap-3 text-gray-400">
        <div className="text-right">
          <div className="font-mono text-sm font-medium text-gray-300 tabular-nums">
            {formattedTime}
          </div>
          <div className="text-[10px] text-gray-500 capitalize">{formattedDate}</div>
        </div>
        <Clock className="w-4 h-4 text-gray-500" />
      </div>
    </header>
  );
}
