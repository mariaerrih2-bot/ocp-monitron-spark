import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MODEL_METRICS, SYSTEM_LOGS } from "@/lib/mock-data";
import { PageHeader, KpiCard, StatusPill } from "@/components/ui-bits";

export const Route = createFileRoute("/app/monitoring")({
  head: () => ({ meta: [{ title: "Model monitoring — OCP AI Monitor" }] }),
  component: MonitoringPage,
});

const driftData = Array.from({ length: 14 }, (_, i) => ({
  day: `D-${13 - i}`,
  detector: 0.04 + Math.random() * 0.04,
  maintenance: 0.1 + Math.random() * 0.12,
  quality: 0.2 + Math.random() * 0.15,
}));

function MonitoringPage() {
  return (
    <div>
      <PageHeader
        title="Model monitoring"
        subtitle="Performance, drift and health for production ML models"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Models in production" value="14" />
        <KpiCard label="Avg AUC" value="0.88" tone="success" />
        <KpiCard label="Inference latency p95" value="64" unit="ms" />
        <KpiCard label="Drift alerts (7d)" value="2" tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Data drift (KS statistic, 14 days)</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Legend color="var(--chart-1)" label="Detector" />
              <Legend color="var(--chart-2)" label="Maintenance" />
              <Legend color="var(--chart-4)" label="Quality" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={driftData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 0.4]} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="detector" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="maintenance" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="quality" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Service health</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Inference API</span><StatusPill status="ok" label="Healthy" /></li>
            <li className="flex justify-between"><span>Feature store</span><StatusPill status="ok" label="Healthy" /></li>
            <li className="flex justify-between"><span>Drift monitor</span><StatusPill status="warning" label="Degraded" /></li>
            <li className="flex justify-between"><span>Model registry</span><StatusPill status="ok" label="Healthy" /></li>
            <li className="flex justify-between"><span>Notification bus</span><StatusPill status="ok" label="Healthy" /></li>
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Models</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Model</th>
                  <th className="text-left px-4 py-2">AUC</th>
                  <th className="text-left px-4 py-2">Latency</th>
                  <th className="text-left px-4 py-2">Drift</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_METRICS.map((m) => (
                  <tr key={m.name} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">{m.auc}</td>
                    <td className="px-4 py-3">{m.latency}</td>
                    <td className="px-4 py-3">{m.drift}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        status={m.status === "healthy" ? "ok" : m.status === "watch" ? "warning" : "error"}
                        label={m.status === "healthy" ? "Healthy" : m.status === "watch" ? "Watch" : "Drift"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Recent logs</h3>
          <ul className="space-y-1.5 text-xs font-mono">
            {SYSTEM_LOGS.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">{l.ts}</span>
                <span
                  className={
                    l.level === "ERROR"
                      ? "text-destructive"
                      : l.level === "WARN"
                      ? "text-warning-foreground"
                      : "text-info"
                  }
                >
                  {l.level}
                </span>
                <span className="text-foreground/80 truncate">{l.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-0.5" style={{ background: color }} />
      {label}
    </span>
  );
}
