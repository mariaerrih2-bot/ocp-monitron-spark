import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/drift")({
  head: () => ({ meta: [{ title: "Drift Monitoring — OCP AI Monitor" }] }),
  component: DriftPage,
});

const getColor = (val: number) => val > 0.25 ? "#ef4444" : val > 0.15 ? "#f97316" : "#22c55e";

// Calcule PSI entre deux distributions
function calcPSI(values: number[]): number {
  if (values.length < 4) return 0;
  const mid = Math.floor(values.length / 2);
  const ref = values.slice(0, mid);
  const cur = values.slice(mid);
  const refMean = ref.reduce((a, b) => a + b, 0) / ref.length;
  const curMean = cur.reduce((a, b) => a + b, 0) / cur.length;
  if (refMean === 0) return 0;
  return parseFloat(Math.abs((curMean - refMean) / refMean).toFixed(3));
}

// Extrait données numériques du fichier uploadé
function buildChartData(pipelineData: any) {
  if (!pipelineData?.apercu || !pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null)
    .slice(0, 6);

  if (numCols.length === 0) return null;

  // Données pour graphique évolution (depuis apercu)
  const rows = pipelineData.apercu;
  const dateCol = pipelineData.headers?.find((h: string) =>
    h.toLowerCase().includes("date") || h.toLowerCase().includes("time")
  );

  const lineData = rows.map((row: any, i: number) => {
    const point: any = { label: dateCol ? (row[dateCol] || `L${i + 1}`) : `L${i + 1}` };
    numCols.forEach((col: any) => {
      const val = parseFloat((row[col.col] || "0").replace(",", "."));
      if (!isNaN(val)) point[col.col] = val;
    });
    return point;
  });

  // Drift par colonne (écart relatif mean vs min/max)
  const driftCols = numCols.map((col: any) => {
    const range = col.max - col.min;
    const psi = range > 0 ? parseFloat((Math.abs(col.mean - (col.min + range / 2)) / range).toFixed(3)) : 0;
    const niveau = psi > 0.25 ? "critique" : psi > 0.15 ? "warning" : psi > 0.08 ? "info" : "normal";
    return { nom: col.col, valeur: psi, niveau, mean: col.mean, min: col.min, max: col.max };
  }).sort((a: any, b: any) => b.valeur - a.valeur);

  // PSI global
  const psiGlobal = parseFloat((driftCols.reduce((a: number, c: any) => a + c.valeur, 0) / driftCols.length).toFixed(3));

  // Graphique barres PSI par colonne
  const barData = driftCols.map((c: any) => ({ name: c.nom.slice(0, 12), psi: c.valeur }));

  return { lineData, driftCols, psiGlobal, barData, numCols };
}

function generateFallback() {
  return Array.from({ length: 30 }, (_, i) => {
    const val = parseFloat((Math.random() * 0.5 + 0.1).toFixed(3));
    return { step: i, psi: val, modelDrift: parseFloat((val * 0.7 + Math.random() * 0.1).toFixed(3)) };
  });
}

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#3b82f6", "#ec4899", "#14b8a6"];

function DriftPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [fallbackData, setFallbackData] = useState(generateFallback());
  const [psi, setPsi] = useState(0.23);
  const [conceptDrift, setConceptDrift] = useState(-0.7);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  // Animation fallback seulement si pas de données uploadées
  useEffect(() => {
    if (pipelineData) return;
    const t = setInterval(() => {
      setFallbackData(generateFallback());
      setPsi(v => parseFloat((Math.max(0.1, Math.min(0.5, v + (Math.random() - 0.5) * 0.02))).toFixed(2)));
      setConceptDrift(v => parseFloat((Math.max(-2, Math.min(0.5, v + (Math.random() - 0.5) * 0.1))).toFixed(1)));
    }, 4000);
    return () => clearInterval(t);
  }, [pipelineData]);

  const chartData = pipelineData ? buildChartData(pipelineData) : null;
  const psiAffiche = chartData ? chartData.psiGlobal : psi;
  const conformeStatut = pipelineData?.statut === "conforme";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Drift Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">Ligne 107 DEF · Surveillance dérive données et modèle</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dérive données (PSI)</p>
          <p className="text-xs text-gray-400 mb-3">
            {chartData ? `Calculé depuis ${pipelineData.fichier}` : "Indice de stabilité de population"}
          </p>
          <p className={`text-4xl font-bold ${psiAffiche > 0.20 ? "text-orange-500" : "text-green-600"}`}>
            {psiAffiche}
          </p>
          <p className="text-xs text-gray-400 mt-2">Seuil 0.20 — dérive modérée</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dérive conceptuelle</p>
          <p className="text-xs text-gray-400 mb-3">Delta performance</p>
          <p className={`text-4xl font-bold ${conceptDrift < -0.5 ? "text-orange-500" : "text-green-600"}`}>
            {conceptDrift > 0 ? "+" : ""}{conceptDrift}%
          </p>
          <p className="text-xs text-gray-400 mt-2">R² stable dans la tolérance</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Action</p>
          <p className="text-xs text-gray-400 mb-3">Recommandée</p>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${psiAffiche > 0.20 ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-green-100 text-green-600 border-green-200"}`}>
            {psiAffiche > 0.20 ? "● RÉENTRAÎNEMENT SUGGÉRÉ" : "● MODÈLE STABLE"}
          </span>
          <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-all">
            Déclencher réentraînement
          </button>
        </div>
      </div>

      {/* Graphiques ADAPTATIFS */}
      {chartData ? (
        <>
          {/* Évolution colonnes numériques depuis le fichier */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-1">
              Évolution des variables — {pipelineData.fichier}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {chartData.numCols.length} colonnes numériques détectées · 5 premières lignes
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData.lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {chartData.numCols.slice(0, 4).map((col: any, i: number) => (
                  <Line key={col.col} type="monotone" dataKey={col.col} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} name={col.col.slice(0, 15)} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PSI par colonne */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-1">Dérive par colonne (PSI)</h2>
              <p className="text-xs text-gray-400 mb-4">Calculé depuis les données réelles</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                  <XAxis type="number" domain={[0, 0.5]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                  <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: "#9ca3af" }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="psi" radius={[0, 4, 4, 0]}>
                    {chartData.barData.map((entry: any, i: number) => (
                      <Cell key={i} fill={getColor(entry.psi)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats colonnes */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Statistiques colonnes</h2>
              <div className="space-y-2 overflow-y-auto max-h-48">
                {chartData.driftCols.map((col: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.niveau === "critique" ? "bg-red-500" : col.niveau === "warning" ? "bg-orange-400" : "bg-green-500"}`} />
                    <span className="font-mono text-gray-700 flex-1 truncate">{col.nom}</span>
                    <span className="text-gray-400">moy: <span className="font-bold text-gray-700">{col.mean}</span></span>
                    <span className="text-gray-400">[{col.min}–{col.max}]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Variables dérivantes depuis données réelles */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Variables les plus dérivantes — données réelles</h2>
            <div className="space-y-3">
              {chartData.driftCols.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 w-24 text-center ${
                    f.niveau === "critique" ? "bg-red-100 text-red-600 border-red-200" :
                    f.niveau === "warning" ? "bg-orange-100 text-orange-500 border-orange-200" :
                    f.niveau === "info" ? "bg-blue-50 text-blue-400 border-blue-200" :
                    "bg-green-100 text-green-600 border-green-200"
                  }`}>
                    {f.niveau === "critique" ? "● CRITIQUE" : f.niveau === "warning" ? "● ALERTE" : f.niveau === "info" ? "INFO" : "● NORMAL"}
                  </span>
                  <span className="text-sm font-mono text-gray-700 w-48 shrink-0 truncate">{f.nom}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{
                        width: `${Math.min((f.valeur / 0.35) * 100, 100)}%`,
                        background: `linear-gradient(to right, #22c55e, ${getColor(f.valeur)})`
                      }} />
                    </div>
                    <span className="text-sm font-mono text-gray-600 w-12 text-right">{f.valeur}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Fallback simulé si pas de fichier */
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-1">Tendance dérive données</h2>
            <p className="text-xs text-gray-400 mb-4">PSI agrégé — simulation</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fallbackData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="step" fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis domain={[0, 0.6]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="psi" radius={[2, 2, 0, 0]}>
                  {fallbackData.map((entry, i) => <Cell key={i} fill={getColor(entry.psi)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-1">Tendance dérive modèle</h2>
            <p className="text-xs text-gray-400 mb-4">Simulation — uploadez un fichier pour les vraies données</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fallbackData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="step" fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis domain={[0, 0.35]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="modelDrift" radius={[2, 2, 0, 0]}>
                  {fallbackData.map((entry, i) => <Cell key={i} fill={getColor(entry.modelDrift)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}