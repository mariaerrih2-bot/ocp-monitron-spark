import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/performance")({
  head: () => ({ meta: [{ title: "Performance — OCP AI Monitor" }] }),
  component: PerformancePage,
});

const COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];

function buildPerformanceData(pipelineData: any) {
  if (!pipelineData?.stats || !pipelineData?.apercu) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max !== null && s.max > 0)
    .slice(0, 8);

  if (numCols.length === 0) return null;

  // Répartition : réel vs objectif (objectif = max observé)
  const breakdown = numCols.map((col: any) => ({
    name: col.col.slice(0, 14),
    reel: parseFloat(col.mean.toFixed(2)),
    objectif: parseFloat(col.max.toFixed(2)),
    min: parseFloat(col.min.toFixed(2)),
    ecart: parseFloat((((col.mean - col.max) / col.max) * 100).toFixed(1)),
  }));

  // Tendance depuis aperçu
  const dateCol = pipelineData.headers?.find((h: string) =>
    h.toLowerCase().includes("date") || h.toLowerCase().includes("time")
  );
  const rows = pipelineData.apercu;
  const tendance = rows.map((row: any, i: number) => {
    const point: any = { label: dateCol ? (row[dateCol] || `L${i + 1}`) : `L${i + 1}` };
    numCols.slice(0, 3).forEach((col: any) => {
      const val = parseFloat((row[col.col] || "0").replace(",", "."));
      if (!isNaN(val)) point[col.col] = val;
    });
    return point;
  });

  // KPIs globaux depuis stats
  const moyennes = numCols.map((c: any) => c.mean);
  const maxVals = numCols.map((c: any) => c.max);
  const efficaciteMoy = parseFloat((moyennes.reduce((a: number, b: number) => a + b, 0) / moyennes.length).toFixed(1));
  const efficaciteMax = parseFloat((maxVals.reduce((a: number, b: number) => a + b, 0) / maxVals.length).toFixed(1));
  const tauxConformite = parseFloat(((numCols.filter((c: any) => c.mean >= c.min + (c.max - c.min) * 0.7).length / numCols.length) * 100).toFixed(1));
  const colonnesOk = breakdown.filter(b => b.ecart >= -10).length;

  return { breakdown, tendance, numCols, efficaciteMoy, efficaciteMax, tauxConformite, colonnesOk };
}

function PerformancePage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [fallbackOee, setFallbackOee] = useState(83.3);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  useEffect(() => {
    if (pipelineData) return;
    const t = setInterval(() => {
      setFallbackOee(v => parseFloat((Math.max(80, Math.min(90, v + (Math.random() - 0.5) * 0.3))).toFixed(1)));
    }, 3000);
    return () => clearInterval(t);
  }, [pipelineData]);

  const chartData = pipelineData ? buildPerformanceData(pipelineData) : null;
  const conformeStatut = pipelineData?.statut === "conforme";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
        <p className="text-sm text-gray-500 mt-1">
          {chartData ? `Analyse adaptée — ${pipelineData.fichier}` : "Efficacité · Performance par unité vs objectif"}
        </p>
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
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">⚠️ Avertissement</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> EN DIRECT · 4s
          </span>
          <span className="text-xs text-gray-500">Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">● USINE EN LIGNE</span>
      </div>

      {chartData ? (
        <>
          {/* KPIs calculés depuis le fichier */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Moyenne globale", value: `${chartData.efficaciteMoy}`, tendance: "données réelles", couleur: "text-green-600" },
              { label: "Valeur max observée", value: `${chartData.efficaciteMax}`, tendance: "toutes colonnes", couleur: "text-blue-600" },
              { label: "Taux de conformité", value: `${chartData.tauxConformite}%`, tendance: "colonnes ≥ 70% du max", couleur: "text-green-600" },
              { label: "Colonnes conformes", value: `${chartData.colonnesOk}/${chartData.numCols.length}`, tendance: "écart ≤ 10%", couleur: "text-gray-900" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{kpi.label}</p>
                <p className={`text-3xl font-bold ${kpi.couleur}`}>{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.tendance}</p>
              </div>
            ))}
          </div>

          {/* Répartition réel vs max */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Répartition des performances — {pipelineData.fichier}</h2>
            <p className="text-xs text-gray-400 mb-5">Moyenne réelle vs valeur maximale observée par colonne</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.breakdown} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" fontSize={10} tick={{ fill: "#6b7280" }} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="reel" name="Moyenne réelle" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="objectif" name="Valeur max" fill="#86efac" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tendance depuis aperçu */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">Évolution des 3 premières variables</h2>
            <p className="text-xs text-gray-400 mb-5">5 premières lignes du fichier — colonnes numériques</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData.tendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {chartData.numCols.slice(0, 3).map((col: any, i: number) => (
                  <Line key={col.col} type="monotone" dataKey={col.col} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} name={col.col.slice(0, 15)} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau détail */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Détail par colonne — données réelles</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Colonne</th>
                  <th className="px-5 py-3 text-left">Moyenne</th>
                  <th className="px-5 py-3 text-left">Max observé</th>
                  <th className="px-5 py-3 text-left">Min</th>
                  <th className="px-5 py-3 text-left">Écart moy/max</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData.breakdown.map((row: any, i: number) => {
                  const ok = row.ecart >= -10;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono font-semibold text-gray-700">{row.name}</td>
                      <td className="px-5 py-3 font-mono font-bold text-green-600">{row.reel}</td>
                      <td className="px-5 py-3 font-mono text-blue-600">{row.objectif}</td>
                      <td className="px-5 py-3 font-mono text-gray-500">{row.min}</td>
                      <td className={`px-5 py-3 font-mono font-semibold ${row.ecart >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {row.ecart >= 0 ? "+" : ""}{row.ecart}%
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                          {ok ? "● CONFORME" : "● SOUS OBJECTIF"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Fallback si pas de fichier */
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-blue-700">Aucun fichier uploadé</p>
          <p className="text-sm text-blue-500 mt-2">
            Uploadez un fichier dans <strong>Données & Audit ML</strong> pour voir les graphiques adaptatifs ici
          </p>
          <div className="mt-4 bg-white border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">TRS simulé (sans fichier) :</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{fallbackOee}%</p>
          </div>
        </div>
      )}
    </div>
  );
}