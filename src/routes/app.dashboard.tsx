import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { generateTelemetry, MOCK_ALERTS } from "@/lib/mock-data";
import { KpiCard, PageHeader, SeverityBadge } from "@/components/ui-bits";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OCP AI Monitor" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [data, setData] = useState(() => generateTelemetry());

  useEffect(() => {
    const t = setInterval(() => setData(generateTelemetry()), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        subtitle="Real-time view of plant performance — Khouribga site"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Production" value="1,284" unit="t/h" delta="+2.3% vs target" tone="success" />
        <KpiCard label="Efficiency (OEE)" value="87.4" unit="%" delta="+0.6 pts today" tone="success" />
        <KpiCard label="Energy use" value="412" unit="kWh/t" delta="-1.1% vs avg" />
        <KpiCard label="Open alerts" value="3" delta="2 critical · 1 warning" tone="danger" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Reactor temperature</h3>
            <span className="text-xs text-muted-foreground">°C · last 2h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="temperature" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Pressure</h3>
            <span className="text-xs text-muted-foreground">bar · last 2h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={["dataMin - 0.2", "dataMax + 0.2"]} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="pressure" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Flow rate</h3>
            <span className="text-xs text-muted-foreground">m³/h · last 2h</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="flow" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Recent alerts</h3>
            <Link to="/app/alerts" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {MOCK_ALERTS.slice(0, 4).map((a) => (
              <li key={a.id} className="p-4 flex items-start gap-3">
                <SeverityBadge severity={a.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.message}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.unit} · {a.variable} · {a.value} · {a.timestamp}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">System status</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: "Reactor R-204", status: "Anomaly", tone: "danger" as const },
              { label: "Compressor C-7", status: "Normal", tone: "success" as const },
              { label: "Filter F-9", status: "Warning", tone: "warning" as const },
              { label: "Dryer D-3", status: "Normal", tone: "success" as const },
              { label: "Pump P-12", status: "Warning", tone: "warning" as const },
            ].map((s) => {
              const dot =
                s.tone === "danger" ? "bg-destructive" : s.tone === "warning" ? "bg-warning" : "bg-success";
              return (
                <li key={s.label} className="flex items-center justify-between">
                  <span className="text-foreground">{s.label}</span>
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`status-dot w-2 h-2 rounded-full ${dot}`} />
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
