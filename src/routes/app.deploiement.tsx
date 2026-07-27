import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/deploiement")({
  head: () => ({ meta: [{ title: "Déploiement — OCP AI Monitor" }] }),
  component: DeploiementPage,
});

const DAGS_INIT = [
  { id: "dag-001", name: "feature_materialization", schedule: "*/5 * * * *", lastRun: "2m ago", status: "ok" },
  { id: "dag-002", name: "drift_detection", schedule: "0 * * * *", lastRun: "12m ago", status: "ok" },
  { id: "dag-003", name: "nightly_retrain", schedule: "0 2 * * *", lastRun: "8h ago", status: "ok" },
  { id: "dag-004", name: "lims_sync", schedule: "*/15 * * * *", lastRun: "12m ago", status: "late" },
  { id: "dag-005", name: "model_canary_eval", schedule: "@hourly", lastRun: "32m ago", status: "ok" },
];

function DeploiementPage() {
  const [dags, setDags] = useState(DAGS_INIT);
  const [triggered, setTriggered] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setDags(prev => prev.map(d => ({
        ...d,
        lastRun: d.status === "ok"
          ? `${Math.floor(Math.random() * 30 + 1)}m ago`
          : d.lastRun,
      })));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const triggerDag = (id: string) => {
    setTriggered(id);
    setDags(prev => prev.map(d => d.id === id ? { ...d, status: "running", lastRun: "just now" } : d));
    setTimeout(() => {
      setDags(prev => prev.map(d => d.id === id ? { ...d, status: "ok", lastRun: "0m ago" } : d));
      setTriggered(null);
    }, 3000);
  };

  const okCount = dags.filter(d => d.status === "ok").length;
  const lateCount = dags.filter(d => d.status === "late").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Déploiement</h1>
        <p className="text-sm text-gray-500 mt-1">DAGs · schedules · last execution — Ligne 107 DEF</p>
      </div>

      {/* Bandeau */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">⚠️ Warning</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE · 6s
          </span>
          <span className="text-xs text-gray-500">Plant 107 · Line 3 · TSP-A</span>
        </div>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">{okCount}</p>
          <p className="text-xs text-gray-500 mt-1">DAGs OK</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-orange-500">{lateCount}</p>
          <p className="text-xs text-gray-500 mt-1">En retard</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-700">{dags.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total DAGs</p>
        </div>
      </div>

      {/* Table DAGs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Scheduled tasks</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3 text-left">DAG</th>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Schedule</th>
              <th className="px-5 py-3 text-left">Last Run</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dags.map(dag => (
              <tr key={dag.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-mono text-gray-500 text-xs">{dag.id}</td>
                <td className="px-5 py-4 font-medium text-gray-800">{dag.name}</td>
                <td className="px-5 py-4 font-mono text-xs text-gray-500">{dag.schedule}</td>
                <td className="px-5 py-4 text-xs text-gray-500">{dag.lastRun}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                    dag.status === "ok" ? "bg-green-50 text-green-700 border-green-200" :
                    dag.status === "running" ? "bg-blue-50 text-blue-600 border-blue-200 animate-pulse" :
                    "bg-orange-50 text-orange-600 border-orange-200"
                  }`}>
                    {dag.status === "ok" ? "● OK" : dag.status === "running" ? "⏳ RUNNING" : "● LATE"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => triggerDag(dag.id)}
                    disabled={triggered === dag.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    ▶ Trigger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}