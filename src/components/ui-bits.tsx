import type { Severity } from "@/lib/mock-data";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map = {
    critical: "bg-destructive/10 text-destructive border-destructive/30",
    warning: "bg-warning/15 text-warning-foreground border-warning/40",
    info: "bg-info/10 text-info border-info/30",
  } as const;
  const labels = { critical: "Critical", warning: "Warning", info: "Info" } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium uppercase tracking-wide ${map[severity]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[severity]}
    </span>
  );
}

export function StatusPill({
  status,
  label,
}: {
  status: "ok" | "warning" | "error";
  label: string;
}) {
  const map = {
    ok: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/15 text-warning-foreground border-warning/40",
    error: "bg-destructive/10 text-destructive border-destructive/30",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${map[status]}`}
    >
      <span className="status-dot w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneCls = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning-foreground",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-semibold ${toneCls}`}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {delta && <div className="text-xs text-muted-foreground mt-1">{delta}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
