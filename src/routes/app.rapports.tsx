import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/rapports")({
  head: () => ({ meta: [{ title: "Rapports & Exports — OCP AI Monitor" }] }),
  component: RapportsPage,
});

const RAPPORTS_INIT = [
  { nom: "Executive summary mai 2025", id: "EXE-2025-05", categorie: "Executive summary", date: "2025-05-31 18:02", format: "PDF", taille: "8 pages · 1.1 MB", statut: "generated" },
  { nom: "ROI IA — Q1 2025", id: "ROI-Q1-2025", categorie: "ROI IA", date: "2025-04-04 09:11", format: "Excel", taille: "24 pages · 2.7 MB", statut: "generated" },
  { nom: "KPI mensuel avril 2025", id: "KPI-2025-04", categorie: "KPI mensuel", date: "2025-05-02 07:00", format: "PDF", taille: "16 pages · 1.6 MB", statut: "generated" },
  { nom: "Rapport énergétique — Plant 107", id: "ENR-2025-05", categorie: "Rapport énergétique", date: "2025-05-15 12:38", format: "Excel", taille: "12 pages · 980 KB", statut: "generated" },
  { nom: "Incidents évités semaine 19", id: "INC-2025-05", categorie: "Rapport incidents", date: "2025-05-12 14:38", format: "PDF", taille: "6 pages · 540 KB", statut: "generated" },
  { nom: "Performance modèles avril", id: "MOD-2025-04", categorie: "Modèles IA", date: "2025-05-01 06:00", format: "CSV", taille: "18 458 lignes · 2.2 MB", statut: "generated" },
  { nom: "Explicabilité SHAP — TSP-A", id: "SHAP-2025-05", categorie: "SHAP / Explainability", date: "2025-05-06 22:14", format: "PDF", taille: "14 pages · 1.3 MB", statut: "generated" },
  { nom: "Performance usine semaine 19", id: "PERF-WK19", categorie: "Performance usine", date: "2025-05-11 06:00", format: "Excel", taille: "—", statut: "failed" },
];

const CONTENU_BUSINESS = [
  "OEE & disponibilité", "Optimisation énergétique", "Incidents évités", "Adoption IA",
  "Décisions opérateur", "Statistiques anomalies", "Performance modèles", "ROI métier",
  "Évolution drift PSI", "Efficience production", "Impact des recommandations",
];

function buildRapportsFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null)
    .slice(0, 6);

  if (numCols.length === 0) return null;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const rapports = [
    {
      nom: `Analyse automatique — ${pipelineData.fichier}`,
      id: `AUTO-${dateStr}`,
      categorie: "Executive summary",
      date: `${dateStr} ${timeStr}`,
      format: "PDF",
      taille: `${pipelineData.lignes} lignes · ${pipelineData.colonnes} colonnes`,
      statut: "generated",
      fromFile: true,
    },
    {
      nom: `Rapport P2O5 — ${pipelineData.fichier}`,
      id: `P2O5-${dateStr}`,
      categorie: "KPI mensuel",
      date: `${dateStr} ${timeStr}`,
      format: "Excel",
      taille: `${pipelineData.lignes} lignes · ${numCols.length} variables`,
      statut: pipelineData.p2o5 > 0 ? "generated" : "failed",
      fromFile: true,
    },
    {
      nom: `Statistiques colonnes — ${pipelineData.fichier}`,
      id: `STAT-${dateStr}`,
      categorie: "Modèles IA",
      date: `${dateStr} ${timeStr}`,
      format: "CSV",
      taille: `${numCols.length} colonnes numériques analysées`,
      statut: "generated",
      fromFile: true,
    },
    {
      nom: `Conformité qualité — ${pipelineData.fichier}`,
      id: `CONF-${dateStr}`,
      categorie: "ROI IA",
      date: `${dateStr} ${timeStr}`,
      format: "PDF",
      taille: `Statut : ${pipelineData.statut?.toUpperCase()}`,
      statut: pipelineData.statut === "conforme" ? "generated" : "failed",
      fromFile: true,
    },
  ];

  // Contenu business adapté aux colonnes du fichier
  const contenuAdapte = numCols.map((c: any) => `${c.col} — moy: ${c.mean?.toFixed(2)}`);

  return { rapports, contenuAdapte, numCols };
}

function RapportsPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [relance, setRelance] = useState<string | null>(null);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  const fileData = pipelineData ? buildRapportsFromFile(pipelineData) : null;
  const rapportsAffichees = fileData
    ? [...fileData.rapports, ...RAPPORTS_INIT]
    : RAPPORTS_INIT;

  const conformeStatut = pipelineData?.statut === "conforme";

  const handleRelancer = (id: string) => {
    setRelance(id);
    setTimeout(() => setRelance(null), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Exports</h1>
        <p className="text-sm text-gray-500 mt-1">Exports exécutifs, rapports industriels et gouvernance IA</p>
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
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> EN DIRECT · 2s
          </span>
          <span className="text-xs text-gray-500">Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
      </div>

      {/* Table rapports */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Rapports exécutifs</h2>
            <p className="text-xs text-gray-400">Historique des exports business, ROI et gouvernance IA</p>
          </div>
          {fileData && (
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-3 py-1 rounded-full font-semibold">
              🔗 {fileData.rapports.length} rapports générés depuis {pipelineData.fichier}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Rapport</th>
                <th className="px-5 py-3 text-left">Catégorie</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Format</th>
                <th className="px-5 py-3 text-left">Pages / Taille</th>
                <th className="px-5 py-3 text-left">Statut</th>
                <th className="px-5 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rapportsAffichees.map((r: any, i: number) => (
                <tr key={i} className={`hover:bg-gray-50 ${r.fromFile ? "bg-blue-50/30" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📄</span>
                      <div>
                        <p className="font-medium text-gray-800">{r.nom}</p>
                        <p className="text-xs text-gray-400">{r.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{r.categorie}</td>
                  <td className="px-5 py-4 text-xs text-gray-500 font-mono">{r.date}</td>
                  <td className="px-5 py-4">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono">{r.format}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{r.taille}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                      r.statut === "generated"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {r.statut === "generated" ? "● GÉNÉRÉ" : "● ÉCHEC"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {r.statut === "generated" ? (
                      <button className="text-xs px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center gap-1">
                        ⬇ Télécharger
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRelancer(r.id)}
                        className="text-xs px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                      >
                        {relance === r.id ? "⏳ En cours..." : "🔄 Relancer"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contenu business */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Contenu business des rapports</h2>
        <p className="text-xs text-gray-400 mb-4">
          {fileData ? `Indicateurs extraits de ${pipelineData.fichier}` : "Indicateurs et données disponibles à l'export exécutif"}
        </p>
        <div className="flex flex-wrap gap-2">
          {(fileData ? fileData.contenuAdapte : CONTENU_BUSINESS).map((item: string, i: number) => (
            <span key={i} className={`text-xs px-4 py-2 rounded-lg border font-medium ${
              fileData ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-700 border-gray-200"
            }`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}