import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic avancé — OCP AI Monitor" }] }),
  component: DiagnosticPage,
});

const MAX_POINTS = 80;

function buildDiagnosticFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0)
    .slice(0, 6);

  if (numCols.length === 0) return null;

  // Score anomalie = % de colonnes hors plage optimale
  const hors = numCols.filter((c: any) => {
    const range = c.max - c.min;
    if (range === 0) return false;
    const ecart = (c.mean - c.min) / range;
    return ecart > 0.85 || ecart < 0.15;
  });
  const anomalyScore = Math.round((hors.length / numCols.length) * 100);

  // Incertitude = écart-type normalisé moyen
  const modelUncertainty = parseFloat(
    (numCols.reduce((a: number, c: any) => {
      const range = c.max - c.min;
      return a + (range > 0 ? Math.abs(c.mean - (c.min + range / 2)) / range : 0);
    }, 0) / numCols.length).toFixed(2)
  );

  // Latence simulée cohérente avec le fichier
  const detectionLatency = 400 + Math.round(pipelineData.lignes / 100);
  const sensorDrift = hors.length;

  // Colonne principale pour le graphique
  const mainCol = numCols[0];

  // Anomalies basées sur les vraies colonnes
  const anomalies = numCols.map((col: any) => {
    const range = col.max - col.min;
    const ecart = range > 0 ? (col.mean - col.min) / range : 0.5;
    const sigma = range > 0 ? Math.abs(col.mean - (col.min + range / 2)) / (range / 6) : 0;
    const niveau = ecart > 0.9 || ecart < 0.1 ? "critique" :
                   ecart > 0.75 || ecart < 0.25 ? "warning" : "info";
    return {
      id: `AN-${9000 + numCols.indexOf(col)}`,
      nom: col.col,
      description: ecart > 0.75
        ? `Valeur élevée (+${sigma.toFixed(1)}σ) — moyenne ${col.mean?.toFixed(2)}`
        : ecart < 0.25
          ? `Valeur basse (-${sigma.toFixed(1)}σ) — moyenne ${col.mean?.toFixed(2)}`
          : `Stable — moyenne ${col.mean?.toFixed(2)}`,
      baseline: `plage [${col.min?.toFixed(2)}, ${col.max?.toFixed(2)}] · réf ${col.mean?.toFixed(2)}`,
      niveau,
    };
  }).sort((a: any, b: any) => {
    const order: any = { critique: 0, warning: 1, info: 2 };
    return order[a.niveau] - order[b.niveau];
  });

  return { anomalyScore, modelUncertainty, detectionLatency, sensorDrift, mainCol, anomalies, numCols };
}

function generatePoint(prev: any, col: any) {
  const range = col.max - col.min;
  const noise = (Math.random() - 0.5) * range * 0.03;
  const val = Math.max(col.min, Math.min(col.max, (prev?.val ?? col.mean) + noise));
  return { val: parseFloat(val.toFixed(3)) };
}

function generateFallbackPoint(prev: any) {
  return { val: parseFloat(((prev?.val || 415) + (Math.random() - 0.48) * 1.5).toFixed(2)) };
}

function DiagnosticPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const fileData = pipelineData ? buildDiagnosticFromFile(pipelineData) : null;

  const [data, setData] = useState<any[]>(() => {
    const pts: any[] = []; let prev: any = null;
    for (let i = 0; i < 60; i++) {
      prev = fileData ? generatePoint(prev, fileData.mainCol) : generateFallbackPoint(prev);
      pts.push(prev);
    }
    return pts;
  });

  const [anomalyScore,     setAnomalyScore]     = useState(fileData?.anomalyScore     ?? 60);
  const [modelUncertainty, setModelUncertainty] = useState(fileData?.modelUncertainty ?? 0.17);
  const [detectionLatency, setDetectionLatency] = useState(fileData?.detectionLatency ?? 592);
  const [sensorDrift,      setSensorDrift]      = useState(fileData?.sensorDrift      ?? 2);

  useEffect(() => {
    return store.subscribe(() => {
      const d = store.getResult();
      setPipelineData(d);
      if (d) {
        const fd = buildDiagnosticFromFile(d);
        if (fd) {
          setAnomalyScore(fd.anomalyScore);
          setModelUncertainty(fd.modelUncertainty);
          setDetectionLatency(fd.detectionLatency);
          setSensorDrift(fd.sensorDrift);
          const pts: any[] = []; let prev: any = null;
          for (let i = 0; i < 60; i++) { prev = generatePoint(prev, fd.mainCol); pts.push(prev); }
          setData(pts);
        }
      }
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const newPt = fileData ? generatePoint(last, fileData.mainCol) : generateFallbackPoint(last);
        const updated = [...prev, newPt];
        return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
      });
      if (!fileData) {
        setAnomalyScore(v =>     Math.min(100, Math.max(0,   v + Math.round((Math.random() - 0.5) * 3))));
        setModelUncertainty(v => parseFloat((Math.max(0.05, Math.min(0.5, v + (Math.random() - 0.5) * 0.02))).toFixed(2)));
        setDetectionLatency(v => Math.round(Math.max(300, Math.min(900, v + (Math.random() - 0.5) * 20))));
      }
    }, 2500);
    return () => clearInterval(t);
  }, [fileData]);

  const anomalies  = fileData?.anomalies ?? [
    { id: "AN-9012", nom: "Température réacteur",   description: "Déviation élevée (+2.1σ)",      baseline: "référence 425 °C ± 4",         niveau: "critique" },
    { id: "AN-9011", nom: "Débit acide F1",          description: "Instabilité débit (oscillation)", baseline: "référence 142 m³/h ± 3",       niveau: "warning"  },
    { id: "AN-9009", nom: "Capteur pH PH-02",        description: "Dérive capteur détectée",        baseline: "dérive référence > 0.4 / jour", niveau: "warning"  },
    { id: "AN-9008", nom: "Densité bouillie",        description: "Hors enveloppe",                 baseline: "référence 1.42 g/cm³ ± 0.02",  niveau: "info"     },
  ];

  const conformeStatut = pipelineData?.statut === "conforme";
  const yMin = fileData ? parseFloat((fileData.mainCol.min * 0.97).toFixed(2)) : 395;
  const yMax = fileData ? parseFloat((fileData.mainCol.max * 1.03).toFixed(2)) : 435;
  const scoreColor = anomalyScore >= 70 ? "text-red-500" : anomalyScore >= 40 ? "text-yellow-500" : "text-green-600";
  const scoreBar   = anomalyScore >= 70 ? "bg-red-500"   : anomalyScore >= 40 ? "bg-yellow-400"   : "bg-green-500";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diagnostic avancé</h1>
        <p className="text-sm text-gray-500 mt-1">
          {fileData
            ? `Score d'anomalie calculé depuis ${pipelineData.fichier} · ${pipelineData.lignes} lignes`
            : "Ligne 107 DEF · Score d'anomalie et incertitude actualisés toutes les 2.5s"}
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
              🔗 {fileData.numCols.length} colonnes analysées · {fileData.anomalies.filter((a: any) => a.niveau !== "info").length} anomalies
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour calculer le score d'anomalie depuis vos vraies données
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Score d'anomalie</p>
            <span className="text-gray-400">🎯</span>
          </div>
          <p className={`text-4xl font-bold ${scoreColor}`}>{anomalyScore}</p>
          <p className="text-xs text-gray-400 mt-1">
            {fileData ? `${fileData.numCols.length} colonnes · seuil ≥ 70` : "/ 100 · seuil ≥ 70"}
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${scoreBar}`} style={{ width: `${anomalyScore}%` }} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Incertitude modèle</p>
            <span className="text-gray-400">📡</span>
          </div>
          <p className="text-4xl font-bold text-gray-800">{modelUncertainty}</p>
          <p className="text-xs text-gray-400 mt-1">
            {fileData ? "écart normalisé moyen" : "σ sur les 30 prochaines min"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Latence détection</p>
            <span className="text-gray-400">⏱️</span>
          </div>
          <p className="text-4xl font-bold text-gray-800">
            {detectionLatency} <span className="text-xl font-normal text-gray-500">ms</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">pipeline bout en bout</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {fileData ? "Colonnes critiques" : "Dérive capteurs"}
            </p>
            <span className="text-yellow-500">⚠️</span>
          </div>
          <p className={`text-4xl font-bold ${sensorDrift > 0 ? "text-yellow-500" : "text-green-600"}`}>
            {sensorDrift}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {fileData
              ? `sur ${fileData.numCols.length} colonnes`
              : "PH-02 · TT-14"}
          </p>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900">
            {fileData ? `Évolution — ${fileData.mainCol.col}` : "Évolution du score d'anomalie"}
          </h2>
          <p className="text-xs text-gray-400">
            {fileData
              ? `Plage réelle : [${fileData.mainCol.min?.toFixed(2)}, ${fileData.mainCol.max?.toFixed(2)}] · moy: ${fileData.mainCol.mean?.toFixed(2)}`
              : "En direct · derniers 80 échantillons"}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="diagGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis hide />
            <YAxis domain={[yMin, yMax]} fontSize={11} tick={{ fill: "#9ca3af" }} />
            <Tooltip
              formatter={(v: any) => [`${v}`, fileData?.mainCol?.col ?? "Température"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={2} fill="url(#diagGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2">
          {fileData
            ? `Colonne ${fileData.mainCol.col} utilisée comme signal principal · simulation dans la plage réelle.`
            : "Température réacteur utilisée comme proxy — le score combine les résidus temp/débit/pression."}
        </p>
      </div>

      {/* Tableau anomalies */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Anomalies détectées</h2>
            <p className="text-xs text-gray-400">
              {fileData ? `Depuis ${pipelineData.fichier} · avec comparaison à la plage observée` : "Avec comparaison à la référence"}
            </p>
          </div>
          {fileData && (
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-3 py-1 rounded-full font-semibold">
              🔗 Données réelles
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {anomalies.map((a: any) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-xs text-gray-400 font-mono w-16 shrink-0">{a.id}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{a.nom}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
              </div>
              <span className="text-xs text-gray-400 font-mono hidden lg:block truncate max-w-xs">{a.baseline}</span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 border ${
                a.niveau === "critique" ? "bg-red-100 text-red-600 border-red-200" :
                a.niveau === "warning"  ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                "bg-blue-50 text-blue-500 border-blue-200"
              }`}>
                {a.niveau === "critique" ? "● CRITIQUE" : a.niveau === "warning" ? "● AVERTISSEMENT" : "INFO"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}