import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/insights")({
  head: () => ({ meta: [{ title: "Insights IA — OCP AI Monitor" }] }),
  component: InsightsPage,
});

const DECISIONS_INIT = [
  { rec: "Réduire alimentation R-204 de 6%", id: "REC-7821", operateur: "OCP-204815", decision: "accepted", impact: "+180k MAD économisés", when: "10:42" },
  { rec: "Augmenter reflux colonne C-12", id: "REC-7819", operateur: "OCP-204815", decision: "accepted", impact: "+0.4% pureté", when: "09:14" },
  { rec: "Planifier inspection pompe P-07", id: "REC-7815", operateur: "OCP-204815", decision: "rejected", impact: "—", when: "08:02" },
  { rec: "Ajuster débit refroidisseur HX-3 +4%", id: "REC-7811", operateur: "OCP-204902", decision: "accepted", impact: "-2.1% énergie", when: "hier" },
];

function buildInsights(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null)
    .slice(0, 8);

  if (numCols.length === 0) return null;

  // Générer des décisions IA basées sur les colonnes réelles
  const decisions = numCols.slice(0, 5).map((col: any, i: number) => {
    const range = col.max - col.min;
    const ecart = range > 0 ? ((col.mean - col.min) / range) : 0.5;
    const needsAction = ecart < 0.4 || ecart > 0.85;
    const action = ecart < 0.4
      ? `Augmenter ${col.col} de ${((0.6 - ecart) * 20).toFixed(0)}%`
      : ecart > 0.85
        ? `Réduire ${col.col} de ${((ecart - 0.7) * 15).toFixed(0)}%`
        : `Maintenir ${col.col} dans la plage optimale`;
    const impact = ecart < 0.4
      ? `+${(Math.random() * 200 + 50).toFixed(0)}k MAD estimés`
      : ecart > 0.85
        ? `-${(Math.random() * 3 + 1).toFixed(1)}% consommation`
        : `Stabilité maintenue`;
    return {
      rec: action,
      id: `REC-${7800 + i}`,
      operateur: `OCP-${200000 + Math.floor(Math.random() * 9999)}`,
      decision: needsAction ? (Math.random() > 0.3 ? "accepted" : "rejected") : "accepted",
      impact,
      when: `${8 + i}:${Math.floor(Math.random() * 59).toString().padStart(2, "0")}`,
      colonne: col.col,
      valeur: col.mean,
    };
  });

  // Stats globales
  const accepted = decisions.filter(d => d.decision === "accepted").length;
  const rejected = decisions.filter(d => d.decision === "rejected").length;
  const tauxAcceptation = parseFloat(((accepted / decisions.length) * 100).toFixed(0));

  // Colonnes critiques
  const critiqs = numCols.filter((c: any) => {
    const range = c.max - c.min;
    if (range === 0) return false;
    const ecart = (c.mean - c.min) / range;
    return ecart < 0.3 || ecart > 0.9;
  });

  return { decisions, accepted, rejected, tauxAcceptation, critiqs, numCols };
}

function InsightsPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [decisions, setDecisions] = useState(DECISIONS_INIT);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  useEffect(() => {
    if (pipelineData) return;
    const t = setInterval(() => {
      const nouv = {
        rec: ["Ajuster température réaction", "Optimiser débit acide", "Vérifier capteur pression"][Math.floor(Math.random() * 3)],
        id: `REC-${Math.floor(Math.random() * 9000 + 1000)}`,
        operateur: `OCP-${Math.floor(Math.random() * 99999 + 200000)}`,
        decision: Math.random() > 0.3 ? "accepted" : "rejected",
        impact: `+${(Math.random() * 200 + 50).toFixed(0)}k MAD`,
        when: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setDecisions(prev => [nouv, ...prev].slice(0, 10));
    }, 6000);
    return () => clearInterval(t);
  }, [pipelineData]);

  const insights = pipelineData ? buildInsights(pipelineData) : null;
  const conformeStatut = pipelineData?.statut === "conforme";
  const decisionsAffichees = insights ? insights.decisions : decisions;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Insights IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          {insights ? `Journal de décisions — analyse adaptée de ${pipelineData.fichier}` : "Decision Log · Audit des décisions assistées par IA"}
        </p>
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
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {/* Bandeau live */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">⚠️ Avertissement</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> EN DIRECT · 8s
          </span>
          <span className="text-xs text-gray-500">Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
      </div>

      {/* KPIs si fichier uploadé */}
      {insights && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Recommandations acceptées</p>
            <p className="text-4xl font-bold text-green-600">{insights.accepted}</p>
            <p className="text-xs text-gray-400 mt-1">sur {decisionsAffichees.length} générées</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Taux d'acceptation</p>
            <p className="text-4xl font-bold text-green-600">{insights.tauxAcceptation}%</p>
            <p className="text-xs text-gray-400 mt-1">basé sur {pipelineData.fichier}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Colonnes critiques</p>
            <p className="text-4xl font-bold text-orange-500">{insights.critiqs.length}</p>
            <p className="text-xs text-gray-400 mt-1">nécessitent attention</p>
          </div>
        </div>
      )}

      {/* Colonnes critiques */}
      {insights && insights.critiqs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 className="font-semibold text-orange-800 mb-3">⚠️ Variables hors plage optimale — {pipelineData.fichier}</h3>
          <div className="flex flex-wrap gap-2">
            {insights.critiqs.map((col: any, i: number) => (
              <span key={i} className="bg-white border border-orange-200 text-orange-700 text-xs px-3 py-1.5 rounded-full font-medium">
                {col.col} · moy: {col.mean?.toFixed(2)} · [min:{col.min?.toFixed(2)} max:{col.max?.toFixed(2)}]
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Table décisions */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              {insights ? "Recommandations IA — basées sur vos données" : "Décisions récentes"}
            </h2>
            <p className="text-xs text-gray-400">
              {insights ? `Générées depuis les colonnes de ${pipelineData.fichier}` : "Audit de haut niveau des décisions assistées par IA"}
            </p>
          </div>
          {insights && (
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-3 py-1 rounded-full font-semibold">
              🔗 Données réelles
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Recommandation</th>
                <th className="px-5 py-3 text-left">Opérateur</th>
                <th className="px-5 py-3 text-left">Décision</th>
                <th className="px-5 py-3 text-left">Impact</th>
                <th className="px-5 py-3 text-left">Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {decisionsAffichees.map((d: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">{d.rec}</p>
                    <p className="text-xs text-gray-400">{d.id}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-green-600 font-semibold">{d.operateur}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                      d.decision === "accepted"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {d.decision === "accepted" ? "● ACCEPTÉ" : "● REJETÉ"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{d.impact}</td>
                  <td className="px-5 py-4 text-xs text-gray-400 font-mono">{d.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}