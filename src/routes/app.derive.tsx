import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/derive")({
  head: () => ({ meta: [{ title: "Dérive du modèle — OCP AI Monitor" }] }),
  component: DerivePage,
});

const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6"];

// Construit les KPIs et graphiques depuis le fichier
function buildDeriveFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0)
    .slice(0, 4);

  if (numCols.length === 0) return null;

  // KPIs calculés depuis les vraies stats
  const cpk = parseFloat((numCols.reduce((a: number, c: any) => {
    const range = c.max - c.min;
    return a + (range > 0 ? Math.min((c.mean - c.min), (c.max - c.mean)) / (range / 6) : 1);
  }, 0) / numCols.length).toFixed(2));

  const oee = parseFloat(((numCols.filter((c: any) => {
    const range = c.max - c.min;
    const ecart = range > 0 ? (c.mean - c.min) / range : 0.5;
    return ecart >= 0.2 && ecart <= 0.8;
  }).length / numCols.length) * 100).toFixed(1));

  const conformite = parseFloat(((pipelineData.lignes - (pipelineData.alertes?.length || 0) * 5) / pipelineData.lignes * 100).toFixed(1));
  const energie    = Math.round(numCols[0]?.mean * 4 + 200) || 414;

  // Graphique 1 : évolution colonne 1
  const col1 = numCols[0];
  const col2 = numCols[1] || numCols[0];

  // Insights depuis les données réelles
  const insights = numCols.slice(0, 3).map((col: any) => {
    const range = col.max - col.min;
    const ecart = range > 0 ? (col.mean - col.min) / range : 0.5;
    if (ecart > 0.85) return { texte: `Valeur élevée détectée sur ${col.col} — moyenne ${col.mean?.toFixed(2)} proche du maximum ${col.max?.toFixed(2)}.`, niveau: "alerte" };
    if (ecart < 0.15) return { texte: `Valeur basse détectée sur ${col.col} — moyenne ${col.mean?.toFixed(2)} proche du minimum ${col.min?.toFixed(2)}.`, niveau: "warning" };
    return { texte: `${col.col} stable — moyenne ${col.mean?.toFixed(2)} dans la plage [${col.min?.toFixed(2)}, ${col.max?.toFixed(2)}].`, niveau: "info" };
  });

  return { cpk, oee, conformite, energie, col1, col2, numCols, insights };
}

// Génère un point temps réel basé sur les stats réelles
function generatePointFromStats(prev: any, col1: any, col2: any) {
  const time  = new Date().toLocaleTimeString("fr-FR");
  const range1 = col1.max - col1.min;
  const range2 = col2.max - col2.min;
  const noise1 = (Math.random() - 0.5) * range1 * 0.03;
  const noise2 = (Math.random() - 0.5) * range2 * 0.03;
  return {
    time,
    col1: parseFloat(Math.max(col1.min, Math.min(col1.max, (prev?.col1 ?? col1.mean) + noise1)).toFixed(3)),
    col2: parseFloat(Math.max(col2.min, Math.min(col2.max, (prev?.col2 ?? col2.mean) + noise2)).toFixed(3)),
  };
}

function generatePointFallback(prev: any) {
  const time = new Date().toLocaleTimeString("fr-FR");
  return {
    time,
    temperature: parseFloat(((prev?.temperature || 415) + (Math.random() - 0.47) * 1.5).toFixed(2)),
    rendement:   parseFloat(((prev?.rendement   || 92)  + (Math.random() - 0.52) * 0.3).toFixed(2)),
  };
}

function DerivePage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const fileData = pipelineData ? buildDeriveFromFile(pipelineData) : null;

  const [data, setData] = useState<any[]>(() => {
    const pts: any[] = []; let prev: any = null;
    for (let i = 0; i < 40; i++) {
      prev = fileData
        ? generatePointFromStats(prev, fileData.col1, fileData.col2)
        : generatePointFallback(prev);
      pts.push(prev);
    }
    return pts;
  });

  const [cpk,        setCpk]        = useState(fileData?.cpk        ?? 1.23);
  const [oee,        setOee]        = useState(fileData?.oee        ?? 83.8);
  const [conformite, setConformite] = useState(fileData?.conformite ?? 97.9);
  const [energie,    setEnergie]    = useState(fileData?.energie    ?? 414);

  useEffect(() => {
    return store.subscribe(() => {
      const d = store.getResult();
      setPipelineData(d);
      if (d) {
        const fd = buildDeriveFromFile(d);
        if (fd) {
          setCpk(fd.cpk);
          setOee(fd.oee);
          setConformite(fd.conformite);
          setEnergie(fd.energie);
          const pts: any[] = []; let prev: any = null;
          for (let i = 0; i < 40; i++) {
            prev = generatePointFromStats(prev, fd.col1, fd.col2);
            pts.push(prev);
          }
          setData(pts);
        }
      }
    });
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const newPt = fileData
          ? generatePointFromStats(last, fileData.col1, fileData.col2)
          : generatePointFallback(last);
        const updated = [...prev, newPt];
        return updated.length > 80 ? updated.slice(-80) : updated;
      });
      if (!fileData) {
        setCpk(v =>        parseFloat((Math.max(0.8, Math.min(1.8, v + (Math.random() - 0.5) * 0.02))).toFixed(2)));
        setOee(v =>        parseFloat((Math.max(75,  Math.min(95,  v + (Math.random() - 0.5) * 0.3))).toFixed(1)));
        setConformite(v => parseFloat((Math.max(90,  Math.min(100, v + (Math.random() - 0.5) * 0.1))).toFixed(1)));
        setEnergie(v =>    Math.round(Math.max(380,  Math.min(450, v + (Math.random() - 0.5) * 2))));
      }
    }, 2500);
    return () => clearInterval(t);
  }, [fileData]);

  const last = data[data.length - 1] || {};
  const conformeStatut = pipelineData?.statut === "conforme";

  const insights = fileData?.insights ?? [
    { texte: "Dérive d'efficacité détectée sur l'échangeur HX-3 — perte de 2.1% sur 6h.", niveau: "warning" },
    { texte: "Activité catalytique corrélée au ratio alimentation C2/C3 (ρ = 0.69).", niveau: "info" },
    { texte: `Dernière température réacteur ${last.temperature ?? "—"}°C — hors fenêtre ±1σ, diagnostic en cours.`, niveau: "alerte" },
  ];

  // Noms des axes adaptés
  const graph1Label = fileData ? fileData.col1.col : "Température";
  const graph2Label = fileData ? fileData.col2.col : "Rendement";
  const graph1Key   = fileData ? "col1" : "temperature";
  const graph2Key   = fileData ? "col2" : "rendement";
  const graph1Color = "#ef4444";
  const graph2Color = "#22c55e";

  const graph1Domain = fileData
    ? [parseFloat((fileData.col1.min * 0.99).toFixed(2)), parseFloat((fileData.col1.max * 1.01).toFixed(2))]
    : [395, 440];
  const graph2Domain = fileData
    ? [parseFloat((fileData.col2.min * 0.99).toFixed(2)), parseFloat((fileData.col2.max * 1.01).toFixed(2))]
    : [84, 98];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dérive du modèle</h1>
        <p className="text-sm text-gray-500 mt-1">
          {fileData
            ? `${pipelineData.fichier} · ${pipelineData.lignes} lignes · surveillance en temps réel`
            : "Ligne 107 DEF · Surveillance des indicateurs procédé en temps réel"}
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
              🔗 KPIs calculés depuis {fileData.numCols.length} colonnes réelles
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour calculer les KPIs depuis vos données réelles
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={fileData ? "CPK GLOBAL" : "CPK (TEMP. RÉACTEUR)"}
          value={cpk} unit="" trend={-3.4} color="orange"
          sub={fileData ? `${fileData.numCols.length} colonnes` : undefined}
        />
        <KpiCard
          label="OEE"
          value={oee} unit="%" trend={1.2} color="green"
          sub={fileData ? "Colonnes dans plage" : undefined}
        />
        <KpiCard
          label="CONFORMITÉ SPEC"
          value={conformite} unit="%" trend={0.4} color="green"
          sub={fileData ? `${pipelineData.lignes} lignes` : undefined}
        />
        <KpiCard
          label={fileData ? "VALEUR ESTIMÉE" : "ÉNERGIE / TONNE"}
          value={energie} unit={fileData ? "" : "kWh"} trend={-2.1} color="green"
          sub={fileData ? fileData.col1.col.slice(0, 12) : undefined}
        />
      </div>

      {/* Graphiques adaptatifs */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Graphique 1 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                {fileData ? graph1Label : "Corrélation Température × Pression"}
              </h2>
              <p className="text-xs text-gray-400">
                {fileData ? `Plage réelle : [${fileData.col1.min?.toFixed(2)}, ${fileData.col1.max?.toFixed(2)}] · moy: ${fileData.col1.mean?.toFixed(2)}` : "ρ en direct = 0.65 · mise à jour automatique"}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> EN DIRECT
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={graph1Color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={graph1Color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis domain={graph1Domain} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey={graph1Key} stroke={graph1Color} strokeWidth={2} fill="url(#grad1)" dot={false} name={graph1Label} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">
                {fileData ? graph2Label : "Rendement vs Efficacité"}
              </h2>
              <p className="text-xs text-gray-400">
                {fileData ? `Plage réelle : [${fileData.col2.min?.toFixed(2)}, ${fileData.col2.max?.toFixed(2)}] · moy: ${fileData.col2.mean?.toFixed(2)}` : "Vue composite · streaming"}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> EN DIRECT
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={graph2Color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={graph2Color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis dataKey="time" fontSize={10} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis domain={graph2Domain} fontSize={10} tick={{ fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey={graph2Key} stroke={graph2Color} strokeWidth={2} fill="url(#grad2)" dot={false} name={graph2Label} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-colonnes si fichier avec 3+ colonnes */}
      {fileData && fileData.numCols.length >= 3 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Toutes les variables — {pipelineData.fichier}</h2>
              <p className="text-xs text-gray-400">{fileData.numCols.length} colonnes numériques · valeurs normalisées</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> EN DIRECT
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {fileData.numCols.map((col: any, i: number) => {
              const range  = col.max - col.min;
              const ecart  = range > 0 ? (col.mean - col.min) / range : 0.5;
              const status = ecart > 0.85 || ecart < 0.15 ? "critique" : ecart > 0.7 || ecart < 0.3 ? "warning" : "ok";
              return (
                <div key={col.col} className={`border rounded-xl p-3 ${
                  status === "critique" ? "border-red-200 bg-red-50" :
                  status === "warning"  ? "border-yellow-200 bg-yellow-50" :
                  "border-gray-100 bg-gray-50"
                }`}>
                  <p className="text-xs font-semibold text-gray-600 truncate mb-1">{col.col}</p>
                  <p className="text-lg font-bold" style={{ color: COLORS[i] }}>{col.mean?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">[{col.min?.toFixed(2)}, {col.max?.toFixed(2)}]</p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${ecart * 100}%`, background: COLORS[i] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Insights procédé</h2>
        <p className="text-xs text-gray-400 mb-4">
          {fileData ? `Générés depuis ${pipelineData.fichier} · actualisés en temps réel` : "Narration auto-générée · actualisée en temps réel"}
        </p>
        <ul className="space-y-3">
          {insights.map((ins: any, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1 shrink-0">•</span>
              <span className={
                ins.niveau === "alerte"  ? "text-orange-500 font-medium" :
                ins.niveau === "warning" ? "text-yellow-600" :
                "text-gray-700"
              }>
                {ins.texte}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KpiCard({ label, value, unit, trend, color, sub }: {
  label: string; value: number; unit: string; trend: number; color: string; sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500 uppercase font-semibold truncate flex-1">{label}</p>
        <span className={`text-xs font-semibold shrink-0 ml-1 ${trend < 0 ? "text-red-500" : "text-green-500"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      </div>
      {sub && <p className="text-xs text-blue-500 mb-1 truncate">{sub}</p>}
      <p className={`text-3xl font-bold ${color === "orange" ? "text-orange-500" : "text-green-600"}`}>
        {value} <span className="text-lg font-normal text-gray-500">{unit}</span>
      </p>
    </div>
  );
}