import { useState, useEffect, useCallback } from "react";
import {
  History,
  RefreshCw,
  Filter,
  ChevronDown,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";

const PRIORITY_LABEL = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
};

export default function HistoryPanel({ apiUrl }) {
  const [incidents, setIncidents] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (priorityFilter) params.set("priority", priorityFilter);
    if (zoneFilter) params.set("zone", zoneFilter);
    
    if (fromDate) {
      const d = new Date(fromDate + "T00:00:00");
      params.set("from", d.toISOString());
    }
    if (toDate) {
      const d = new Date(toDate + "T23:59:59");
      params.set("to", d.toISOString());
    }
    
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
  }, [apiUrl, priorityFilter, zoneFilter, fromDate, toDate]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000); // refresca cada 5s
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  return (
    <section
      className={`bg-panel border-t border-border-hairline transition-all duration-300 ${
        isExpanded ? "max-h-[320px]" : "max-h-[52px]"
      } flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-hairline shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <History className="w-4 h-4 text-accent-blue" />
          </div>
          <span className="text-sm font-semibold text-gray-200">Historial de Incidentes</span>
          <span className="text-[10px] font-mono text-gray-500 bg-panel-raised px-2 py-0.5 rounded-md border border-border-hairline">
            {incidents.length} registros
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Filter className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
            
            {/* Rango de Fechas */}
            <div className="flex items-center bg-panel-raised border border-border-hairline rounded-lg px-2 hover:border-border-subtle transition-colors focus-within:border-accent-blue/50">
              <Calendar className="w-3 h-3 text-gray-500 mr-1" />
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-gray-300 text-xs py-1.5 font-sans focus:outline-none placeholder-gray-600 [color-scheme:dark]"
                title="Fecha inicio"
              />
              <span className="text-gray-500 text-xs mx-1">-</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-gray-300 text-xs py-1.5 font-sans focus:outline-none placeholder-gray-600 [color-scheme:dark]"
                title="Fecha fin"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-panel-raised border border-border-hairline text-gray-300 text-xs px-2.5 py-1.5 rounded-lg font-sans appearance-none cursor-pointer hover:border-border-subtle transition-colors focus:outline-none focus:border-accent-blue/50"
            >
              <option value="">Toda prioridad</option>
              <option value="critico">Crítico</option>
              <option value="alto">Alto</option>
              <option value="medio">Medio</option>
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-panel-raised border border-border-hairline text-gray-300 text-xs px-2.5 py-1.5 rounded-lg font-sans appearance-none cursor-pointer hover:border-border-subtle transition-colors focus:outline-none focus:border-accent-blue/50"
            >
              <option value="">Toda zona</option>
              <option value="Norte">Norte</option>
              <option value="Sur">Sur</option>
              <option value="Centro">Centro</option>
              <option value="Oriente">Oriente</option>
              <option value="Poniente">Poniente</option>
            </select>
          </div>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 bg-panel-raised border border-border-hairline text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:text-gray-200 hover:border-border-subtle transition-all duration-200 disabled:opacity-50 group"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 transition-transform ${
                loading ? "animate-spin" : "group-hover:rotate-45"
              }`}
            />
            Actualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-6 py-2 bg-priority-critico/5 border-b border-priority-critico/10 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-priority-critico shrink-0" />
          <span className="text-xs text-priority-critico">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-hairline">
              <th className="text-left text-gray-500 font-medium text-[11px] uppercase tracking-wider px-6 py-2.5 sticky top-0 bg-panel">
                ID
              </th>
              <th className="text-left text-gray-500 font-medium text-[11px] uppercase tracking-wider px-4 py-2.5 sticky top-0 bg-panel">
                Dispositivo
              </th>
              <th className="text-left text-gray-500 font-medium text-[11px] uppercase tracking-wider px-4 py-2.5 sticky top-0 bg-panel">
                Zona
              </th>
              <th className="text-left text-gray-500 font-medium text-[11px] uppercase tracking-wider px-4 py-2.5 sticky top-0 bg-panel">
                Tipo
              </th>
              <th className="text-left text-gray-500 font-medium text-[11px] uppercase tracking-wider px-4 py-2.5 sticky top-0 bg-panel">
                Prioridad
              </th>
              <th className="text-left text-gray-500 font-medium text-[11px] uppercase tracking-wider px-4 py-2.5 sticky top-0 bg-panel">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr
                key={inc.id}
                className="border-b border-border-hairline/50 hover:bg-panel-raised/50 transition-colors duration-150"
              >
                <td className="px-6 py-2.5 font-mono text-gray-400">#{inc.id}</td>
                <td className="px-4 py-2.5">
                  <span className="font-mono text-gray-300 bg-panel-raised px-2 py-0.5 rounded border border-border-hairline">
                    {inc.device_id}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-300">{inc.zone}</td>
                <td className="px-4 py-2.5 text-gray-400 capitalize">{inc.emergency_type}</td>
                <td className="px-4 py-2.5">
                  <span className={`priority-pill priority-pill--${inc.priority}`}>
                    {PRIORITY_LABEL[inc.priority] || inc.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">
                  {new Date(inc.created_at).toLocaleString("es-MX")}
                </td>
              </tr>
            ))}

            {/* Loading state */}
            {loading && incidents.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-500 animate-spin mx-auto" />
                  <p className="text-gray-500 text-xs mt-2">Cargando historial...</p>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!loading && incidents.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <FileText className="w-5 h-5 text-gray-600 mx-auto" />
                  <p className="text-gray-500 text-xs mt-2">
                    No hay incidentes con los filtros actuales
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
