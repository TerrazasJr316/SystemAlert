import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Map, Radio } from "lucide-react";

// Centro del mapa — ajustar a la ubicación real de la demo
const DEFAULT_CENTER = [20.0553, -99.3455];
const DEFAULT_ZOOM = 14;

// Colores resueltos (Leaflet/SVG no evalúa custom properties CSS)
function resolveColor(priority) {
  const map = {
    critico: "#ef4444",
    alto: "#f59e0b",
    medio: "#3b82f6",
  };
  return map[priority] || map.medio;
}

// Centra el mapa en la alerta más reciente cuando llega
function FlyToLatest({ alerts }) {
  const map = useMap();

  useEffect(() => {
    if (alerts.length > 0) {
      const latest = alerts[0];
      map.flyTo([parseFloat(latest.lat), parseFloat(latest.lon)], DEFAULT_ZOOM, {
        duration: 0.8,
      });
    }
  }, [alerts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function MapPanel({ alerts, selectedAlert, onSelectAlert }) {
  return (
    <div className="flex flex-col min-h-0 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-panel/60 backdrop-blur-sm border-b border-border-hairline z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Map className="w-4 h-4 text-accent-blue" />
          </div>
          <span className="text-sm font-semibold text-gray-200">Mapa en Tiempo Real</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-panel-raised/80 border border-border-hairline">
          <Radio className="w-3 h-3 text-status-ok animate-pulse-dot" />
          <span className="font-mono text-[11px] text-gray-400 tabular-nums">
            {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <FlyToLatest alerts={alerts} />

          {alerts.map((alert, idx) => {
            const lat = parseFloat(alert.lat);
            const lon = parseFloat(alert.lon);
            const isSelected = selectedAlert?.stream_id === alert.stream_id;
            const color = resolveColor(alert.priority);

            return (
              <CircleMarker
                key={`${alert.stream_id}-${idx}`}
                center={[lat, lon]}
                radius={isSelected ? 14 : 10}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.9 : 0.7,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelectAlert(alert),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="font-sans">
                    <div className="font-semibold">{alert.device_id}</div>
                    <div className="text-gray-400">
                      {alert.emergency_type} — {alert.zone}
                    </div>
                    <div className="text-[10px] mt-1 uppercase font-mono font-semibold" style={{ color }}>
                      {alert.priority}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Empty state overlay */}
        {alerts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-panel-raised/80 backdrop-blur border border-border-subtle flex items-center justify-center mb-4">
                <Map className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Esperando alertas...</p>
              <p className="text-gray-600 text-xs mt-1">
                Las alertas del ESP32 aparecerán aquí
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
