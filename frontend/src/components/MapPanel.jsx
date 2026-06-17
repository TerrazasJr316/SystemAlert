import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";

// Centro del mapa — ajustar a la ubicación real de la demo
const DEFAULT_CENTER = [20.0553, -99.3455];
const DEFAULT_ZOOM = 14;

const PRIORITY_COLOR = {
  critico: "var(--priority-critico)",
  alto: "var(--priority-alto)",
  medio: "var(--priority-medio)",
};

// Resuelve variables CSS a su valor real porque Leaflet/SVG
// no siempre re-evalúa custom properties dentro de su canvas
function resolveColor(priority) {
  const map = {
    critico: "#e0483e",
    alto: "#e0a23e",
    medio: "#3e8de0",
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
    <div className="map-panel">
      <div className="map-panel-header">
        <span className="map-panel-title">Mapa en tiempo real</span>
        <span className="map-panel-count">{alerts.length} alertas activas</span>
      </div>

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
              radius={isSelected ? 12 : 9}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelectAlert(alert),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <div className="map-tooltip">
                  <strong>{alert.device_id}</strong> · {alert.priority}
                  <br />
                  {alert.emergency_type} — {alert.zone}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <style>{`
        .map-panel {
          display: flex;
          flex-direction: column;
          background: var(--bg-panel);
          border-right: 1px solid var(--border-hairline);
          min-height: 0;
        }
        .map-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-hairline);
        }
        .map-panel-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .map-panel-count {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .map-tooltip {
          font-family: var(--font-sans);
          font-size: 12px;
          line-height: 1.5;
        }
        .leaflet-container {
          background: #0b0f14 !important;
        }
        .leaflet-tooltip {
          background: var(--bg-panel-raised) !important;
          border: 1px solid var(--border-hairline) !important;
          color: var(--text-primary) !important;
          border-radius: 6px !important;
        }
        .leaflet-tooltip::before {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
