import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import MapPanel from "./components/MapPanel.jsx";
import LiveFeed from "./components/LiveFeed.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import TopBar from "./components/TopBar.jsx";
import "./App.css";

// ─────────────────────────────────────────
// URLs de los servicios — ajustar si el
// dashboard se sirve desde un host distinto
// al de Docker Compose
// ─────────────────────────────────────────
const MS4_WS_URL = import.meta.env.VITE_MS4_URL || "http://localhost:4000";
const MS5_API_URL = import.meta.env.VITE_MS5_URL || "http://localhost:5000";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // ─────────────────────────────────────────
  // Conexión WebSocket a MS4
  // ─────────────────────────────────────────
  useEffect(() => {
    const socket = io(MS4_WS_URL);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("new_alert", (alert) => {
      const withTimestamp = { ...alert, _receivedAt: Date.now() };
      setLiveAlerts((prev) => [withTimestamp, ...prev].slice(0, 50)); // máx 50 en memoria
    });

    return () => socket.disconnect();
  }, []);

  const handleSelectAlert = useCallback((alert) => {
    setSelectedAlert(alert);
  }, []);

  return (
    <div className="app-shell">
      <TopBar connected={connected} />

      <main className="app-main">
        <MapPanel
          alerts={liveAlerts}
          selectedAlert={selectedAlert}
          onSelectAlert={handleSelectAlert}
        />
        <LiveFeed
          alerts={liveAlerts}
          selectedAlert={selectedAlert}
          onSelectAlert={handleSelectAlert}
        />
      </main>

      <HistoryPanel apiUrl={MS5_API_URL} />
    </div>
  );
}
