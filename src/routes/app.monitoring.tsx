import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, KpiCard, StatusPill } from "@/components/ui-bits";

export const Route = createFileRoute("/app/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — OCP AI Monitor" }] }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const [models, setModels] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mod, met, hist] = await Promise.all([
          api.getModels(),
          api.getMetrics(),
          api.getHistory(),
        ]);
        setModels(mod);
        setMetrics(met);
        setHistory(hist?.data || []);
      } catch (e) {
        console.error("API error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const t = setInterval(fetchData, 10000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;

  const driftCount = metrics?.drift_detections_7d || 0;
  const modelList = models?.models || [];

  return (
    <div>
      <PageHeader
        title="Monitoring des modèles"
        subtitle="Performance, dérive et santé des modèles ML en production"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Modèles en production" value={modelList.length.toString() || "—"} />
        <KpiCard label="Précision moyenne" value={metrics?.model_accuracy_avg ? (metrics.model_accuracy_avg * 100).toFixed(1) : "—"} unit="%" tone="success" />
        <KpiCard label="Latence P95" value={metrics?.inference_latency_p95_ms?.toString() || "—"} unit="ms" />
        <KpiCard label="Dérives (7j)" value={driftCount.toString()} tone={driftCount > 0 ? "warning" : "success"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Température réaction & P2O5 (dernières 24h)</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Legend color="var(--chart-1)" label="Température" />
              <Legend color="var(--chart-2)" label="P2O5" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => v.substring(11, 16)} />
              <YAxis yAxisId="temp" stroke="var(--muted-foreground)" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
              <YAxis yAxisId="p2o5" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="temp" type="monotone" dataKey="temperature_reaction" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Température (°C)" />
              <Line yAxisId="p2o5" type="monotone" dataKey="p2o5_measured" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="P2O5 (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Santé des services</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>API Inférence</span><StatusPill status="ok" label="Opérationnel" /></li>
            <li className="flex justify-between"><span>Feature Store</span><StatusPill status="ok" label="Opérationnel" /></li>
            <li className="flex justify-between"><span>Détection dérive</span><StatusPill status={driftCount > 0 ? "warning" : "ok"} label={driftCount > 0 ? "Alerte" : "Normal"} /></li>
            <li className="flex justify-between"><span>Registre modèles</span><StatusPill status="ok" label="Opérationnel" /></li>
            <li className="flex justify-between"><span>Qualité données</span><StatusPill status={metrics?.data_quality_score > 0.95 ? "ok" : "warning"} label={metrics?.data_quality_score > 0.95 ? "Bonne" : "Dégradée"} /></li>
          </ul>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">MÉTRIQUES SYSTÈME</h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex justify-between"><span>Prédictions aujourd'hui</span><span className="font-mono">{metrics?.total_predictions_today?.toLocaleString() || "—"}</span></li>
              <li className="flex justify-between"><span>Latence P99</span><span className="font-mono">{metrics?.inference_latency_p99_ms || "—"} ms</span></li>
              <li className="flex justify-between"><span>Disponibilité</span><span className="font-mono">{metrics?.uptime_pct || "—"}%</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Modèles en production</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Modèle</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Précision</th>
                <th className="text-left px-4 py-2">Latence</th>
                <th className="text-left px-4 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {modelList.length > 0 ? modelList.map((m: any, i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{m.name || m.model_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.type || m.model_type || "GBM"}</td>
                  <td className="px-4 py-3">{m.accuracy ? (m.accuracy * 100).toFixed(1) + "%" : m.auc || "—"}</td>
                  <td className="px-4 py-3">{m.latency_ms ? m.latency_ms + " ms" : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      status={m.status === "healthy" || m.status === "ok" ? "ok" : m.status === "warning" || m.status === "watch" ? "warning" : "error"}
                      label={m.status === "healthy" || m.status === "ok" ? "Actif" : m.status === "warning" ? "Surveillance" : "Dérive"}
                    />
                  </td>
                </tr>
              )) : (
                <tr className="border-t border-border">
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Aucun modèle trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-0.5 inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}
