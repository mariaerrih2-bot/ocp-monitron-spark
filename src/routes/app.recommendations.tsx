import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MOCK_RECOMMENDATIONS, type Recommendation } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui-bits";
import { Check, X, Brain, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — OCP AI Monitor" }] }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const [items, setItems] = useState<Recommendation[]>(MOCK_RECOMMENDATIONS);

  const decide = (id: string, status: "applied" | "rejected") =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <div>
      <PageHeader
        title="AI recommendations"
        subtitle="Decision support generated from anomaly context and historical analogs"
      />

      <div className="grid gap-4">
        {items.map((r) => (
          <div
            key={r.id}
            className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{r.unit}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">linked to {r.alertId}</span>
                </div>
                <h3 className="text-base font-semibold mt-1">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.detail}</p>
              </div>
              <ConfidenceRing value={r.confidence} />
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Why this recommendation
                </div>
                <ul className="space-y-1.5 text-sm">
                  {r.reasoning.map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                  Expected impact
                </div>
                <div className="text-sm">{r.impact}</div>
                <Link
                  to="/app/explain"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-3"
                >
                  See full AI explanation <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                {r.status === "pending" && (
                  <span className="text-xs text-muted-foreground">Awaiting decision</span>
                )}
                {r.status === "applied" && (
                  <span className="text-xs text-success font-medium">✓ Applied · logged for feedback</span>
                )}
                {r.status === "rejected" && (
                  <span className="text-xs text-destructive font-medium">✗ Rejected · logged for feedback</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={r.status !== "pending"}
                  onClick={() => decide(r.id, "rejected")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  disabled={r.status !== "pending"}
                  onClick={() => decide(r.id, "applied")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> Apply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.85 ? "success" : value >= 0.7 ? "info" : "warning";
  const color = tone === "success" ? "var(--success)" : tone === "info" ? "var(--info)" : "var(--warning)";
  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        className="w-16 h-16 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(${color} ${pct * 3.6}deg, var(--muted) 0deg)`,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-card grid place-items-center">
          <span className="text-sm font-semibold">{pct}%</span>
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        Confidence
      </div>
    </div>
  );
}
