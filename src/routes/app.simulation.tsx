import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/simulation")({
  head: () => ({ meta: [{ title: "Simulation — OCP AI Monitor" }] }),
  component: SimulationPage,
});

function buildParamsFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;
  const stats = pipelineData.stats;

  const find = (keys: string[]) =>
    stats.find((s: any) => keys.some(k => s.col?.toLowerCase().includes(k)));

  const tempCol  = find(["temp", "temperature", "cao"]);
  const debitCol = find(["debit", "flow", "production", "p2o5"]);
  const ratioCol = find(["ratio", "so4", "so3", "mgo", "h2o"]);
  const p2o5Col  = find(["p2o5", "p205"]);

  const mean = (col: any, def: number) =>
    col?.mean != null ? parseFloat(col.mean) : def;

  return {
    temperature: Math.max(380, Math.min(470, mean(tempCol, 425))),
    debit: Math.max(100, Math.min(180, mean(debitCol, 142))),
    ratio: Math.max(1.5, Math.min(3.0, mean(ratioCol, 2.05))),
    p2o5Base: mean(p2o5Col, 30),
    tempLabel: tempCol?.col || "Température réacteur",
    debitLabel: debitCol?.col || "Débit alimentation",
    ratioLabel: ratioCol?.col || "Ratio recyclage",
    fichier: pipelineData.fichier,
    lignes: pipelineData.lignes,
    conformeStatut: pipelineData.statut === "conforme",
    p2o5Reel: pipelineData.p2o5 || 0,
  };
}

function generateTrajectory(temp: number, debit: number, ratio: number, p2o5Base: number) {
  const points = [];
  let yield_ = (p2o5Base > 0 ? p2o5Base : 30) + (temp - 425) * 0.05 + (debit - 142) * 0.02;
  let energy  = 410 - (temp - 425) * 0.08 - (debit - 142) * 0.03;
  for (let i = 1; i <= 40; i++) {
    yield_ += (Math.random() - 0.5) * 0.15;
    energy += (Math.random() - 0.5) * 0.5;
    points.push({
      step: i,
      rendement: parseFloat(yield_.toFixed(2)),
      energie: parseFloat(energy.toFixed(1)),
    });
  }
  return points;
}

function SimulationPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const params = pipelineData ? buildParamsFromFile(pipelineData) : null;

  const [temperature, setTemperature] = useState(params?.temperature ?? 425);
  const [debit,       setDebit]       = useState(params?.debit       ?? 142);
  const [ratio,       setRatio]       = useState(params?.ratio       ?? 2.05);
  const [running,     setRunning]     = useState(false);
  const [trajectory,  setTrajectory]  = useState(() =>
    generateTrajectory(params?.temperature ?? 425, params?.debit ?? 142, params?.ratio ?? 2.05, params?.p2o5Base ?? 30)
  );
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    return store.subscribe(() => {
      const d = store.getResult();
      setPipelineData(d);
      if (d) {
        const p = buildParamsFromFile(d);
        if (p) {
          setTemperature(p.temperature);
          setDebit(p.debit);
          setRatio(p.ratio);
          setTrajectory(generateTrajectory(p.temperature, p.debit, p.ratio, p.p2o5Base));
        }
      }
    });
  }, []);

  const p2o5Base = params?.p2o5Base ?? 30;
  const predictedYield  = parseFloat((p2o5Base + (temperature - 425) * 0.05 + (debit - 142) * 0.02 + (ratio - 2.05) * 0.3).toFixed(1));
  const predictedEnergy = parseFloat((410 - (temperature - 425) * 0.08 - (debit - 142) * 0.03).toFixed(0));
  const currentYield  = params?.p2o5Reel > 0 ? params.p2o5Reel : 30.5;
  const currentEnergy = 412;

  const delta      = parseFloat((predictedYield - currentYield).toFixed(1));
  const deltaColor = delta >= 0 ? "text-green-600" : "text-red-500";

  const runSimulation = () => {
    setRunning(true);
    setTrajectory(generateTrajectory(temperature, debit, ratio, p2o5Base));
    setTimeout(() => setRunning(false), 1500);
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTrajectory(generateTrajectory(temperature, debit, ratio, p2o5Base));
      }, 2500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, temperature, debit, ratio, p2o5Base]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Simulation (what-if)</h1>
        <p className="text-sm text-gray-500 mt-1">
          {params
            ? `Paramètres initialisés depuis ${params.fichier} — ${params.lignes} lignes`
            : "Ligne 107 DEF · Ajustez les paramètres et observez l'impact sur le rendement et l'énergie"}
        </p>
      </div>

      {/* Bandeau fichier */}
      {pipelineData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-blue-600 font-semibold text-sm">📂 {pipelineData.fichier}</span>
          <span className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono font-bold text-green-700">
            P2O5 base : {params?.p2o5Reel > 0 ? `${params.p2o5Reel}%` : "—"}
          </span>
          <span className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono text-blue-700">
            {pipelineData.lignes} lignes · {pipelineData.colonnes} colonnes
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${params?.conformeStatut ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {pipelineData.statut?.toUpperCase()}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            🔧 Paramètres auto-initialisés
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour initialiser les paramètres depuis vos vraies données
        </div>
      )}

      {/* Bandeau live */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ANALYSE EN DIRECT
          </span>
          <span className="text-xs text-gray-500">Vue Ingénieur Procédé</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>📡 Corrélations · anomalies en mise à jour</span>
          <span>🔄 Actualisation ~2.5s</span>
        </div>
      </div>

      {/* Flux système */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="text-xs text-gray-500 mb-2 font-semibold uppercase">FLUX SYSTÈME</div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {["Données", "Pipeline", "IA", "Décision", "Retour"].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${step === "IA" ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-600"}`}>
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-gray-300">→</span>}
            </span>
          ))}
          <span className="ml-auto text-xs text-blue-600 cursor-pointer hover:underline">Voir le flux système →</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Sliders */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900">Paramètres d'entrée</h2>
            <p className="text-xs text-gray-500 mt-1">
              {params ? `🔗 Initialisés depuis ${params.fichier}` : "Ajuster les points de consigne"}
            </p>
          </div>

          <SliderInput
            label={params?.tempLabel || "Température réacteur"}
            value={temperature} min={380} max={470} step={1} unit={params ? "" : "°C"}
            onChange={setTemperature}
          />
          <SliderInput
            label={params?.debitLabel || "Débit alimentation"}
            value={debit} min={100} max={180} step={1} unit={params ? "" : "t/h"}
            onChange={setDebit}
          />
          <SliderInput
            label={params?.ratioLabel || "Ratio recyclage bouillie"}
            value={ratio} min={1.5} max={3.0} step={0.05} unit=""
            onChange={setRatio}
          />

          {/* Reset depuis fichier */}
          {params && (
            <button
              onClick={() => {
                setTemperature(params.temperature);
                setDebit(params.debit);
                setRatio(params.ratio);
              }}
              className="w-full border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-2 rounded-xl text-sm transition-all"
            >
              🔄 Réinitialiser depuis {params.fichier}
            </button>
          )}

          <button
            onClick={runSimulation}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
          >
            <span className={running ? "animate-spin" : ""}>▶</span>
            {running ? "Simulation en cours..." : "Lancer la simulation"}
          </button>
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`border-2 rounded-xl p-5 shadow-sm ${predictedYield >= 44 ? "bg-green-50 border-green-300" : "bg-red-50 border-red-200"}`}>
              <p className="text-xs text-gray-500 mb-1">
                {params ? "P2O5 simulé" : "Rendement prédit"}
              </p>
              <p className="text-xs text-gray-400 mb-2">Mis à jour avec la dérive en direct</p>
              <p className={`text-4xl font-bold ${predictedYield >= 44 ? "text-green-600" : "text-red-500"}`}>
                {predictedYield} <span className="text-xl">%</span>
              </p>
              <p className={`text-xs font-semibold mt-1 ${deltaColor}`}>
                {delta >= 0 ? "↗" : "↘"} {delta >= 0 ? "+" : ""}{delta}% vs fichier ({currentYield}%)
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Énergie prédite</p>
              <p className="text-xs text-gray-400 mb-2">Mis à jour avec la dérive en direct</p>
              <p className="text-4xl font-bold text-gray-800">
                {predictedEnergy} <span className="text-xl font-normal text-gray-500">kWh/t</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">vs actuel {currentEnergy} kWh/t</p>
            </div>
          </div>

          {/* Statut conformité simulé */}
          <div className={`rounded-xl p-4 border-2 text-center ${predictedYield >= 44 ? "bg-green-50 border-green-300" : "bg-red-50 border-red-200"}`}>
            <p className="text-xs text-gray-500 uppercase mb-1">Statut simulé</p>
            <p className={`text-lg font-bold ${predictedYield >= 44 ? "text-green-700" : "text-red-600"}`}>
              {predictedYield >= 44 ? "✅ CONFORME (simulé)" : "⚠️ NON CONFORME (simulé)"}
            </p>
            {params && (
              <p className="text-xs text-gray-400 mt-1">
                Seuil P2O5 : 44% · Base réelle : {currentYield}%
              </p>
            )}
          </div>

          {/* Graphique trajectoire */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Trajectoire</h3>
                <p className="text-xs text-gray-400">
                  {params ? `Base : ${params.fichier}` : "Horizon 40 pas · streaming"}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="step" fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis yAxisId="r" domain={["dataMin - 2", "dataMax + 2"]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis yAxisId="e" orientation="right" domain={[300, 650]} fontSize={10} tick={{ fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line yAxisId="r" type="monotone" dataKey="rendement" stroke="#22c55e" strokeWidth={2} dot={false} name={params ? "P2O5 simulé (%)" : "Rendement (%)"} />
                <Line yAxisId="e" type="monotone" dataKey="energie"   stroke="#f59e0b" strokeWidth={2} dot={false} name="Énergie (kWh/t)" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block" /> Énergie (kWh/t)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> {params ? "P2O5 simulé (%)" : "Rendement (%)"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderInput({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 truncate flex-1">{label}</label>
        <span className="text-sm font-bold text-green-600 ml-2 shrink-0">{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "#16a34a" }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}