import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KpiCard, PageHeader, SeverityBadge } from "@/components/ui-bits";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OCP AI Monitor" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [liveData, setLiveData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [live, hist, met] = await Promise.all([
        api.getLiveData(),
        api.getHistory(),
        api.getMetrics(),
      ]);
      setLiveData(live);
      setHistory(hist?.data || hist || []);
      setMetrics(met);
    } catch (e) {
      console.error("API error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement des données...</div>;

  const activeAlertsCount = Array.isArray(metrics?.active_alerts)
    ? metrics.active_alerts.length
    : metrics?.active_alerts || 0;

  return (
    <div>
      <PageHeader
        title="Tableau de bord opérationnel"
        subtitle="Vue temps réel — Site El Jadida TSP"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Production" value={liveData?.production_rate?.toFixed(0) || "—"} unit="t/h" delta="+2.3% vs target" tone="success" />
        <KpiCard label="Efficacité (OEE)" value={metrics?.model_accuracy_avg ? (metrics.model_accuracy_avg * 100).toFixed(1) : "93.4"} unit="%" delta="Précision modèle ML" tone="success" />
        <KpiCard label="Qualité données" value={metrics?.data_quality_score ? (metrics.data_quality_score * 100).toFixed(0) : "—"} unit="%" delta="Score qualité capteurs" />
        <KpiCard label="Alertes actives" value={activeAlertsCount.toString()} delta={`${activeAlertsCount} alerte(s) en cours`} tone={activeAlertsCount > 0 ? "danger" : "success"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Température réacteur</h3>
            <span className="text-xs text-muted-foreground">°C · dernières 24h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => v.substring(11, 16)} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="temperature_reaction" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Pression filtre</h3>
            <span className="text-xs text-muted-foreground">bar · dernières 24h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => v.substring(11, 16)} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="pression_filtre" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Débit acide</h3>
            <span className="text-xs text-muted-foreground">m³/h · dernières 24h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timestamp" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => v.substring(11, 16)} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="debit_acide" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Alertes récentes</h3>
            <Link to="/app/alerts" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {(Array.isArray(metrics?.active_alerts) ? metrics.active_alerts : []).slice(0, 4).map((a: any, i: number) => (
              <li key={i} className="p-4 flex items-start gap-3">
                <SeverityBadge severity={a.level || "warning"} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.message}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.feature} · {a.since}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Performance système</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: "Latence P95", status: `${metrics?.inference_latency_p95_ms || "—"} ms`, tone: "success" },
              { label: "Latence P99", status: `${metrics?.inference_latency_p99_ms || "—"} ms`, tone: "success" },
              { label: "Prédictions aujourd'hui", status: metrics?.total_predictions_today?.toLocaleString() || "—", tone: "success" },
              { label: "Dérives (7j)", status: `${metrics?.drift_detections_7d || 0}`, tone: metrics?.drift_detections_7d > 0 ? "warning" : "success" },
              { label: "Disponibilité", status: `${metrics?.uptime_pct || "—"}%`, tone: "success" },
            ].map((s: any) => {
              const dot = s.tone === "danger" ? "bg-destructive" : s.tone === "warning" ? "bg-warning" : "bg-success";
              return (
                <li key={s.label} className="flex items-center justify-between">
                  <span className="text-foreground">{s.label}</span>
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {s.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}