import { createFileRoute } from "@tanstack/react-router";
import { PIPELINE_STATUS, SYSTEM_LOGS } from "@/lib/mock-data";
import { PageHeader, KpiCard, StatusPill } from "@/components/ui-bits";
import { Server, Database, Workflow, Bell } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "System & Admin — OCP AI Monitor" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div>
      <PageHeader
        title="System & administration"
        subtitle="Pipeline orchestration, infrastructure and operational logs"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Services up" value="14 / 14" tone="success" />
        <KpiCard label="Throughput" value="12.4k" unit="msg/s" />
        <KpiCard label="Error rate (24h)" value="0.04" unit="%" tone="success" />
        <KpiCard label="Pending jobs" value="3" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Workflow className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Pipeline status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Service</th>
                  <th className="text-left px-4 py-2">Throughput</th>
                  <th className="text-left px-4 py-2">Latency</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {PIPELINE_STATUS.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.throughput}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.latency}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        status={p.status === "ok" ? "ok" : p.status === "warning" ? "warning" : "error"}
                        label={p.status === "ok" ? "Running" : p.status === "warning" ? "Warning" : "Error"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <InfraCard icon={<Server className="w-4 h-4" />} title="Compute" items={[
            { k: "CPU usage", v: "42%" },
            { k: "Memory", v: "68%" },
            { k: "GPU (inference)", v: "31%" },
          ]} />
          <InfraCard icon={<Database className="w-4 h-4" />} title="Storage" items={[
            { k: "Time-series DB", v: "7.4 TB / 12 TB" },
            { k: "Feature store", v: "1.2 TB" },
            { k: "Model registry", v: "184 versions" },
          ]} />
          <InfraCard icon={<Bell className="w-4 h-4" />} title="Alerting" items={[
            { k: "Channels", v: "Email · SMS · Teams" },
            { k: "Notifications (24h)", v: "47" },
            { k: "Failed deliveries", v: "0" },
          ]} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">System logs</h3>
          <span className="text-xs text-muted-foreground">Last 30 minutes</span>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <ul className="space-y-1 text-xs font-mono">
            {[...SYSTEM_LOGS, ...SYSTEM_LOGS].map((l, i) => (
              <li key={i} className="flex gap-3 border-b border-border/50 pb-1">
                <span className="text-muted-foreground shrink-0">{l.ts}</span>
                <span
                  className={`shrink-0 w-12 ${
                    l.level === "ERROR"
                      ? "text-destructive"
                      : l.level === "WARN"
                      ? "text-warning-foreground"
                      : "text-info"
                  }`}
                >
                  {l.level}
                </span>
                <span className="text-foreground/80">{l.msg}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfraCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { k: string; v: string }[];
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <ul className="text-sm space-y-1">
        {items.map((it) => (
          <li key={it.k} className="flex justify-between">
            <span className="text-muted-foreground">{it.k}</span>
            <span className="font-medium">{it.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
