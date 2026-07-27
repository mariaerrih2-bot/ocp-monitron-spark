import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/featurestore")({
  head: () => ({ meta: [{ title: "Feature Store — OCP AI Monitor" }] }),
  component: FeatureStorePage,
});

function buildFeaturesFromFile(pipelineData: any) {
  if (!pipelineData?.stats || !pipelineData?.headers) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null);
  const txtCols = pipelineData.stats
    .filter((s: any) => s.type === "texte");

  // Génère les features depuis les colonnes réelles
  const features = pipelineData.stats.map((col: any) => {
    const isNum = col.type === "numérique";
    const range = isNum ? (col.max - col.min) : 0;
    const ecart = (isNum && range > 0) ? (col.mean - col.min) / range : 0.5;

    // Détermine la source selon le nom de la colonne
    const n = col.col.toLowerCase();
    const source =
      n.includes("temp")  || n.includes("pres") || n.includes("debit") || n.includes("flow")  ? "sensor" :
      n.includes("p2o5")  || n.includes("cao")  || n.includes("mgo")   || n.includes("so4")   ? "lab"    :
      n.includes("date")  || n.includes("time")  || n.includes("heure")                        ? "system" :
      n.includes("model") || n.includes("pred")  || n.includes("score")                        ? "model"  :
      n.includes("ratio") || n.includes("delta") || n.includes("grad")                         ? "derived": "sensor";

    // Fraîcheur selon le type de source
    const freshness =
      source === "sensor"  ? `${(Math.random() * 2 + 0.5).toFixed(1)}s` :
      source === "lab"     ? `${Math.floor(Math.random() * 15 + 5)}m`   :
      source === "model"   ? `${(Math.random() * 3 + 1).toFixed(1)}s`   :
      source === "derived" ? `${(Math.random() * 4 + 1).toFixed(1)}s`   : "1d";

    const serving = source === "system" ? "offline" : "online+offline";

    const status = isNum && ecart > 0.85 ? "critical" :
                   isNum && ecart < 0.15 ? "warning"  : "ok";

    return {
      nom: col.col,
      type: isNum ? "float" : "string",
      source,
      freshness,
      serving,
      status,
      mean: isNum ? col.mean?.toFixed(3) : null,
      min:  isNum ? col.min?.toFixed(3)  : null,
      max:  isNum ? col.max?.toFixed(3)  : null,
    };
  });

  const onlineCount = features.filter((f: any) => f.serving === "online+offline").length;
  const pariteCount = pipelineData.lignes;

  return { features, onlineCount, pariteCount, numCols, txtCols };
}

const FALLBACK_FEATURES = [
  { nom: "reactor_temp_grad_60s", type: "float", source: "sensor",    freshness: "1.2s", serving: "online+offline", status: "ok"       },
  { nom: "coolant_flow_lag",      type: "float", source: "derived",   freshness: "2.1s", serving: "online+offline", status: "ok"       },
  { nom: "catalyst_activity_ix",  type: "float", source: "lab+model", freshness: "12m",  serving: "online+offline", status: "warning"  },
  { nom: "feed_c2c3_ratio",       type: "float", source: "GC",        freshness: "4m",   serving: "online+offline", status: "ok"       },
  { nom: "ambient_humidity",      type: "float", source: "weather",   freshness: "5m",   serving: "online+offline", status: "ok"       },
  { nom: "operator_shift_id",     type: "string",source: "HR",        freshness: "1d",   serving: "offline",        status: "ok"       },
  { nom: "p2o5_predicted",        type: "float", source: "model",     freshness: "2s",   serving: "online+offline", status: "ok"       },
  { nom: "slurry_density",        type: "float", source: "sensor",    freshness: "1.5s", serving: "online+offline", status: "critical" },
  { nom: "acid_flow_f1",          type: "float", source: "sensor",    freshness: "1s",   serving: "online+offline", status: "ok"       },
  { nom: "granule_size_d50",      type: "float", source: "lab",       freshness: "15m",  serving: "offline",        status: "ok"       },
];

function FeatureStorePage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("ALL");
  const [filterServing, setFilterServing] = useState("ALL");

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  const fileData  = pipelineData ? buildFeaturesFromFile(pipelineData) : null;
  const allFeatures: any[] = fileData?.features ?? FALLBACK_FEATURES;
  const conformeStatut = pipelineData?.statut === "conforme";

  // Sources disponibles
  const sources = ["ALL", ...Array.from(new Set(allFeatures.map((f: any) => f.source)))];

  const filtered = allFeatures.filter((f: any) => {
    const matchSearch  = f.nom.toLowerCase().includes(search.toLowerCase());
    const matchSource  = filterSource  === "ALL" || f.source  === filterSource;
    const matchServing = filterServing === "ALL" || f.serving === filterServing;
    return matchSearch && matchSource && matchServing;
  });

  const onlineCount  = fileData?.onlineCount  ?? allFeatures.filter((f: any) => f.serving === "online+offline").length;
  const pariteCount  = fileData?.pariteCount  ?? 142;
  const criticalCount = allFeatures.filter((f: any) => f.status === "critical").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feature Store</h1>
        <p className="text-sm text-gray-500 mt-1">
          {fileData
            ? `Catalogue généré depuis ${pipelineData.fichier} — ${allFeatures.length} features détectées`
            : "Catalogue des variables — vue tsp-runaway"}
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
          {fileData && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              🔗 {allFeatures.length} features · {fileData.numCols.length} numériques · {fileData.txtCols.length} texte
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour générer le catalogue depuis vos vraies colonnes
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{allFeatures.length}</p>
          <p className="text-xs text-gray-500 mt-1">Features totales</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-blue-600">{onlineCount}</p>
          <p className="text-xs text-gray-500 mt-1">Online + Offline</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-600">{pariteCount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {fileData ? "Lignes de données" : "Online + Offline parité"}
          </p>
        </div>
        <div className={`bg-white border rounded-xl p-4 shadow-sm text-center ${criticalCount > 0 ? "border-red-200" : "border-gray-200"}`}>
          <p className={`text-3xl font-bold ${criticalCount > 0 ? "text-red-500" : "text-green-600"}`}>
            {criticalCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">Features critiques</p>
        </div>
      </div>

      {/* Catalogue */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">Catalogue</h2>
            <p className="text-xs text-gray-400">
              {fileData ? `${pipelineData.fichier} feature view` : "tsp-runaway feature view"}
            </p>
          </div>

          {/* Filtres */}
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            {sources.map(s => <option key={s} value={s}>{s === "ALL" ? "Toutes sources" : s}</option>)}
          </select>
          <select
            value={filterServing}
            onChange={e => setFilterServing(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="ALL">Tout serving</option>
            <option value="online+offline">Online + Offline</option>
            <option value="offline">Offline only</option>
          </select>
          <input
            type="text"
            placeholder="Rechercher une feature..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-5 py-3">Feature</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Source</th>
                <th className="text-left px-5 py-3">Fraîcheur</th>
                {fileData && <th className="text-left px-5 py-3">Moy / [Min, Max]</th>}
                <th className="text-left px-5 py-3">Serving</th>
                <th className="text-left px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((f: any, i: number) => (
                <tr key={i} className={`hover:bg-gray-50 ${f.status === "critical" ? "bg-red-50/30" : f.status === "warning" ? "bg-yellow-50/30" : ""}`}>
                  <td className="px-5 py-3 font-mono text-gray-800 text-xs">{f.nom}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{f.type}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                      {f.source}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{f.freshness}</td>
                  {fileData && (
                    <td className="px-5 py-3 text-xs font-mono text-gray-600">
                      {f.mean !== null
                        ? <span><span className="text-blue-600 font-bold">{f.mean}</span> <span className="text-gray-400">[{f.min}, {f.max}]</span></span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
                      f.serving === "online+offline"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {f.serving === "online+offline" ? "● ONLINE + OFFLINE" : "OFFLINE ONLY"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
                      f.status === "critical" ? "bg-red-100 text-red-600 border-red-200" :
                      f.status === "warning"  ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {f.status === "critical" ? "● CRITIQUE" : f.status === "warning" ? "● ALERTE" : "● OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm">Aucune feature trouvée pour "{search}"</p>
          </div>
        )}

        <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-right">
          {filtered.length} feature{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""} sur {allFeatures.length}
        </div>
      </div>
    </div>
  );
}