// Store partagé — résultats pipeline disponibles pour tous les rôles

export interface PipelineResult {
  fichier: string;
  timestamp: string;
  lignes: number;
  colonnes: number;
  headers: string[];
  apercu: Record<string, string>[];
  p2o5: number;
  statut: "conforme" | "non-conforme";
  confiance: number;
  alertes: { type: string; message: string }[];
  stats: { col: string; type: string; mean: number | null; min: number | null; max: number | null }[];
}

export function saveResult(result: PipelineResult) {
  localStorage.setItem("pipeline_result", JSON.stringify(result));
  localStorage.setItem("last_analysis", JSON.stringify({
    p2o5: result.p2o5,
    statut: result.statut,
    confiance: result.confiance,
    timestamp: result.timestamp,
  }));
  if (result.statut === "non-conforme") {
    const alertes = JSON.parse(localStorage.getItem("alertes_actives") || "[]");
    alertes.unshift({ id: Date.now(), fichier: result.fichier, p2o5: result.p2o5, timestamp: result.timestamp });
    localStorage.setItem("alertes_actives", JSON.stringify(alertes.slice(0, 10)));
  }
  window.dispatchEvent(new CustomEvent("pipeline_updated"));
}

export function getResult(): PipelineResult | null {
  const saved = localStorage.getItem("pipeline_result");
  return saved ? JSON.parse(saved) : null;
}