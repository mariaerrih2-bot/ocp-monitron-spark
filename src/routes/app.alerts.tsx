import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MOCK_ALERTS, type Alert } from "@/lib/mock-data";
import { PageHeader, SeverityBadge } from "@/components/ui-bits";
import { Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({ meta: [{ title: "Alerts & Anomalies — OCP AI Monitor" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const [selected, setSelected] = useState<Alert | null>(MOCK_ALERTS[0]);
  const [filter, setFilter] = useState<"all" | "open" | "ack" | "resolved">("all");

  const list = MOCK_ALERTS.filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <PageHeader
        title="Alerts & anomalies"
        subtitle="All anomalies detected across plant equipment"
      />

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search by ID, unit, variable..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "open", "ack", "resolved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f === "ack" ? "Acknowledged" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-border max-h-[calc(100vh-250px)] overflow-y-auto">
            {list.map((a) => (
              <li
                key={a.id}
                onClick={() => setSelected(a)}
                className={`p-4 cursor-pointer transition hover:bg-muted/50 ${
                  selected?.id === a.id ? "bg-accent/40" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <SeverityBadge severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{a.id}</span>
                      <span className="text-xs text-muted-foreground">· {a.timestamp}</span>
                    </div>
                    <div className="text-sm font-medium mt-1">{a.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {a.unit} · {a.variable}: <span className="font-medium">{a.value}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)] sticky top-20">
              <div className="flex items-center gap-2 mb-3">
                <SeverityBadge severity={selected.severity} />
                <span className="text-xs font-mono text-muted-foreground">{selected.id}</span>
              </div>
              <h3 className="text-base font-semibold">{selected.message}</h3>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <Field label="Unit" value={selected.unit} />
                <Field label="Variable" value={selected.variable} />
                <Field label="Value" value={selected.value} />
                <Field label="Detected" value={selected.timestamp} />
                <Field label="Status" value={selected.status} />
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Affected variables
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[selected.variable, "Inlet temp", "Cooling flow"].map((v) => (
                    <span key={v} className="text-xs px-2 py-1 rounded bg-muted">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  to="/app/recommendations"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-95"
                >
                  See recommendation <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted">
                  Acknowledge
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select an alert to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5 capitalize">{value}</div>
    </div>
  );
}
