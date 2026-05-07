// Données industrielles TSP — OCP Group
// Remplace les données de démonstration génériques par les vraies variables process TSP
 
export interface TelemetryPoint {
  time: string;
  temperature: number;
  pressure: number;
  flow: number;
}
 
export function generateTelemetry(points = 24): TelemetryPoint[] {
  const out: TelemetryPoint[] = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 5 * 60 * 1000);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    out.push({
      time: `${hh}:${mm}`,
      // Température réacteur TSP : nominale 90°C
      temperature: 90 + Math.sin(i / 3) * 4 + (Math.random() - 0.5) * 2,
      // Pression filtre : nominale 3.5 bar
      pressure: 3.5 + Math.cos(i / 4) * 0.3 + (Math.random() - 0.5) * 0.15,
      // Débit acide H3PO4 : nominal 16 m³/h
      flow: 16 + Math.sin(i / 2) * 2 + (Math.random() - 0.5) * 1,
    });
  }
  return out;
}
 
export type Severity = "critical" | "warning" | "info";
 
export interface Alert {
  id: string;
  timestamp: string;
  severity: Severity;
  unit: string;
  variable: string;
  message: string;
  value: string;
  status: "open" | "ack" | "resolved";
}
 
export const MOCK_ALERTS: Alert[] = [
  {
    id: "ALR-2041",
    timestamp: "2026-05-07 10:32",
    severity: "critical",
    unit: "Réacteur TSP R-01",
    variable: "Température réacteur",
    message: "Température réacteur dépasse le seuil supérieur (105 °C). Risque de décomposition acide.",
    value: "107.2 °C",
    status: "open",
  },
  {
    id: "ALR-2040",
    timestamp: "2026-05-07 10:18",
    severity: "warning",
    unit: "Sécheur tambour D-01",
    variable: "Humidité produit",
    message: "Humidité produit TSP en hausse — risque de prise en masse au stockage.",
    value: "6.8 %",
    status: "open",
  },
  {
    id: "ALR-2039",
    timestamp: "2026-05-07 09:55",
    severity: "warning",
    unit: "Alimentation acide",
    variable: "Débit acide H3PO4",
    message: "Chute de débit acide détectée — ratio acide/phosphate insuffisant.",
    value: "7.2 m³/h",
    status: "ack",
  },
  {
    id: "ALR-2038",
    timestamp: "2026-05-07 09:12",
    severity: "info",
    unit: "Granulateur G-01",
    variable: "Granulométrie D50",
    message: "Légère variation granulométrie dans les tolérances.",
    value: "3.1 mm",
    status: "resolved",
  },
  {
    id: "ALR-2037",
    timestamp: "2026-05-07 08:40",
    severity: "critical",
    unit: "Filtre presse F-01",
    variable: "Pression différentielle",
    message: "ΔP en hausse rapide — colmatage filtre prédit dans 2h.",
    value: "5.8 bar",
    status: "open",
  },
];
 
export interface Recommendation {
  id: string;
  alertId: string;
  title: string;
  detail: string;
  confidence: number;
  impact: string;
  unit: string;
  reasoning: string[];
  status: "pending" | "applied" | "rejected";
}
 
export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "REC-512",
    alertId: "ALR-2041",
    title: "Réduire la consigne réacteur R-01 de 4 °C",
    detail: "Diminuer la charge thermique pour ramener la température dans la plage nominale (85-95 °C) en 8 minutes.",
    confidence: 0.92,
    impact: "Prévient un arrêt d'urgence, économie estimée : 14k MAD",
    unit: "Réacteur TSP R-01",
    reasoning: [
      "Température réacteur en hausse de +0.8 °C/min sur les 12 dernières minutes",
      "Débit eau de refroidissement à 92% de capacité — pas de marge supplémentaire",
      "Analogue historique : incident #2024-08-11 résolu avec la même action",
    ],
    status: "pending",
  },
  {
    id: "REC-511",
    alertId: "ALR-2037",
    title: "Programmer un cycle de nettoyage filtre presse F-01",
    detail: "Déclencher la séquence CIP lors de la prochaine fenêtre de maintenance (22h00).",
    confidence: 0.84,
    impact: "Évite un arrêt non planifié (~3.5h de production)",
    unit: "Filtre presse F-01",
    reasoning: [
      "ΔP augmenté de 38% en 24h",
      "Charge en solides supérieure à la baseline saisonnière",
    ],
    status: "pending",
  },
  {
    id: "REC-510",
    alertId: "ALR-2039",
    title: "Vérifier la vanne de régulation débit acide VA-12",
    detail: "Planifier une inspection visuelle + contrôle actionneur lors du prochain changement d'équipe.",
    confidence: 0.71,
    impact: "Détection précoce évite une non-conformité P2O5 sur lot en cours",
    unit: "Alimentation acide H3PO4",
    reasoning: [
      "Débit acide en baisse progressive de 0.4 m³/h par heure",
      "Ratio acide/phosphate descend sous 0.85 — seuil alarme OCP",
    ],
    status: "pending",
  },
];
 
// Importance des features pour la prédiction P2O5 — vraies variables TSP
export const FEATURE_IMPORTANCE = [
  { feature: "Température réacteur", value: 0.34 },
  { feature: "Ratio acide / phosphate", value: 0.28 },
  { feature: "Humidité produit", value: 0.16 },
  { feature: "Débit acide H3PO4", value: 0.11 },
  { feature: "Concentration H3PO4", value: 0.07 },
  { feature: "Granulométrie D50", value: 0.04 },
];
 
// Métriques modèles ML — TSP OCP
export const MODEL_METRICS = [
  { name: "Prédiction qualité P2O5 (GBM v2.0)", auc: 0.94, latency: "3 ms", drift: 0.06, status: "healthy" },
  { name: "Détection dérive ADWIN/KS v1.2", auc: 0.89, latency: "8 ms", drift: 0.12, status: "watch" },
  { name: "Optimisation Optuna TPE v1.0", auc: 0.87, latency: "850 ms", drift: 0.09, status: "healthy" },
];
 
// Statut pipeline données TSP
export const PIPELINE_STATUS = [
  { name: "Ingestion données PI System", status: "ok", throughput: "1.2k pts/min", latency: "12 ms" },
  { name: "Nettoyage & feature engineering", status: "ok", throughput: "—", latency: "45 ms" },
  { name: "Inférence modèle GBM", status: "ok", throughput: "200 req/s", latency: "3 ms" },
  { name: "Détection dérive (nightly)", status: "warning", throughput: "—", latency: "prochain : 02:00" },
  { name: "Dispatcher alertes opérateurs", status: "ok", throughput: "—", latency: "8 ms" },
];
 
// Logs système TSP
export const SYSTEM_LOGS = [
  { ts: "10:33:04", level: "INFO", msg: "Prédiction P2O5 : 45.8% — Statut : NORMAL" },
  { ts: "10:32:51", level: "WARN", msg: "Détecteur dérive : variable 'temperature_reaction' KS=0.07" },
  { ts: "10:32:12", level: "INFO", msg: "Recommandation REC-512 générée pour ALR-2041" },
  { ts: "10:30:08", level: "INFO", msg: "Optimisation Optuna : score qualité 94.2/100 — conforme OCP" },
  { ts: "10:28:44", level: "ERROR", msg: "Retry : connexion PI Server timeout (récupérée)" },
  { ts: "10:25:01", level: "INFO", msg: "Health check OK — 5 services opérationnels" },
];
 
// Seuils qualité produit TSP OCP Khouribga
export const QUALITY_THRESHOLDS = {
  p2o5_total:       { min: 44.0, max: 48.0, nominal: 46.0, unit: "%" },
  p2o5_assimilable: { min: 41.0, max: 46.0, nominal: 43.5, unit: "%" },
  taux_conversion:  { min: 88.0, max: 100.0, nominal: 94.0, unit: "%" },
  so4_residuel:     { min: 0.5,  max: 3.0,  nominal: 1.5,  unit: "%" },
  fluorures:        { min: 0.3,  max: 2.0,  nominal: 1.0,  unit: "%" },
  humidite:         { min: 1.5,  max: 5.0,  nominal: 4.0,  unit: "%" },
};