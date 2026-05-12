import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, SeverityBadge } from "@/components/ui-bits";
import { Search, ArrowRight, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({ meta: [{ title: "Alertes & Anomalies — OCP AI Monitor" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [driftResult, setDriftResult] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "warning" | "critical" | "info">("all");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const met = await api.getMetrics();
      const alertList = Array.isArray(met?.active_alerts) ? met.active_alerts : [];
      setAlerts(alertList);
      if (alertList.length > 0 && !selected) setSelected(alertList[0]);
    } catch (e) {
      console.error("API error:", e);
    } finally {
      setLoading(false);
    }
  };

  const runDriftAnalysis = async () => {
    setAnalyzing(true);
    try {
      const hist = await api.getHistory();
      const data = hist?.data || [];
      const values = data.map((d: any) => d.temperature_reaction).filter(Boolean);
      const result = await api.analyzeDrift({ 
        feature: "temperature_reaction",
        values: values.slice(0, 50),
        reference_values: values.slice(50, 100)
      });
      setDriftResult(result);
    } catch (e) {
      console.error("Drift error:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const t = setInterval(fetchAlerts, 10000);
    return () => clearInterval(t);
  }, []);

  const list = alerts.filter((a) => filter === "all" || a.level === filter);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement des alertes...</div>;

  return (
    <div>
      <PageHeader
        title="Alertes & Anomalies"
        subtitle="Toutes les anomalies détectées sur le procédé TSP"
      />

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Rechercher par variable, message..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "critical", "warning", "info"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f === "all" ? "Toutes" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={runDriftAnalysis}
              disabled={analyzing}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${analyzing ? "animate-spin" : ""}`} />
              Analyser dérive
            </button>
          </div>

          {list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm">Aucune alerte active</div>
              <button
                onClick={runDriftAnalysis}
                disabled={analyzing}
                className="mt-4 text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground"
              >
                {analyzing ? "Analyse en cours..." : "Lancer analyse de dérive"}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[calc(100vh-250px)] overflow-y-auto">
              {list.map((a: any, i: number) => (
                <li
                  key={i}
                  onClick={() => setSelected(a)}
                  className={`p-4 cursor-pointer transition hover:bg-muted/50 ${
                    selected === a ? "bg-accent/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={a.level || "warning"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{a.since}</span>
                      </div>
                      <div className="text-sm font-medium mt-1">{a.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Variable : <span className="font-medium">{a.feature}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {driftResult && (
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="text-xs font-semibold mb-2">Résultat analyse dérive</div>
              <div className="text-xs space-y-1">
                <div>Statut : <span className={`font-medium ${driftResult.drift_detected ? "text-destructive" : "text-success"}`}>
                  {driftResult.drift_detected ? "⚠️ Dérive détectée" : "✅ Pas de dérive"}
                </span></div>
                {driftResult.ks_statistic && <div>KS Statistic : <span className="font-mono">{driftResult.ks_statistic?.toFixed(4)}</span></div>}
                {driftResult.p_value && <div>P-value : <span className="font-mono">{driftResult.p_value?.toFixed(4)}</span></div>}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-card border border-border rounded-xl p-5 shadow-[var(--shadow-card)] sticky top-20">
              <div className="flex items-center gap-2 mb-3">
                <SeverityBadge severity={selected.level || "warning"} />
                <span className="text-xs font-mono text-muted-foreground">{selected.level?.toUpperCase()}</span>
              </div>
              <h3 className="text-base font-semibold">{selected.message}</h3>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <Field label="Variable" value={selected.feature || "—"} />
                <Field label="Niveau" value={selected.level || "—"} />
                <Field label="Depuis" value={selected.since?.substring(0, 16).replace("T", " ") || "—"} />
                <Field label="Statut" value="Actif" />
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Variables affectées
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[selected.feature, "pression_filtre", "debit_acide"].map((v: string) => (
                    <span key={v} className="text-xs px-2 py-1 rounded bg-muted">{v}</span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Impact procédé TSP
                </div>
                <p className="text-xs text-muted-foreground">
                  Une dérive sur <strong>{selected.feature}</strong> peut impacter la qualité du P2O5 final. 
                  Vérifier les paramètres de la réaction phosphorique et ajuster le débit d'acide sulfurique.
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  to="/app/recommendations"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-95"
                >
                  Voir recommandation <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted">
                  Acquitter
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center shadow-[var(--shadow-card)]">
              <div className="text-3xl mb-3">🔍</div>
              <div className="text-sm text-muted-foreground">Sélectionnez une alerte pour voir les détails</div>
            </div>
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
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}