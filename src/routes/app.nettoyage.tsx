import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/nettoyage")({
  head: () => ({
    meta: [
      { title: "Nettoyage des données — OCP AI Monitor" },
      { name: "description", content: "Statistiques de nettoyage des datasets CSV, DATA3 et Synthèse DEF." },
    ],
  }),
  component: NettoyagePage,
});

const API_URL = "https://gating-revoke-sliceable.ngrok-free.dev/stats_nettoyage";

interface DatasetStats {
  lignes_initiales?: number;
  lignes_finales?: number;
  lignes?: number;
  colonnes?: number;
  pourcentage_nettoye?: number;
}

interface StatsResponse {
  csv?: DatasetStats;
  data3?: DatasetStats;
  synthese_def?: DatasetStats;
}

const FALLBACK: StatsResponse = {
  csv: { lignes_initiales: 1_713_767, lignes_finales: 652_051, pourcentage_nettoye: 62 },
  data3: { lignes: 339, colonnes: 26 },
  synthese_def: { lignes: 53, colonnes: 26 },
};

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("fr-FR");
}

function NettoyagePage() {
  const [stats, setStats] = useState<StatsResponse>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as StatsResponse;
      setStats({
        csv: { ...FALLBACK.csv, ...(data.csv ?? {}) },
        data3: { ...FALLBACK.data3, ...(data.data3 ?? {}) },
        synthese_def: { ...FALLBACK.synthese_def, ...(data.synthese_def ?? {}) },
      });
      setUsingFallback(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setStats(FALLBACK);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const csv = stats.csv ?? {};
  const data3 = stats.data3 ?? {};
  const def = stats.synthese_def ?? {};

  const csvPct = csv.pourcentage_nettoye ??
    (csv.lignes_initiales && csv.lignes_finales
      ? Math.round(((csv.lignes_initiales - csv.lignes_finales) / csv.lignes_initiales) * 100)
      : 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nettoyage des données</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statistiques des pipelines de pré-traitement appliqués aux datasets sources.
          </p>
        </div>
        <Button onClick={fetchStats} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          API indisponible ({error}) — affichage des valeurs de référence.
        </div>
      )}
      {!error && usingFallback && !loading && (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Valeurs de référence affichées.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CSV */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">CSV brut</CardTitle>
              <p className="text-xs text-muted-foreground">Capteurs / mesures</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Initial</div>
                    <div className="font-semibold tabular-nums">{formatNumber(csv.lignes_initiales)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Après nettoyage</div>
                    <div className="font-semibold tabular-nums">{formatNumber(csv.lignes_finales)}</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Lignes nettoyées</span>
                    <span className="font-medium">{csvPct}%</span>
                  </div>
                  <Progress value={csvPct} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* DATA3 */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="w-10 h-10 rounded-md bg-accent/10 text-accent-foreground flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">DATA3</CardTitle>
              <p className="text-xs text-muted-foreground">Dataset agrégé</p>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Lignes</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(data3.lignes)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Colonnes</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(data3.colonnes)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Synthèse DEF */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="w-10 h-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Synthèse DEF</CardTitle>
              <p className="text-xs text-muted-foreground">Dataset final</p>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Lignes</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(def.lignes)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Colonnes</div>
                  <div className="text-2xl font-semibold tabular-nums">{formatNumber(def.colonnes)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
