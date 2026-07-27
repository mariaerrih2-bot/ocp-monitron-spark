import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, SeverityBadge } from "@/components/ui-bits";
import { Search, ArrowRight, RefreshCw } from "lucide-react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({ meta: [{ title: "Alertes & Anomalies — OCP AI Monitor" }] }),
  component: AlertsPage,
});

function buildAlertsFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0);

  const alertes: any[] = [];

  // Alertes depuis les vraies données
  numCols.forEach((col: any) => {
    const range = col.max - col.min;
    if (range === 0) return;
    const ecart = (col.mean - col.min) / range;

    if (ecart > 0.9) {
      alertes.push({
        level: "critical",
        message: `Valeur critique détectée sur ${col.col}`,
        feature: col.col,
        since: new Date(pipelineData.timestamp).toISOString(),
        detail: `Moyenne ${col.mean?.toFixed(2)} proche du maximum ${col.max?.toFixed(2)}`,
        mean: col.mean, min: col.min, max: col.max,
      });
    } else if (ecart < 0.15) {
      alertes.push({
        level: "warning",
        message: `Dérive légère détectée sur ${col.col}`,
        feature: col.col,
        since: new Date(pipelineData.timestamp).toISOString(),
        detail: `Moyenne ${col.mean?.toFixed(2)} proche du minimum ${col.min?.toFixed(2)}`,
        mean: col.mean, min: col.min, max: col.max,
      });
    } else if (ecart > 0.75) {
      alertes.push({
        level: "warning",
        message: `Valeur élevée sur ${col.col}`,
        feature: col.col,
        since: new Date(pipelineData.timestamp).toISOString(),
        detail: `Moyenne ${col.mean?.toFixed(2)} — surveillance recommandée`,
        mean: col.mean, min: col.min, max: col.max,
      });
    }
  });

  // Alerte P2O5 si non conforme
  if (pipelineData.statut === "non-conforme" && pipelineData.p2o5 > 0) {
    alertes.unshift({
      level: "critical",
      message: `P2O5 non conforme — ${pipelineData.p2o5}% (seuil 44%)`,
      feature: "P2O5",
      since: new Date(pipelineData.timestamp).toISOString(),
      detail: `Fichier ${pipelineData.fichier} — ${pipelineData.lignes} lignes analysées`,
      mean: pipelineData.p2o5, min: 0, max: 55,
    });
  }

  return alertes;
}

function AlertsPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [apiAlerts, setApiAlerts] = useState<any[]>([]);
  const [driftResult, setDriftResult] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "warning" | "critical" | "info">("all");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return store.subscribe(() => {
      const d = store.getResult();
      setPipelineData(d);
      setSelected(null);
    });
  }, []);

  const fetchAlerts = async () => {
    try {
      const met = await api.getMetrics();
      const alertList = Array.isArray(met?.active_alerts) ? met.active_alerts : [];
      setApiAlerts(alertList);
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
        reference_values: values.slice(50, 100),
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

  const fileAlerts = pipelineData ? buildAlertsFromFile(pipelineData) : null;
  const allAlerts = fileAlerts ?? apiAlerts;

  const filtered = allAlerts.filter((a: any) => {
    const matchFilter = filter === "all" || a.level === filter;
    const matchSearch = search === "" ||
      a.message?.toLowerCase().includes(search.toLowerCase()) ||
      a.feature?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const conformeStatut = pipelineData?.statut === "conforme";

  if (loading && !pipelineData) return (
    <div className="p-8 text-center text-muted-foreground">Chargement des alertes...</div>
  );

  return (
    <div>
      <PageHeader
        title="Alertes & Anomalies"
        subtitle={fileAlerts ? `Alertes générées depuis ${pipelineData.fichier}` : "Toutes les anomalies détectées sur le procédé TSP"}
      />

      {/* Bandeau fichier */}
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
          {fileAlerts && (
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
              {fileAlerts.length} alertes détectées
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Liste alertes */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Rechercher par variable, message..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
            {!fileAlerts && (
              <button
                onClick={runDriftAnalysis}
                disabled={analyzing}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${analyzing ? "animate-spin" : ""}`} />
                Analyser dérive
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm">
                {pipelineData ? "Aucune anomalie détectée dans ce fichier" : "Aucune alerte active"}
              </div>
              {!fileAlerts && (
                <button
                  onClick={runDriftAnalysis}
                  disabled={analyzing}
                  className="mt-4 text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground"
                >
                  {analyzing ? "Analyse en cours..." : "Lancer analyse de dérive"}
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[calc(100vh-300px)] overflow-y-auto">
              {filtered.map((a: any, i: number) => (
                <li
                  key={i}
                  onClick={() => setSelected(a)}
                  className={`p-4 cursor-pointer transition hover:bg-muted/50 ${selected === a ? "bg-accent/40" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={a.level || "warning"} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.since).toLocaleString("fr-FR")}
                      </div>
                      <div className="text-sm font-medium mt-1">{a.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Variable : <span className="font-medium">{a.feature}</span>
                        {a.detail && <span className="ml-2 text-gray-400">· {a.detail}</span>}
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
                {driftResult.ks_statistic && <div>KS : <span className="font-mono">{driftResult.ks_statistic?.toFixed(4)}</span></div>}
                {driftResult.p_value && <div>P-value : <span className="font-mono">{driftResult.p_value?.toFixed(4)}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* Détail alerte */}
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
                <Field label="Depuis" value={new Date(selected.since).toLocaleString("fr-FR")} />
                <Field label="Statut" value="Actif" />
                {selected.mean !== undefined && <Field label="Moyenne" value={selected.mean?.toFixed(3)} />}
                {selected.min !== undefined && <Field label="Min / Max" value={`${selected.min?.toFixed(2)} / ${selected.max?.toFixed(2)}`} />}
              </div>

              {pipelineData && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fichier source</div>
                  <p className="text-xs text-muted-foreground">
                    {pipelineData.fichier} · {pipelineData.lignes} lignes · {pipelineData.colonnes} colonnes
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Variables affectées</div>
                <div className="flex flex-wrap gap-1.5">
                  {[selected.feature, ...(pipelineData?.headers?.filter((h: string) => h !== selected.feature).slice(0, 2) || ["pression_filtre", "debit_acide"])].map((v: string) => (
                    <span key={v} className="text-xs px-2 py-1 rounded bg-muted">{v}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Impact procédé TSP</div>
                <p className="text-xs text-muted-foreground">
                  Une anomalie sur <strong>{selected.feature}</strong> peut impacter la qualité du P2O5 final.
                  Vérifier les paramètres de la réaction et ajuster si nécessaire.
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  to="/app/recommendations"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-95"
                >
                  Voir recommandation <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setSelected(null)}
                  className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted"
                >
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