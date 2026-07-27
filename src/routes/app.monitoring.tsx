import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useEffect, useState, useRef } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — OCP AI Monitor" }] }),
  component: MonitoringPage,
});

const MAX_POINTS = 30;

// Construit les capteurs depuis les colonnes réelles du fichier
function buildSensorsFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0)
    .slice(0, 5);

  if (numCols.length === 0) return null;

  const ICONS = ["⚗️", "🌡️", "⚡", "🔄", "💧"];
  const COLORS = ["#8b5cf6", "#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

  return numCols.map((col: any, i: number) => ({
    key: col.col,
    label: col.col,
    unit: "",
    target: parseFloat(col.mean.toFixed(2)),
    min: parseFloat(col.min.toFixed(2)),
    max: parseFloat(col.max.toFixed(2)),
    mean: parseFloat(col.mean.toFixed(2)),
    color: COLORS[i],
    icon: ICONS[i],
  }));
}

// Génère un point temps réel basé sur les stats réelles
function generatePointFromFile(prev: any, sensors: any[]) {
  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  const point: any = { time };
  sensors.forEach(s => {
    const range = s.max - s.min;
    const noise = (Math.random() - 0.5) * range * 0.04;
    const prev_val = prev?.[s.key] ?? s.mean;
    point[s.key] = parseFloat(Math.max(s.min, Math.min(s.max, prev_val + noise)).toFixed(3));
  });
  return point;
}

// Génère un point fallback (sans fichier)
function generatePointFallback(prev: any) {
  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  return {
    time,
    temperature: parseFloat(((prev?.temperature || 95) + (Math.random() - 0.5) * 2).toFixed(1)),
    pression:    parseFloat(((prev?.pression    || 8.4) + (Math.random() - 0.5) * 0.2).toFixed(2)),
    debit:       parseFloat(((prev?.debit       || 142) + (Math.random() - 0.5) * 3).toFixed(1)),
    p2o5:        parseFloat(((prev?.p2o5        || 44.5) + (Math.random() - 0.5) * 0.3).toFixed(2)),
    humidite:    parseFloat(((prev?.humidite    || 3.8) + (Math.random() - 0.5) * 0.2).toFixed(2)),
  };
}

const FALLBACK_SENSORS = [
  { key: "temperature", label: "Température réaction", unit: "°C",  target: 95,   min: 90,  max: 100, color: "#ef4444", icon: "🌡️" },
  { key: "pression",    label: "Pression système",     unit: "bar", target: 8.4,  min: 7.5, max: 9.5, color: "#3b82f6", icon: "⚡" },
  { key: "debit",       label: "Débit acide H3PO4",    unit: "t/h", target: 142,  min: 120, max: 160, color: "#10b981", icon: "🔄" },
  { key: "p2o5",        label: "P2O5 prédit",          unit: "%",   target: 44.5, min: 44,  max: 46,  color: "#8b5cf6", icon: "⚗️" },
  { key: "humidite",    label: "Humidité produit",     unit: "%",   target: 3.8,  min: 0,   max: 5,   color: "#f59e0b", icon: "💧" },
];

function initData(sensors: any[], fromFile: boolean) {
  const points: any[] = [];
  let prev: any = null;
  for (let i = 0; i < 20; i++) {
    prev = fromFile ? generatePointFromFile(prev, sensors) : generatePointFallback(prev);
    points.push(prev);
  }
  return points;
}

function MonitoringPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const fileSensors = pipelineData ? buildSensorsFromFile(pipelineData) : null;
  const sensors     = fileSensors ?? FALLBACK_SENSORS;
  const fromFile    = !!fileSensors;

  const [data, setData]   = useState<any[]>(() => initData(sensors, fromFile));
  const [live, setLive]   = useState(true);
  const intervalRef       = useRef<any>(null);

  // Réinitialise quand un nouveau fichier est uploadé
  useEffect(() => {
    return store.subscribe(() => {
      const d = store.getResult();
      setPipelineData(d);
      if (d) {
        const s = buildSensorsFromFile(d);
        if (s) setData(initData(s, true));
      }
    });
  }, []);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => {
        setData(prev => {
          const last = prev[prev.length - 1];
          const newPt = fromFile
            ? generatePointFromFile(last, sensors)
            : generatePointFallback(last);
          const updated = [...prev, newPt];
          return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
        });
      }, 2000);
    }
    return () => clearInterval(intervalRef.current);
  }, [live, fromFile, sensors]);

  const last = data[data.length - 1] || {};

  const getStatus = (key: string) => {
    const s = sensors.find((s: any) => s.key === key);
    if (!s) return "ok";
    const v = last[key];
    if (v === undefined) return "ok";
    if (v < s.min || v > s.max) return "error";
    const margin = (s.max - s.min) * 0.08;
    if (v < s.min + margin || v > s.max - margin) return "warning";
    return "ok";
  };

  const alertCount = sensors.filter((s: any) => getStatus(s.key) !== "ok").length;
  const conformeStatut = pipelineData?.statut === "conforme";

  // Groupes de graphiques : 2 premiers en area, puis line chart combiné
  const chartSensors = sensors.slice(0, 4);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Temps Réel</h1>
          <p className="text-sm text-gray-500 mt-1">
            {fromFile
              ? `${pipelineData.fichier} · ${pipelineData.lignes} lignes · colonnes auto-détectées`
              : "Ligne 107 DEF · Jorf Lasfar · Auto-actualisation toutes les 2s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
              ⚠️ {alertCount} alerte{alertCount > 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => setLive(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${live ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            <span className={`w-2 h-2 rounded-full ${live ? "bg-white animate-pulse" : "bg-gray-400"}`} />
            {live ? "LIVE" : "PAUSE"}
          </button>
        </div>
      </div>

      {/* Bandeau fichier */}
      {pipelineData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-blue-600 font-semibold text-sm">📂 {pipelineData.fichier}</span>
          <span className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono font-bold text-green-700">
            P2O5 {pipelineData.p2o5 > 0 ? `${pipelineData.p2o5}%` : "—"}
          </span>
          <span className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono text-blue-700">
            {pipelineData.lignes} lignes · {pipelineData.colonnes} colonnes
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${conformeStatut ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {pipelineData.statut?.toUpperCase()}
          </span>
          {fromFile && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              🔗 {sensors.length} capteurs depuis le fichier
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour monitorer vos vraies colonnes en temps réel
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {sensors.map((s: any) => {
          const v = last[s.key];
          const status = getStatus(s.key);
          return (
            <div key={s.key} className={`bg-white rounded-xl border-2 p-4 shadow-sm transition-all ${
              status === "error"   ? "border-red-300 bg-red-50" :
              status === "warning" ? "border-yellow-300 bg-yellow-50" :
              "border-gray-200"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className={`w-2 h-2 rounded-full ${
                  status === "ok"      ? "bg-green-400" :
                  status === "warning" ? "bg-yellow-400 animate-pulse" :
                  "bg-red-500 animate-pulse"
                }`} />
              </div>
              <p className="text-xs text-gray-500 mb-1 truncate">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {v !== undefined ? v : "—"}
              </p>
              <p className="text-xs text-gray-400">{s.unit} · cible {s.target}</p>
            </div>
          );
        })}
      </div>

      {/* Graphiques — 2x2 adaptatifs */}
      <div className="grid lg:grid-cols-2 gap-4">
        {chartSensors.map((s: any, i: number) => {
          const status = getStatus(s.key);
          const isArea = i < 2;
          const gradId = `grad_${i}`;

          return (
            <div key={s.key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{s.icon} {s.label}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  status === "ok" ? "bg-green-100 text-green-700" :
                  status === "warning" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {last[s.key] !== undefined ? `${last[s.key]}${s.unit ? ` ${s.unit}` : ""}` : "—"}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                {isArea ? (
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={s.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Area type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} name={`${s.label}${s.unit ? ` (${s.unit})` : ""}`} />
                  </AreaChart>
                ) : (
                  <LineChart data={data}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} name={`${s.label}${s.unit ? ` (${s.unit})` : ""}`} />
                  </LineChart>
                )}
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2">
                Plage : {s.min} – {s.max}{s.unit ? ` ${s.unit}` : ""} · Rolling 60s
              </p>
            </div>
          );
        })}
      </div>

      {/* Statut capteurs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">
          📊 Statut des capteurs {fromFile ? `— ${pipelineData.fichier}` : ""}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {sensors.map((s: any) => {
            const status = getStatus(s.key);
            return (
              <div key={s.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{s.label}</p>
                  <p className="text-xs text-gray-400">
                    {last[s.key] !== undefined ? `${last[s.key]}${s.unit ? ` ${s.unit}` : ""}` : "—"}
                  </p>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  status === "ok"      ? "bg-green-400" :
                  status === "warning" ? "bg-yellow-400 animate-pulse" :
                  "bg-red-500 animate-pulse"
                }`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}