import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/securite")({
  head: () => ({ meta: [{ title: "Sécurité — OCP AI Monitor" }] }),
  component: SecuritePage,
});

const ACTIVITY_INIT = [
  { time: "10:42:11", user: "OP-1042", action: "Applied REC-7821 (reduce feed 6%)", source: "Reactor R-204", level: "info" },
  { time: "10:39:02", user: "system", action: "Recommendation generated REC-7821", source: "Decision engine", level: "info" },
  { time: "10:21:48", user: "DS-3105", action: "Promoted model v3.3.0-rc1 → challenger", source: "Registry", level: "warning" },
  { time: "09:58:15", user: "OP-1042", action: "Acknowledged alert A-1004", source: "Column C-12", level: "info" },
  { time: "09:32:00", user: "MG-9001", action: "Exported efficiency report Q2", source: "Management", level: "info" },
];

const NEW_EVENTS = [
  { user: "OP-1042", action: "Viewed dashboard metrics", source: "Dashboard", level: "info" },
  { user: "DS-3105", action: "Triggered drift analysis", source: "Drift Monitor", level: "warning" },
  { user: "system", action: "Auto-retrain job scheduled", source: "Orchestrator", level: "info" },
  { user: "IT-2531", action: "Deployed model v3.3.1", source: "Registry", level: "warning" },
  { user: "MG-9001", action: "Accessed audit log", source: "Audit", level: "info" },
];

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function SecuritePage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [activity, setActivity] = useState(ACTIVITY_INIT);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const ev = NEW_EVENTS[Math.floor(Math.random() * NEW_EVENTS.length)];
      setActivity(prev => [{ time: nowTime(), ...ev }, ...prev].slice(0, 20));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const conformeStatut = pipelineData?.statut === "conforme";
  const warnings = activity.filter(a => a.level === "warning").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sécurité</h1>
        <p className="text-sm text-gray-500 mt-1">Audit & Gouvernance · Immutable decision log · 90 days retention</p>
      </div>

      {/* Bandeau fichier uploadé */}
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
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {/* Bandeau état */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">⚠️ Warning</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE · 1s
          </span>
          <span className="text-xs text-gray-500">Plant 107 · Line 3 · TSP-A</span>
        </div>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{activity.length}</p>
          <p className="text-xs text-gray-500 mt-1">Événements totaux</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-orange-500">{warnings}</p>
          <p className="text-xs text-gray-500 mt-1">Warnings</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">90j</p>
          <p className="text-xs text-gray-500 mt-1">Rétention logs</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Action</th>
              <th className="px-5 py-3 text-left">Source</th>
              <th className="px-5 py-3 text-left">Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activity.map((ev, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{ev.time}</td>
                <td className="px-5 py-3">
                  <span className={`font-mono text-xs font-semibold ${
                    ev.user === "system" ? "text-gray-500" :
                    ev.user.startsWith("OP") ? "text-green-600" :
                    ev.user.startsWith("DS") ? "text-blue-600" :
                    ev.user.startsWith("MG") ? "text-purple-600" :
                    "text-orange-600"
                  }`}>{ev.user}</span>
                </td>
                <td className="px-5 py-3 text-gray-700">{ev.action}</td>
                <td className="px-5 py-3 text-xs text-gray-400">{ev.source}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                    ev.level === "warning"
                      ? "bg-orange-50 text-orange-600 border-orange-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}>
                    {ev.level === "warning" ? "● WARNING" : "INFO"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}