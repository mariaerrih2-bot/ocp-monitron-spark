import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/kpis")({
  head: () => ({ meta: [{ title: "KPIs Exécutifs — OCP AI Monitor" }] }),
  component: KpisPage,
});

function generateOEE() {
  return Array.from({ length: 30 }, (_, i) => ({
    t: i + 21,
    oee: parseFloat((81 + Math.random() * 4).toFixed(1)),
  }));
}

function KpisPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [oeeData, setOeeData] = useState(generateOEE());
  const [oee, setOee] = useState(83.3);
  const [incidents, setIncidents] = useState(16);
  const [energy, setEnergy] = useState(410);
  const [decisions, setDecisions] = useState(1210);
  const [gain, setGain] = useState(7.4);
  const [mad, setMad] = useState(32.4);
  const [adoption, setAdoption] = useState(78);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setOeeData(generateOEE());
      setOee(v => parseFloat((Math.max(80, Math.min(90, v + (Math.random() - 0.5) * 0.3))).toFixed(1)));
      setDecisions(v => v + Math.floor(Math.random() * 3));
      setEnergy(v => parseFloat((Math.max(400, Math.min(420, v + (Math.random() - 0.5) * 2))).toFixed(0)));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const conformeStatut = pipelineData?.statut === "conforme";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPIs Exécutifs</h1>
        <p className="text-sm text-gray-500 mt-1">Vue direction — performance opérationnelle & impact IA</p>
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

      {/* Bandeau live */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            ● LIVE MODE
          </span>
          <span className="text-xs text-gray-500">STREAMING SIMULATION · Real-time streaming data · auto-updated every 2.0s</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Streaming Engine: ACTIVE
          </span>
          <span>⏱ Latency ~2.0s</span>
        </div>
      </div>

      {/* Business impact summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">📈</div>
            <div>
              <p className="font-semibold text-gray-900">Business impact summary</p>
              <p className="text-xs text-gray-400">Cumulative effect of AI recommendations · annualised</p>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Total Perf.</p>
              <p className="text-2xl font-bold text-green-600">+{gain}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Applied</p>
              <p className="text-2xl font-bold text-gray-900">{decisions > 999 ? `${(decisions / 1000).toFixed(2)}k` : decisions}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Est. Gains</p>
              <p className="text-2xl font-bold text-green-600">{mad} M MAD</p>
            </div>
            <span className="text-green-600 text-xs font-semibold flex items-center gap-1">📈 TRACKED</span>
          </div>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "PLANT OEE", value: `${oee} %`, sub: "last 30 days", trend: "+1.8%", color: "text-green-600" },
          { label: "AVOIDED INCIDENTS", value: incidents, sub: "last 30 days", trend: "+27.0%", color: "text-green-600" },
          { label: "ENERGY SAVED", value: `${energy} MWh`, sub: "this month", trend: "+4.1%", color: "text-green-600" },
          { label: "OPERATOR DECISIONS", value: decisions > 999 ? `${(decisions / 1000).toFixed(2)}k` : decisions, sub: "total applied", trend: "+6.4%", color: "text-gray-900" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{kpi.label}</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-green-500 font-semibold">↗ {kpi.trend}</span>
            </div>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* OEE trend */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">OEE trend</h2>
            <p className="text-xs text-gray-400">Streaming simulation active · rolling 30-point window</p>
          </div>
          <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={oeeData}>
            <defs>
              <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="t" fontSize={10} tick={{ fill: "#9ca3af" }} />
            <YAxis domain={[80, 92]} fontSize={10} tick={{ fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: any) => [`${v}%`, "OEE"]} />
            <Area type="monotone" dataKey="oee" stroke="#22c55e" strokeWidth={2} fill="url(#oeeGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Recommendation Impact */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">AI Recommendation Impact — Portfolio</h2>
            <p className="text-xs text-gray-400">Cumulative effect of accepted AI recommendations</p>
          </div>
          <span className="text-green-600 text-xs font-semibold">📈 TRACKED</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "TOTAL PERFORMANCE GAIN", value: `+${gain}%`, sub: "vs. baseline operating point", progress: 74 },
            { label: "RECOMMENDATIONS APPLIED", value: "142", sub: "18 pending review", progress: 80 },
            { label: "ESTIMATED GAINS OVER TIME", value: `${mad} M MAD / yr`, sub: "Annualised business impact", progress: 65 },
          ].map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase mb-2">{item.label}</p>
              <p className="text-3xl font-bold text-green-600 mb-1">{item.value}</p>
              <p className="text-xs text-gray-400 mb-3">{item.sub}</p>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI value + Adoption */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">AI value contribution</h2>
          <p className="text-xs text-gray-400 mb-4">Last quarter</p>
          <div className="space-y-3">
            {[
              { label: "Energy optimization", value: "+ 9.6 M MAD" },
              { label: "Quality improvements", value: "+ 6.4 M MAD" },
              { label: "Avoided downtime", value: "+ 13.2 M MAD" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className="text-sm font-semibold text-green-600">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 font-bold">
              <span className="text-sm text-gray-900">Total impact</span>
              <span className="text-sm text-green-600">{mad} M MAD</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Adoption</h2>
          <p className="text-xs text-gray-400 mb-4">Recommendation acceptance</p>
          <p className="text-5xl font-bold text-green-600 mb-2">{adoption}%</p>
          <p className="text-xs text-gray-400 mb-4">Up from 64% last quarter</p>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${adoption}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}