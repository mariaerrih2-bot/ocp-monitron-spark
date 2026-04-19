import { createFileRoute } from "@tanstack/react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FEATURE_IMPORTANCE } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui-bits";
import { Brain, Lightbulb, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/explain")({
  head: () => ({ meta: [{ title: "AI Explanation — OCP AI Monitor" }] }),
  component: ExplainPage,
});

function ExplainPage() {
  return (
    <div>
      <PageHeader
        title="AI explanation"
        subtitle="Understand how the model reached its conclusion for ALR-2041 / Reactor R-204"
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Feature importance (SHAP)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contribution of each input variable to the anomaly score
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Model v3.2</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis dataKey="feature" type="category" stroke="var(--muted-foreground)" fontSize={11} width={140} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {FEATURE_IMPORTANCE.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "var(--destructive)" : i < 3 ? "var(--chart-3)" : "var(--chart-1)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold">In simple terms</h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            The reactor is overheating mainly because the <strong>inlet temperature</strong> rose
            sharply and the <strong>cooling water flow</strong> can't keep up. This pattern matches
            past incidents that led to emergency shutdowns within 15–20 minutes.
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Recommended action
            </div>
            <p className="text-sm">Reduce setpoint by 4 °C — confidence 92%.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold">Root cause</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Cooling capacity saturation under elevated feed temperature. Likely external trigger:
            ambient temperature spike + reduced cooling tower performance.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-info/10 text-info grid place-items-center">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold">Model context</h3>
          </div>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li>Trained on 2.4M plant events</li>
            <li>AUC 0.94 on holdout set</li>
            <li>Last retrained 3 days ago</li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold mb-3">Historical analogs</h3>
          <ul className="text-sm space-y-2">
            {[
              { id: "INC-2024-08-11", outcome: "Resolved by setpoint reduction", success: true },
              { id: "INC-2024-03-22", outcome: "Resolved by manual cooling boost", success: true },
              { id: "INC-2023-11-04", outcome: "Led to 4h shutdown", success: false },
            ].map((h) => (
              <li key={h.id} className="flex items-start gap-2">
                <span
                  className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                    h.success ? "bg-success" : "bg-destructive"
                  }`}
                />
                <div>
                  <div className="font-mono text-xs">{h.id}</div>
                  <div className="text-xs text-muted-foreground">{h.outcome}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
