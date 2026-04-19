import { createFileRoute } from "@tanstack/react-router";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader, KpiCard } from "@/components/ui-bits";

export const Route = createFileRoute("/app/management")({
  head: () => ({ meta: [{ title: "Management — OCP AI Monitor" }] }),
  component: ManagementPage,
});

const monthly = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  production: 95000 + Math.round(Math.sin(i / 2) * 8000 + Math.random() * 5000),
  target: 100000,
}));

const sites = [
  { name: "Khouribga", oee: 87, prod: 1284 },
  { name: "Jorf Lasfar", oee: 91, prod: 1620 },
  { name: "Benguerir", oee: 82, prod: 880 },
  { name: "Youssoufia", oee: 79, prod: 720 },
];

function ManagementPage() {
  return (
    <div>
      <PageHeader
        title="Executive overview"
        subtitle="Group-wide performance — all sites, last 30 days"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total production" value="4.5M" unit="t" delta="+3.2% YoY" tone="success" />
        <KpiCard label="Group OEE" value="84.7" unit="%" delta="+1.4 pts" tone="success" />
        <KpiCard label="Energy cost" value="412" unit="MAD/t" delta="-2.1% MoM" tone="success" />
        <KpiCard label="AI value created" value="14.2M" unit="MAD" delta="this quarter" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-1">Monthly production vs target</h3>
          <p className="text-xs text-muted-foreground mb-3">Tonnage across all sites</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="prod" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="production" stroke="var(--chart-1)" fill="url(#prod)" strokeWidth={2} />
              <Area type="monotone" dataKey="target" stroke="var(--chart-3)" fill="transparent" strokeDasharray="5 5" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Strategic indicators</h3>
          <ul className="space-y-3 text-sm">
            {[
              { k: "Unplanned downtime", v: "-22%", good: true },
              { k: "Quality incidents", v: "-18%", good: true },
              { k: "Maintenance cost", v: "-9%", good: true },
              { k: "Carbon intensity", v: "-4%", good: true },
              { k: "AI adoption rate", v: "78%", good: true },
            ].map((i) => (
              <li key={i.k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{i.k}</span>
                <span className={`font-semibold ${i.good ? "text-success" : "text-destructive"}`}>{i.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold mb-1">Performance by site</h3>
        <p className="text-xs text-muted-foreground mb-3">OEE % per industrial site</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sites}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="oee" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
