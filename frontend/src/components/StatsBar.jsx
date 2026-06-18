import { AlertTriangle, Activity, MapPin, Zap } from "lucide-react";

export default function StatsBar({ alerts, connected }) {
  const criticalCount = alerts.filter((a) => a.priority === "critico").length;
  const highCount = alerts.filter((a) => a.priority === "alto").length;
  const mediumCount = alerts.filter((a) => a.priority === "medio").length;
  const zones = new Set(alerts.map((a) => a.zone));

  const stats = [
    {
      label: "Alertas Activas",
      value: alerts.length,
      icon: Zap,
      color: "text-accent-cyan",
      bgColor: "bg-accent-cyan/10",
      borderColor: "border-accent-cyan/20",
    },
    {
      label: "Críticas",
      value: criticalCount,
      icon: AlertTriangle,
      color: "text-priority-critico",
      bgColor: "bg-priority-critico/10",
      borderColor: "border-priority-critico/20",
    },
    {
      label: "Prioridad Alta",
      value: highCount,
      icon: Activity,
      color: "text-priority-alto",
      bgColor: "bg-priority-alto/10",
      borderColor: "border-priority-alto/20",
    },
    {
      label: "Zonas Afectadas",
      value: zones.size,
      icon: MapPin,
      color: "text-accent-blue",
      bgColor: "bg-accent-blue/10",
      borderColor: "border-accent-blue/20",
    },
  ];

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-panel/50 border-b border-border-hairline overflow-x-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg ${stat.bgColor} border ${stat.borderColor} min-w-fit transition-all duration-300 hover:scale-[1.02]`}
        >
          <stat.icon className={`w-4 h-4 ${stat.color}`} />
          <div>
            <div className={`text-lg font-bold font-mono ${stat.color} tabular-nums leading-none`}>
              {stat.value}
            </div>
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </div>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-500 font-mono">
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-status-ok animate-pulse-dot" : "bg-priority-alto"}`} />
        MS4 WebSocket
      </div>
    </div>
  );
}
