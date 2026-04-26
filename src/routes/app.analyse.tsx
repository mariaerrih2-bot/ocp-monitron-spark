import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/analyse")({
  component: AnalysePage,
});

interface ResultRow {
  ligne: number;
  prediction: string;
  confiance: number; // 0-100
  statut: "conforme" | "alerte";
}

const API_URL = "http://localhost:5000/predict_stream";
const ACCEPTED = ".xlsx,.xls,.xlsm,.csv";

function AnalysePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [analysing, setAnalysing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const [resultats, setResultats] = useState<ResultRow[]>([]);
  const [nbConformes, setNbConformes] = useState(0);
  const [nbAlertes, setNbAlertes] = useState(0);
  const [done, setDone] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const totalLignes = nbConformes + nbAlertes;
  const tauxConformite =
    totalLignes > 0 ? Math.round((nbConformes / totalLignes) * 100) : 0;

  const resetResults = () => {
    setResultats([]);
    setNbConformes(0);
    setNbAlertes(0);
    setProgress(0);
    setProgressLabel("");
    setDone(false);
    setError(null);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    resetResults();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleAnalyse = async () => {
    if (!file) return;
    resetResults();
    setAnalysing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";

        for (const raw of parts) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.replace(/^data:\s*/, "");
          if (!payload) continue;

          try {
            const json = JSON.parse(payload);

            if (json.type === "progress") {
              setProgress(Number(json.pct) || 0);
              setProgressLabel(
                `Analyse ligne ${json.ligne} sur ${json.total}`,
              );
            } else if (json.type === "result") {
              const row: ResultRow = {
                ligne: json.ligne,
                prediction: String(json.prediction ?? "—"),
                confiance: Number(json.confiance) || 0,
                statut: json.statut === "conforme" ? "conforme" : "alerte",
              };
              setResultats((prev) => [...prev, row]);
              if (row.statut === "conforme") {
                setNbConformes((p) => p + 1);
              } else {
                setNbAlertes((p) => p + 1);
              }
            } else if (json.type === "done") {
              setAnalysing(false);
              setProgress(100);
              setDone(true);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }

      setAnalysing(false);
      setDone(true);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setAnalysing(false);
      setError(
        "Impossible de contacter l'API. Vérifiez que le serveur Python est lancé sur http://localhost:5000",
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Analyse Qualité TSP"
        subtitle="Prédiction par intelligence artificielle"
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/10 text-info border border-info/30 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            IA Active
          </span>
        }
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`bg-card border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-info bg-info/5"
            : "border-info/40 hover:border-info hover:bg-info/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-info/10 text-info flex items-center justify-center">
            <UploadCloud className="w-7 h-7" />
          </div>

          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-info" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">
                · {(file.size / 1024).toFixed(1)} Ko
              </span>
            </div>
          ) : (
            <>
              <div className="text-base font-medium">
                Déposez votre fichier Excel ici
              </div>
              <div className="text-xs text-muted-foreground">
                Formats acceptés : .xlsx .xls .xlsm .csv
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="mt-4">
        <Button
          onClick={handleAnalyse}
          disabled={!file || analysing}
          className="w-full h-11 text-sm"
        >
          {analysing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              Analyser avec l'IA
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      {analysing && (
        <div className="mt-6 bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">
              {progressLabel || "Préparation..."}
            </span>
            <span className="font-medium tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-success/15">
            <div
              className="absolute inset-y-0 left-0 bg-success transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 bg-destructive/5 border border-destructive/30 text-destructive rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-medium mb-1">Erreur de connexion</div>
            <div className="text-destructive/90">{error}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyse}
            disabled={!file}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </Button>
        </div>
      )}

      {/* Stats cards */}
      {(done || resultats.length > 0) && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            tone="success"
            label="Lignes conformes"
            value={nbConformes}
          />
          <StatCard tone="danger" label="Alertes" value={nbAlertes} />
          <StatCard
            tone="info"
            label="Taux de conformité"
            value={`${tauxConformite}%`}
          />
        </div>
      )}

      {/* Results table */}
      {resultats.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Résultats en streaming</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {resultats.length} ligne{resultats.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Ligne</th>
                  <th className="text-left px-4 py-2 font-medium">Prédiction</th>
                  <th className="text-left px-4 py-2 font-medium w-48">
                    Confiance
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((r, idx) => (
                  <tr
                    key={`${r.ligne}-${idx}`}
                    className="border-t border-border ocp-row-fade"
                  >
                    <td className="px-4 py-2 tabular-nums text-muted-foreground">
                      #{r.ligne}
                    </td>
                    <td className="px-4 py-2 font-medium">{r.prediction}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${
                              r.statut === "conforme"
                                ? "bg-success"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, r.confiance))}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums w-10 text-right">
                          {Math.round(r.confiance)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {r.statut === "conforme" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Conforme
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Alerte
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "success" | "danger" | "info";
}) {
  const styles = {
    success: "bg-success/10 border-success/30 text-success",
    danger: "bg-destructive/10 border-destructive/30 text-destructive",
    info: "bg-info/10 border-info/30 text-info",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
