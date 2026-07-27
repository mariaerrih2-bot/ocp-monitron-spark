import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/app/modeles")({
  head: () => ({ meta: [{ title: "Comparaison modèles — OCP AI Monitor" }] }),
  component: ModelesPage,
});

function ModelesPage() {
  const [modeles, setModeles] = useState([
    { version: "v3.2.1", stage: "champion", r2: 0.926, rmse: 0.418, trained: "2025-04-12", by: "ds.morel" },
    { version: "v3.3.0-rc1", stage: "challenger", r2: 0.931, rmse: 0.404, trained: "2025-04-18", by: "ds.haddad" },
    { version: "v3.1.4", stage: "archived", r2: 0.918, rmse: 0.434, trained: "2025-03-29", by: "ds.morel" },
    { version: "v3.0.7", stage: "archived", r2: 0.905, rmse: 0.461, trained: "2025-02-14", by: "ds.zhang" },
  ]);

  const handlePromote = (version: string) => {
    setModeles(prev => prev.map(m => ({
      ...m,
      stage: m.version === version ? "champion" : m.stage === "champion" ? "archived" : m.stage,
    })));
  };

  const handleRestore = (version: string) => {
    setModeles(prev => prev.map(m => ({
      ...m,
      stage: m.version === version ? "challenger" : m.stage,
    })));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comparaison modèles</h1>
        <p className="text-sm text-gray-500 mt-1">Registre des modèles — tsp-runaway · Ligne 107 DEF</p>
      </div>

      {/* KPIs champion vs challenger */}
      {(() => {
        const champion = modeles.find(m => m.stage === "champion");
        const challenger = modeles.find(m => m.stage === "challenger");
        return champion && challenger ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border-2 border-green-300 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏆</span>
                <span className="text-xs font-bold text-green-700 uppercase">Champion actuel</span>
              </div>
              <p className="font-mono text-xl font-bold text-gray-800 mb-2">{champion.version}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-gray-400">R²</p><p className="font-bold text-green-600">{champion.r2}</p></div>
                <div><p className="text-xs text-gray-400">RMSE</p><p className="font-bold text-gray-700">{champion.rmse}</p></div>
                <div><p className="text-xs text-gray-400">Entraîné le</p><p className="text-gray-600">{champion.trained}</p></div>
                <div><p className="text-xs text-gray-400">Par</p><p className="font-mono text-gray-600">{champion.by}</p></div>
              </div>
            </div>
            <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔄</span>
                <span className="text-xs font-bold text-blue-600 uppercase">Challenger</span>
              </div>
              <p className="font-mono text-xl font-bold text-gray-800 mb-2">{challenger.version}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-gray-400">R²</p><p className={`font-bold ${challenger.r2 > champion.r2 ? "text-green-600" : "text-orange-500"}`}>{challenger.r2} {challenger.r2 > champion.r2 ? "↑" : "↓"}</p></div>
                <div><p className="text-xs text-gray-400">RMSE</p><p className={`font-bold ${challenger.rmse < champion.rmse ? "text-green-600" : "text-orange-500"}`}>{challenger.rmse} {challenger.rmse < champion.rmse ? "↑" : "↓"}</p></div>
                <div><p className="text-xs text-gray-400">Entraîné le</p><p className="text-gray-600">{challenger.trained}</p></div>
                <div><p className="text-xs text-gray-400">Par</p><p className="font-mono text-gray-600">{challenger.by}</p></div>
              </div>
              <button onClick={() => handlePromote(challenger.version)} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-all">
                Promouvoir en champion
              </button>
            </div>
          </div>
        ) : null;
      })()}

      {/* Tableau registre */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Modèles enregistrés</h2>
          <p className="text-xs text-gray-400">tsp-runaway</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left px-5 py-3">Version</th>
              <th className="text-left px-5 py-3">Statut</th>
              <th className="text-left px-5 py-3">R²</th>
              <th className="text-left px-5 py-3">RMSE</th>
              <th className="text-left px-5 py-3">Entraîné le</th>
              <th className="text-left px-5 py-3">Par</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {modeles.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-mono font-semibold text-gray-800">{m.version}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                    m.stage === "champion" ? "bg-green-50 text-green-700 border-green-200" :
                    m.stage === "challenger" ? "bg-blue-50 text-blue-600 border-blue-200" :
                    "bg-orange-50 text-orange-500 border-orange-200"
                  }`}>
                    {m.stage === "champion" ? "🏆 CHAMPION" : m.stage === "challenger" ? "🔄 CHALLENGER" : "🗃️ ARCHIVÉ"}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-gray-700">{m.r2}</td>
                <td className="px-5 py-4 font-mono text-gray-700">{m.rmse}</td>
                <td className="px-5 py-4 text-gray-500">{m.trained}</td>
                <td className="px-5 py-4 font-mono text-gray-500">{m.by}</td>
                <td className="px-5 py-4">
                  {m.stage === "challenger" && (
                    <button onClick={() => handlePromote(m.version)} className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                      Promouvoir
                    </button>
                  )}
                  {m.stage === "archived" && (
                    <button onClick={() => handleRestore(m.version)} className="border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                      Restaurer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}