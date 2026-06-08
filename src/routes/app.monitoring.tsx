import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useEffect, useState, useRef } from "react";
import { PageHeader, KpiCard, StatusPill } from "@/components/ui-bits";

export const Route = createFileRoute("/app/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — OCP AI Monitor" }] }),
  component: MonitoringPage,
});

const MAX_POINTS = 30;

function generatePoint(prev: any) {
  const now = new Date();
  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return {
    time,
    temperature: parseFloat(((prev?.temperature || 95) + (Math.random() - 0.5) * 2).toFixed(1)),
    pression: parseFloat(((prev?.pression || 8.4) + (Math.random() - 0.5) * 0.2).toFixed(2)),
    debit: parseFloat(((prev?.debit || 142) + (Math.random() - 0.5) * 3).toFixed(1)),
    p2o5: parseFloat(((prev?.p2o5 || 44.5) + (Math.random() - 0.5) * 0.3).toFixed(2)),
    humidite: parseFloat(((prev?.humidite || 3.8) + (Math.random() - 0.5) * 0.2).toFixed(2)),
  };
}

function MonitoringPage() {
  const [data, setData] = useState<any[]>(() => {
    const points = [];
    let prev = null;
    for (let i = 0; i < 20; i++) { prev = generatePoint(prev); points.push(prev); }
    return points;
  });
  const [live, setLive] = useState(true);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => {
        setData(prev => {
          const last = prev[prev.length - 1];
          const newPoint = generatePoint(last);
          const updated = [...prev, newPoint];
          return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
        });
      }, 2000);
    }
    return () => clearInterval(intervalRef.current);
  }, [live]);

  const last = data[data.length - 1] || {};

  const sensors = [
    { key: "temperature", label: "Température réaction", unit: "°C", target: 95, min: 90, max: 100, color: "#ef4444", icon: "🌡️" },
    { key: "pression", label: "Pression système", unit: "bar", target: 8.4, min: 7.5, max: 9.5, color: "#3b82f6", icon: "⚡" },
    { key: "debit", label: "Débit acide H3PO4", unit: "t/h", target: 142, min: 120, max: 160, color: "#10b981", icon: "🔄" },
    { key: "p2o5", label: "P2O5 prédit", unit: "%", target: 44.5, min: 44, max: 46, color: "#8b5cf6", icon: "⚗️" },
    { key: "humidite", label: "Humidité produit", unit: "%", target: 3.8, min: 0, max: 5, color: "#f59e0b", icon: "💧" },
  ];

  const getStatus = (key: string) => {
    const s = sensors.find(s => s.key === key);
    if (!s) return "ok";
    const v = last[key];
    if (v < s.min || v > s.max) return "error";
    if (v < s.min * 1.05 || v > s.max * 0.95) return "warning";
    return "ok";
  };

  const alertCount = sensors.filter(s => getStatus(s.key) !== "ok").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Temps Réel</h1>
          <p className="text-sm text-gray-500 mt-1">Ligne 107 DEF · Jorf Lasfar · Auto-actualisation toutes les 2s</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {sensors.map(s => {
          const v = last[s.key];
          const status = getStatus(s.key);
          return (
            <div key={s.key} className={`bg-white rounded-xl border-2 p-4 shadow-sm transition-all ${status === "error" ? "border-red-300 bg-red-50" : status === "warning" ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className={`w-2 h-2 rounded-full ${status === "ok" ? "bg-green-400" : status === "warning" ? "bg-yellow-400" : "bg-red-400"}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{v ?? "—"}</p>
              <p className="text-xs text-gray-400">{s.unit} · cible {s.target}</p>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Température */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">🌡️ Température réaction</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatus("temperature") === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {last.temperature}°C
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis domain={[88, 102]} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} fill="url(#tempGrad)" dot={false} name="Température (°C)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Seuil normal : 90–100°C · Rolling 90s window</p>
        </div>

        {/* Pression */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">⚡ Pression système</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatus("pression") === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {last.pression} bar
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="presGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis domain={[7, 10]} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="pression" stroke="#3b82f6" strokeWidth={2} fill="url(#presGrad)" dot={false} name="Pression (bar)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Seuil normal : 7.5–9.5 bar · Rolling 90s window</p>
        </div>

        {/* Débit */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">🔄 Débit acide H3PO4</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatus("debit") === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {last.debit} t/h
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="debitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis domain={[115, 165]} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="debit" stroke="#10b981" strokeWidth={2} fill="url(#debitGrad)" dot={false} name="Débit (t/h)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Seuil normal : 120–160 t/h · Rolling 90s window</p>
        </div>

        {/* P2O5 + Humidité */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">⚗️ P2O5 & Humidité</h3>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">{last.p2o5}%</span>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">{last.humidite}%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis yAxisId="p" domain={[43, 46]} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <YAxis yAxisId="h" orientation="right" domain={[2, 6]} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line yAxisId="p" type="monotone" dataKey="p2o5" stroke="#8b5cf6" strokeWidth={2} dot={false} name="P2O5 (%)" />
              <Line yAxisId="h" type="monotone" dataKey="humidite" stroke="#f59e0b" strokeWidth={2} dot={false} name="Humidité (%)" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">P2O5 ≥ 44% · Humidité &lt; 5%</p>
        </div>
      </div>

      {/* Statut capteurs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Statut des capteurs</h3>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {sensors.map(s => {
            const status = getStatus(s.key);
            return (
              <div key={s.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{s.label}</p>
                  <p className="text-xs text-gray-400">{last[s.key]} {s.unit}</p>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status === "ok" ? "bg-green-400" : status === "warning" ? "bg-yellow-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}