import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/historique")({
  head: () => ({ meta: [{ title: "Comparaison historique — OCP AI Monitor" }] }),
  component: HistoriquePage,
});

function buildHistoriqueFromFile(pipelineData: any) {
  if (!pipelineData?.stats || !pipelineData?.apercu) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0)
    .slice(0, 6);

  if (numCols.length === 0) return null;

  const tableRows = numCols.map((col: any) => {
    const ecart = parseFloat((col.mean - col.max).toFixed(3));
    const ecartPct = col.max > 0 ? parseFloat(((col.mean - col.max) / col.max * 100).toFixed(1)) : 0;
    return {
      param: col.col,
      ref: col.max?.toFixed(3),
      current: col.mean?.toFixed(3),
      ecart: `${ecart >= 0 ? "+" : ""}${ecart}`,
      ecartPct,
      alert: Math.abs(ecartPct) > 5,
    };
  });

  const dateCol = pipelineData.headers?.find((h: string) =>
    h.toLowerCase().includes("date") || h.toLowerCase().includes("time")
  );
  const col1 = numCols[0];
  const graphData = pipelineData.apercu.map((row: any, i: number) => {
    const val = parseFloat((row[col1.col] || "0").replace(",", "."));
    return {
      step: dateCol ? (row[dateCol] || `L${i + 1}`) : `L${i + 1}`,
      baseline: parseFloat(col1.max.toFixed(3)),
      current: isNaN(val) ? col1.mean : val,
    };
  });

  const p2o5Col = numCols.find((c: any) => c.col.toLowerCase().includes("p2o5"));
  const deltaYield = p2o5Col
    ? parseFloat(((p2o5Col.mean - p2o5Col.max) / p2o5Col.max * 100).toFixed(1))
    : parseFloat(((col1.mean - col1.max) / col1.max * 100).toFixed(1));
  const col2 = numCols[1] || numCols[0];
  const deltaEnergy = parseFloat(((col2.mean - col2.max) / col2.max * 100).toFixed(1));
  const col3 = numCols[2] || numCols[0];
  const deltaThroughput = parseFloat(((col3.mean - col3.max) / col3.max * 100).toFixed(1));
  const yMin = parseFloat((Math.min(col1.min, col1.mean) * 0.97).toFixed(2));
  const yMax = parseFloat((col1.max * 1.03).toFixed(2));

  return { tableRows, graphData, deltaYield, deltaEnergy, deltaThroughput, col1, numCols, yMin, yMax };
}

function generateFallbackData() {
  const pts = [];
  let baseline = 92.5;
  let current = 92.0;
  for (let i = 1; i <= 80; i++) {
    baseline += (Math.random() - 0.5) * 0.3;
    current += (Math.random() - 0.52) * 0.4;
    pts.push({ step: i, baseline: parseFloat(baseline.toFixed(2)), current: parseFloat(current.toFixed(2)) });
  }
  return pts;
}

const FALLBACK_ROWS = [
  { param: "Température réacteur (°C)", ref: "425 ± 4", current: "430.9", ecart: "+5.9",  ecartPct:  1.4, alert: true  },
  { param: "P2O5 prédit (%)",           ref: "44.8",    current: "44.1",  ecart: "-0.7",  ecartPct: -1.6, alert: true  },
  { param: "Rendement (%)",             ref: "93.2",    current: "91.8",  ecart: "-1.4",  ecartPct: -1.5, alert: true  },
  { param: "Débit acide (m³/h)",        ref: "142",     current: "143.2", ecart: "+1.2",  ecartPct:  0.8, alert: false },
  { param: "Humidité produit (%)",      ref: "3.5",     current: "3.8",   ecart: "+0.3",  ecartPct:  8.6, alert: false },
  { param: "Énergie (kWh/t)",           ref: "400",     current: "414",   ecart: "+14",   ecartPct:  3.5, alert: true  },
];

function HistoriquePage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [fallbackData, setFallbackData] = useState(generateFallbackData());
  const [deltaYield, setDeltaYield] = useState(-1.2);
  const [deltaEnergy, setDeltaEnergy] = useState(3.4);
  const [deltaThroughput, setDeltaThroughput] = useState(0.8);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  useEffect(() => {
    if (pipelineData) return;
    const t = setInterval(() => {
      setFallbackData(generateFallbackData());
      setDeltaYield(parseFloat((Math.random() * 4 - 2).toFixed(1)));
      setDeltaEnergy(parseFloat((Math.random() * 6 - 1).toFixed(1)));
      setDeltaThroughput(parseFloat((Math.random() * 3 - 0.5).toFixed(1)));
    }, 5000);
    return () => clearInterval(t);
  }, [pipelineData]);

  const fileData       = pipelineData ? buildHistoriqueFromFile(pipelineData) : null;
  const graphData      = fileData?.graphData      ?? fallbackData;
  const tableRows      = fileData?.tableRows      ?? FALLBACK_ROWS;
  const dY             = fileData?.deltaYield      ?? deltaYield;
  const dE             = fileData?.deltaEnergy     ?? deltaEnergy;
  const dT             = fileData?.deltaThroughput ?? deltaThroughput;
  const yMin           = fileData?.yMin ?? 84;
  const yMax           = fileData?.yMax ?? 97;
  const graphLabel     = fileData?.col1?.col ?? "Rendement (%)";
  const conformeStatut = pipelineData?.statut === "conforme";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header — sans nom de fichier dans le subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comparaison historique</h1>
        <p className="text-sm text-gray-500 mt-1">
          {fileData
            ? `Moyenne vs maximum observé — ${pipelineData.lignes} lignes`
            : "Cycle en cours vs meilleur batch du trimestre — Ligne 107 DEF"}
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

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour comparer vos vraies données avec la référence
        </div>
      )}

      {/* Bandeau live */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> EN DIRECT
          </span>
          <span className="text-xs text-gray-500">Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">⚠️ Avertissement</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
            ● EN DIRECT · {fileData ? "réel" : "2s"}
          </span>
        </div>
      </div>

      {/* KPIs delta */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: fileData ? `Δ ${fileData.col1?.col?.slice(0, 12) ?? "COL 1"}` : "Δ RENDEMENT",  val: dY, alert: dY < 0 },
          { label: fileData ? `Δ ${fileData.numCols[1]?.col?.slice(0, 12) ?? "COL 2"}` : "Δ ÉNERGIE",   val: dE, alert: dE > 0 },
          { label: fileData ? `Δ ${fileData.numCols[2]?.col?.slice(0, 12) ?? "COL 3"}` : "Δ DÉBIT",     val: dT, alert: dT < 0 },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2 truncate">{kpi.label}</p>
            <p className={`text-4xl font-bold ${kpi.alert ? "text-orange-500" : "text-green-600"}`}>
              {kpi.val > 0 ? "+" : ""}{kpi.val}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fileData ? "moy vs max observé" : "cycle en cours vs référence"}
            </p>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900">Superposition d'efficacité</h2>
          <p className="text-xs text-gray-400">
            {fileData
              ? `${graphLabel} · Référence (max) vs valeurs du fichier`
              : "Cycle en cours vs référence"}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="step" fontSize={10} tick={{ fill: "#9ca3af" }} />
            <YAxis domain={[yMin, yMax]} fontSize={10} tick={{ fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(v: any, name: string) => [
                `${v}`,
                name === "baseline"
                  ? (fileData ? "Référence (max observé)" : "Référence")
                  : (fileData ? "Valeurs fichier" : "Cycle en cours"),
              ]}
            />
            <Line type="monotone" dataKey="baseline" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="baseline" />
            <Line type="monotone" dataKey="current"  stroke="#16a34a" strokeWidth={2} dot={fileData ? { r: 3 } : false} name="current" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-6 mt-3 text-xs text-gray-500 justify-center">
          <span className="flex items-center gap-2">
            <span className="w-6 h-0.5 border-t-2 border-dashed border-green-500 inline-block" />
            {fileData ? "Référence (max observé)" : "Référence"}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-green-700 inline-block" />
            {fileData ? "Valeurs fichier" : "Cycle en cours"}
          </span>
        </div>
      </div>

      {/* Tableau comparatif */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Tableau comparatif</h2>
            <p className="text-xs text-gray-400">
              {fileData
                ? `Moyenne vs maximum observé`
                : "Paramètres clés — cycle en cours vs meilleur batch"}
            </p>
          </div>
          {fileData && (
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-3 py-1 rounded-full font-semibold">
              🔗 Données réelles
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Paramètre</th>
                <th className="text-left px-4 py-3">{fileData ? "Référence (max)" : "Référence"}</th>
                <th className="text-left px-4 py-3">{fileData ? "Moyenne réelle" : "Cycle en cours"}</th>
                <th className="text-left px-4 py-3">Écart absolu</th>
                <th className="text-left px-4 py-3">Écart %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 font-mono text-xs">{row.param}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.ref}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{row.current}</td>
                  <td className={`px-4 py-3 font-semibold font-mono text-xs ${row.alert ? "text-orange-500" : "text-green-600"}`}>
                    {row.ecart}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      Math.abs(row.ecartPct) > 5
                        ? "bg-orange-100 text-orange-600"
                        : Math.abs(row.ecartPct) > 2
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                    }`}>
                      {row.ecartPct >= 0 ? "+" : ""}{row.ecartPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}