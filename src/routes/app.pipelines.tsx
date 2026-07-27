import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/pipelines")({
  head: () => ({ meta: [{ title: "Pipelines Data — OCP AI Monitor" }] }),
  component: PipelinesPage,
});

function PipelinesPage() {
  const [pipelines, setPipelines] = useState([
    { id: 1, nom: "PLC → Kafka ingestion", statut: "running", lag: "0.4s", debit: "11.2k msg/s" },
    { id: 2, nom: "Kafka → Feature Store (online)", statut: "running", lag: "0.2s", debit: "9.8k msg/s" },
    { id: 3, nom: "Batch ETL (LIMS join)", statut: "lagging", lag: "12m behind", debit: "—" },
    { id: 4, nom: "Decision log → Audit", statut: "running", lag: "0.1s", debit: "240 ev/s" },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setPipelines(prev => prev.map(p => ({
        ...p,
        lag: p.statut === "running" ? `${(Math.random() * 0.8).toFixed(1)}s` : p.lag,
        debit: p.statut === "running" && p.debit !== "—" ? p.debit : p.debit,
      })));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipelines Data</h1>
        <p className="text-sm text-gray-500 mt-1">ETL · streaming · audit — Ligne 107 DEF</p>
      </div>

      {/* Bandeau */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">⚠️ Avertissement</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> EN DIRECT · 1s
          </span>
          <span>Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mode : Consultatif</span>
          <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
        </div>
      </div>

      {/* Pipelines actifs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pipelines actifs</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {pipelines.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{p.nom}</p>
              </div>
              <span className={`text-xs px-4 py-1.5 rounded-full font-semibold border min-w-32 text-center ${
                p.statut === "running" ? "bg-green-50 text-green-700 border-green-200" :
                p.statut === "lagging" ? "bg-orange-50 text-orange-600 border-orange-200" :
                "bg-red-50 text-red-600 border-red-200"
              }`}>
                {p.statut === "running" ? "● EN COURS" : p.statut === "lagging" ? "● EN RETARD" : "● ARRÊTÉ"}
              </span>
              <span className="text-sm text-gray-500 w-32 text-right font-mono">retard {p.lag}</span>
              <span className="text-sm text-gray-500 w-28 text-right font-mono">{p.debit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{pipelines.filter(p => p.statut === "running").length}</p>
          <p className="text-xs text-gray-500 mt-1">Pipelines actifs</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-orange-500">{pipelines.filter(p => p.statut === "lagging").length}</p>
          <p className="text-xs text-gray-500 mt-1">En retard</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-700">21k</p>
          <p className="text-xs text-gray-500 mt-1">msg/s total</p>
        </div>
      </div>
    </div>
  );
}