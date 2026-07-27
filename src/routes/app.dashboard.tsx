import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KpiCard, PageHeader, SeverityBadge } from "@/components/ui-bits";
import { ChevronRight } from "lucide-react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OCP AI Monitor" }] }),
  component: DashboardPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

function buildDashboardData(pipelineData: any) {
  if (!pipelineData?.stats || !pipelineData?.apercu) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0)
    .slice(0, 3);

  if (numCols.length === 0) return null;

  const dateCol = pipelineData.headers?.find((h: string) =>
    h.toLowerCase().includes("date") || h.toLowerCase().includes("time")
  );

  const chartData = pipelineData.apercu.map((row: any, i: number) => {
    const point: any = { timestamp: dateCol ? (row[dateCol] || `L${i + 1}`) : `L${i + 1}` };
    numCols.forEach((col: any) => {
      const val = parseFloat((row[col.col] || "0").replace(",", "."));
      if (!isNaN(val)) point[col.col] = val;
    });
    return point;
  });

  const p2o5Col = numCols.find((c: any) =>
    c.col.toLowerCase().includes("p2o5") || c.col.toLowerCase().includes("p205")
  );

  const qualite = parseFloat(((pipelineData.lignes - pipelineData.stats.filter((s: any) => s.mean === null).length) / pipelineData.lignes * 100).toFixed(0));
  const alertes = pipelineData.alertes?.length || 0;

  return { numCols, chartData, p2o5Col, qualite, alertes };
}

function ChartCard({ title, subtitle, data, colKey, color, isArea }: {
  title: string; subtitle: string; data: any[];
  colKey: string; color: string; isArea: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold truncate">{title}</h3>
        <span className="text-xs text-muted-foreground shrink-0 ml-2">{subtitle}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        {isArea ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="timestamp" stroke="var(--muted-foreground)" fontSize={10} />
            <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey={colKey} stroke={color} fill="url(#grad1)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="timestamp" stroke="var(--muted-foreground)" fontSize={10} />
            <YAxis stroke="var(--muted-foreground)" fontSize={10} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey={colKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function DashboardPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [liveData, setLiveData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return store.subscribe(() => setPipelineData(store.getResult()));
  }, []);

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

  const dashData = pipelineData ? buildDashboardData(pipelineData) : null;
  const conformeStatut = pipelineData?.statut === "conforme";

  const activeAlertsCount = dashData
    ? dashData.alertes
    : Array.isArray(metrics?.active_alerts)
      ? metrics.active_alerts.length
      : metrics?.active_alerts || 0;

  if (loading && !pipelineData) return (
    <div className="p-8 text-center text-muted-foreground">Chargement des données...</div>
  );

  return (
    <div>
      <PageHeader
        title="Tableau de bord opérationnel"
        subtitle="Vue temps réel — Site El Jadida TSP"
      />

      {/* Bandeau fichier uploadé */}
      {pipelineData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 flex-wrap mb-5">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Production"
          value={dashData?.numCols?.[0]?.mean?.toFixed(1) ?? liveData?.production_rate?.toFixed(0) ?? "—"}
          unit={dashData ? "" : "t/h"}
          delta={dashData ? `col: ${dashData.numCols?.[0]?.col ?? "—"}` : "+2.3% vs target"}
          tone="success"
        />
        <KpiCard
          label="Efficacité (OEE)"
          value={dashData ? `${dashData.qualite}` : metrics?.model_accuracy_avg ? (metrics.model_accuracy_avg * 100).toFixed(1) : "93.4"}
          unit="%"
          delta={dashData ? "Qualité données fichier" : "Précision modèle ML"}
          tone="success"
        />
        <KpiCard
          label={dashData?.p2o5Col ? "P2O5 moyen" : "Qualité données"}
          value={dashData?.p2o5Col ? dashData.p2o5Col.mean?.toFixed(2) ?? "—" : metrics?.data_quality_score ? (metrics.data_quality_score * 100).toFixed(0) : "—"}
          unit="%"
          delta={dashData ? `depuis ${pipelineData.fichier}` : "Score qualité capteurs"}
        />
        <KpiCard
          label="Alertes actives"
          value={activeAlertsCount.toString()}
          delta={`${activeAlertsCount} alerte(s) en cours`}
          tone={activeAlertsCount > 0 ? "danger" : "success"}
        />
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {dashData && dashData.numCols.length > 0 ? (
          dashData.numCols.map((col: any, i: number) => (
            <ChartCard
              key={col.col}
              title={col.col}
              subtitle={`moy: ${col.mean?.toFixed(2)}`}
              data={dashData.chartData}
              colKey={col.col}
              color={COLORS[i] ?? "var(--chart-1)"}
              isArea={i === 0}
            />
          ))
        ) : (
          <>
            <ChartCard title="Température réacteur" subtitle="°C · dernières 24h" data={history} colKey="temperature_reaction" color="var(--chart-1)" isArea={true} />
            <ChartCard title="Pression filtre" subtitle="bar · dernières 24h" data={history} colKey="pression_filtre" color="var(--chart-2)" isArea={false} />
            <ChartCard title="Débit acide" subtitle="m³/h · dernières 24h" data={history} colKey="debit_acide" color="var(--chart-3)" isArea={false} />
          </>
        )}
      </div>

      {/* Alertes + Performance */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Alertes récentes</h3>
            <Link to="/app/alerts" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {pipelineData?.alertes?.length > 0 ? (
              pipelineData.alertes.map((a: any, i: number) => (
                <li key={i} className="p-4 flex items-start gap-3">
                  <SeverityBadge severity={a.type === "critique" ? "critical" : "warning"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.message}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {pipelineData.fichier} · {new Date(pipelineData.timestamp).toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                </li>
              ))
            ) : Array.isArray(metrics?.active_alerts) && metrics.active_alerts.length > 0 ? (
              metrics.active_alerts.slice(0, 4).map((a: any, i: number) => (
                <li key={i} className="p-4 flex items-start gap-3">
                  <SeverityBadge severity={a.level || "warning"} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.message}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.feature} · {a.since}</div>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4 text-sm text-muted-foreground text-center">Aucune alerte active</li>
            )}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Performance système</h3>
          <ul className="space-y-2.5 text-sm">
            {(dashData ? [
              { label: "Lignes analysées", status: pipelineData.lignes?.toLocaleString(), tone: "success" },
              { label: "Colonnes détectées", status: `${pipelineData.colonnes}`, tone: "success" },
              { label: "P2O5 moyen", status: pipelineData.p2o5 > 0 ? `${pipelineData.p2o5}%` : "—", tone: "success" },
              { label: "Colonnes numériques", status: `${dashData.numCols.length}`, tone: "success" },
              { label: "Statut fichier", status: pipelineData.statut?.toUpperCase(), tone: conformeStatut ? "success" : "danger" },
            ] : [
              { label: "Latence P95", status: `${metrics?.inference_latency_p95_ms || "—"} ms`, tone: "success" },
              { label: "Latence P99", status: `${metrics?.inference_latency_p99_ms || "—"} ms`, tone: "success" },
              { label: "Prédictions aujourd'hui", status: metrics?.total_predictions_today?.toLocaleString() || "—", tone: "success" },
              { label: "Dérives (7j)", status: `${metrics?.drift_detections_7d || 0}`, tone: metrics?.drift_detections_7d > 0 ? "warning" : "success" },
              { label: "Disponibilité", status: `${metrics?.uptime_pct || "—"}%`, tone: "success" },
            ]).map((s: any) => {
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