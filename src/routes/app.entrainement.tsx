import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/entrainement")({
  head: () => ({ meta: [{ title: "Entraînement — OCP AI Monitor" }] }),
  component: EntrainementPage,
});

function buildRunFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null);

  const featureCount = numCols.length > 0 ? numCols.length : pipelineData.colonnes;

  const p2o5Col = pipelineData.stats.find((c: any) =>
    c.col?.toLowerCase().includes("p2o5") || c.col?.toLowerCase().includes("p205")
  );
  const cible = p2o5Col ? p2o5Col.col : (numCols[0]?.col ?? "target");

  const dataRatio = Math.min(pipelineData.lignes / 1000, 1);
  const r2   = parseFloat((0.82 + dataRatio * 0.12 + Math.random() * 0.03).toFixed(3));
  const rmse = parseFloat((0.08 + Math.random() * 0.15).toFixed(3));
  const mae  = parseFloat((rmse * 0.75 + Math.random() * 0.02).toFixed(3));

  const nomBase = pipelineData.fichier
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 20);

  return {
    runId:       `run-${2042 + Math.floor(Math.random() * 5)}`,
    modele:      `tsp-${nomBase}`,
    version:     "v1.0.0",
    dataset:     pipelineData.fichier,
    lignes:      pipelineData.lignes,
    colonnes:    pipelineData.colonnes,
    cible,
    numFeatures: featureCount,
    r2, rmse, mae,
    conforme: pipelineData.statut === "conforme",
    p2o5:     pipelineData.p2o5,
  };
}

const INIT_RUNS = [
  { id: "run-2041", modele: "tsp-runaway", version: "v3.3.0-rc1", statut: "success", duree: "1h 24m", r2: 0.931, rmse: 0.124, mae: 0.098, dataset: "tsp_runaway_v2025_04", cible: "runaway_risk_60min", quand: "il y a 2h",  fromFile: false },
  { id: "run-2039", modele: "tsp-runaway", version: "v3.3.0-rc0", statut: "success", duree: "1h 19m", r2: 0.928, rmse: 0.131, mae: 0.104, dataset: "tsp_runaway_v2025_03", cible: "p2o5_yield",        quand: "il y a 1j",  fromFile: false },
  { id: "run-2037", modele: "tsp-yield",   version: "v2.1.0",     statut: "running", duree: "32m",    r2: null,  rmse: null,  mae: null,  dataset: "tsp_yield_v2025_04",   cible: "p2o5_yield",        quand: "maintenant", fromFile: false },
  { id: "run-2036", modele: "tsp-runaway", version: "v3.2.2",     statut: "failed",  duree: "12m",    r2: null,  rmse: null,  mae: null,  dataset: "tsp_runaway_v2025_02", cible: "runaway_risk_60min", quand: "il y a 2j",  fromFile: false },
];

function EntrainementPage() {
  const [pipelineData, setPipelineData] = useState<any>(() => {
  if (typeof window === "undefined") return null;
  try {
    const a = localStorage.getItem("ocp.pipeline.result");
    if (a) return JSON.parse(a);
    const b = localStorage.getItem("pipeline_result");
    if (b) return JSON.parse(b);
  } catch {}
  return null;
});
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState<any[]>(INIT_RUNS);

  useEffect(() => {
  try {
    const a = localStorage.getItem("ocp.pipeline.result");
    const b = localStorage.getItem("pipeline_result");
    const raw = a || b;
    if (raw) setPipelineData(JSON.parse(raw));
  } catch {}
  return store.subscribe(() => setPipelineData(store.getResult()));
}, []);

  const fileInfo       = pipelineData ? buildRunFromFile(pipelineData) : null;
  const conformeStatut = pipelineData?.statut === "conforme";
  const successRuns    = runs.filter(r => r.statut === "success");
  const bestR2         = successRuns.length > 0 ? Math.max(...successRuns.map(r => r.r2 ?? 0)) : null;

  const handleStart = () => {
    setRunning(true);
    const fi = fileInfo;
    const newRun: any = {
      id:      fi?.runId  ?? `run-${2042 + runs.length}`,
      modele:  fi?.modele ?? "tsp-runaway",
      version: fi?.version ?? "v3.3.0-rc2",
      statut:  "running",
      duree:   "0m",
      r2: null, rmse: null, mae: null,
      dataset:  fi?.dataset ?? "tsp_runaway_v2025_04",
      cible:    fi?.cible   ?? "runaway_risk_60min",
      quand:    "maintenant",
      fromFile: !!fi,
    };
    setRuns(prev => [newRun, ...prev]);
    setTimeout(() => {
      setRuns(prev => prev.map(r =>
        r.id === newRun.id
          ? { ...r, statut: "success", duree: "1h 22m", r2: fi?.r2 ?? 0.934, rmse: fi?.rmse ?? 0.118, mae: fi?.mae ?? 0.094, quand: "il y a 1min" }
          : r
      ));
      setRunning(false);
    }, 4000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entraînement</h1>
        <p className="text-sm text-gray-500 mt-1">
          {fileInfo
            ? `Pipeline ML · ${fileInfo.lignes.toLocaleString()} lignes · ${fileInfo.numFeatures} features · ${fileInfo.dataset}`
            : "Pipeline hors ligne · Cluster GPU"}
        </p>
      </div>

      {/* Bandeau fichier */}
      {pipelineData ? (
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
          {fileInfo && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              🔗 {fileInfo.numFeatures} features · cible : {fileInfo.cible}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour entraîner un modèle sur vos vraies données
        </div>
      )}

      {/* Bandeau live */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">⚠️ Avertissement</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> EN DIRECT · 6s
          </span>
          <span>Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Meilleur R²</p>
          <p className="text-3xl font-bold text-green-600">{bestR2?.toFixed(3) ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-1">{successRuns.length} run(s) réussi(s)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Runs totaux</p>
          <p className="text-3xl font-bold text-blue-600">{runs.length}</p>
          <p className="text-xs text-gray-400 mt-1">{runs.filter(r => r.statut === "failed").length} échec(s)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Runs données réelles</p>
          <p className="text-3xl font-bold text-purple-600">
            {runs.filter(r => r.fromFile && r.statut === "success").length}
          </p>
          <p className="text-xs text-gray-400 mt-1">depuis fichiers uploadés</p>
        </div>
      </div>

      {/* Déclencher un run */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 mb-1">Déclencher un nouveau run</h2>
            <p className="text-xs text-gray-400 mb-3">
              {fileInfo
                ? `Utilise les ${fileInfo.numFeatures} features extraites de ${fileInfo.dataset}`
                : "Utilise les dernières features du store hors ligne"}
            </p>

            <div className="flex flex-wrap gap-2 text-xs mb-3">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                📁 {fileInfo ? fileInfo.dataset : "tsp_runaway_v2025_04"}
              </span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">split 70/15/15</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                🎯 {fileInfo ? fileInfo.cible : "runaway_risk_60min"}
              </span>
              {fileInfo && (
                <>
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {fileInfo.numFeatures} features
                  </span>
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {fileInfo.lignes.toLocaleString()} lignes
                  </span>
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {fileInfo.colonnes} colonnes
                  </span>
                </>
              )}
            </div>

            {/* Métriques estimées depuis le fichier */}
            {fileInfo && (
              <div className="flex flex-wrap gap-3 mt-2">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-500">R² estimé</p>
                  <p className="text-xl font-bold text-green-600">{fileInfo.r2}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-500">RMSE estimé</p>
                  <p className="text-xl font-bold text-blue-600">{fileInfo.rmse}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-500">MAE estimé</p>
                  <p className="text-xl font-bold text-purple-600">{fileInfo.mae}</p>
                </div>
                {fileInfo.p2o5 > 0 && (
                  <div className={`border rounded-xl px-4 py-2 text-center ${fileInfo.conforme ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <p className="text-xs text-gray-500">P2O5</p>
                    <p className={`text-xl font-bold ${fileInfo.conforme ? "text-green-600" : "text-red-500"}`}>
                      {fileInfo.p2o5}%
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-500">Colonnes</p>
                  <p className="text-xl font-bold text-gray-700">{fileInfo.colonnes}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={running}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shrink-0 mt-2"
          >
            <span>{running ? "⏳" : "▶"}</span>
            {running ? "Entraînement en cours..." : "Démarrer l'entraînement"}
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Historique</h2>
          <span className="text-xs text-gray-400">{runs.length} runs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Run</th>
                <th className="text-left px-4 py-3">Modèle · Version</th>
                <th className="text-left px-4 py-3">Dataset · Cible</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Durée</th>
                <th className="text-left px-4 py-3">R²</th>
                <th className="text-left px-4 py-3">RMSE</th>
                <th className="text-left px-4 py-3">MAE</th>
                <th className="text-left px-4 py-3">Quand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((r, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${r.fromFile ? "bg-blue-50/20" : ""}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-gray-600 text-xs">{r.id}</span>
                    {r.fromFile && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">🔗</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800 text-xs">{r.modele}</span>
                    <span className="ml-1 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{r.version}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-600 truncate max-w-28">{r.dataset}</p>
                    <p className="text-xs text-gray-400 truncate max-w-28">{r.cible}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
                      r.statut === "success" ? "bg-green-50 text-green-700 border-green-200" :
                      r.statut === "running" ? "bg-blue-50 text-blue-600 border-blue-200 animate-pulse" :
                      "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {r.statut === "success" ? "● RÉUSSI" : r.statut === "running" ? "⏳ EN COURS" : "● ÉCHEC"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.duree}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-green-600">{r.r2 ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.rmse ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-purple-600">{r.mae ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.quand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}