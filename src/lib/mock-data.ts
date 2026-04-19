// Mock industrial telemetry data for the demo.

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
      temperature: 78 + Math.sin(i / 3) * 4 + (Math.random() - 0.5) * 2,
      pressure: 4.2 + Math.cos(i / 4) * 0.3 + (Math.random() - 0.5) * 0.15,
      flow: 320 + Math.sin(i / 2) * 18 + (Math.random() - 0.5) * 10,
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
    timestamp: "2025-04-19 14:32",
    severity: "critical",
    unit: "Reactor R-204",
    variable: "Temperature",
    message: "Temperature exceeded upper threshold (95 °C).",
    value: "98.4 °C",
    status: "open",
  },
  {
    id: "ALR-2040",
    timestamp: "2025-04-19 14:18",
    severity: "warning",
    unit: "Pump P-12",
    variable: "Vibration",
    message: "Vibration trending upward — possible bearing wear.",
    value: "6.1 mm/s",
    status: "open",
  },
  {
    id: "ALR-2039",
    timestamp: "2025-04-19 13:55",
    severity: "warning",
    unit: "Dryer D-3",
    variable: "Flow",
    message: "Flow drop detected on inlet.",
    value: "284 m³/h",
    status: "ack",
  },
  {
    id: "ALR-2038",
    timestamp: "2025-04-19 13:12",
    severity: "info",
    unit: "Compressor C-7",
    variable: "Pressure",
    message: "Minor pressure oscillation within tolerance.",
    value: "4.5 bar",
    status: "resolved",
  },
  {
    id: "ALR-2037",
    timestamp: "2025-04-19 12:40",
    severity: "critical",
    unit: "Filter F-9",
    variable: "Differential pressure",
    message: "ΔP rising sharply — filter clogging predicted in 2h.",
    value: "1.8 bar",
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
    title: "Reduce reactor R-204 setpoint by 4 °C",
    detail: "Lower thermal load to bring temperature back inside safe band within 8 minutes.",
    confidence: 0.92,
    impact: "Prevents emergency shutdown, est. saving 14k MAD",
    unit: "Reactor R-204",
    reasoning: [
      "Inlet temperature trending +0.8 °C/min over last 12 min",
      "Cooling water flow at 92% capacity, no further headroom",
      "Historical analog: incident #2024-08-11 resolved with same action",
    ],
    status: "pending",
  },
  {
    id: "REC-511",
    alertId: "ALR-2037",
    title: "Schedule cleaning cycle for Filter F-9",
    detail: "Trigger CIP sequence within next maintenance window (22:00).",
    confidence: 0.84,
    impact: "Avoids unplanned downtime (~3.5h)",
    unit: "Filter F-9",
    reasoning: [
      "ΔP increased 38% in last 24h",
      "Particulate load above seasonal baseline",
    ],
    status: "pending",
  },
  {
    id: "REC-510",
    alertId: "ALR-2040",
    title: "Inspect bearing on Pump P-12",
    detail: "Plan visual + ultrasound inspection during next shift change.",
    confidence: 0.71,
    impact: "Early detection avoids catastrophic failure",
    unit: "Pump P-12",
    reasoning: [
      "Vibration rising at 0.4 mm/s per day",
      "Similar pattern preceded P-08 failure in 2024",
    ],
    status: "pending",
  },
];

export const FEATURE_IMPORTANCE = [
  { feature: "Inlet temperature", value: 0.34 },
  { feature: "Cooling water flow", value: 0.22 },
  { feature: "Catalyst age", value: 0.16 },
  { feature: "Ambient humidity", value: 0.11 },
  { feature: "Feed concentration", value: 0.09 },
  { feature: "Agitator RPM", value: 0.08 },
];

export const MODEL_METRICS = [
  { name: "Anomaly detector v3.2", auc: 0.94, latency: "42 ms", drift: 0.06, status: "healthy" },
  { name: "Predictive maintenance v2.1", auc: 0.89, latency: "61 ms", drift: 0.18, status: "watch" },
  { name: "Quality forecast v1.4", auc: 0.81, latency: "38 ms", drift: 0.31, status: "drift" },
];

export const PIPELINE_STATUS = [
  { name: "Kafka ingestion", status: "ok", throughput: "12.4k msg/s", latency: "8 ms" },
  { name: "Feature store sync", status: "ok", throughput: "—", latency: "120 ms" },
  { name: "Inference orchestrator", status: "ok", throughput: "850 req/s", latency: "44 ms" },
  { name: "Model retraining (nightly)", status: "warning", throughput: "—", latency: "next: 02:00" },
  { name: "Alert dispatcher", status: "ok", throughput: "—", latency: "12 ms" },
];

export const SYSTEM_LOGS = [
  { ts: "14:33:04", level: "INFO", msg: "Inference batch processed: 1284 events" },
  { ts: "14:32:51", level: "WARN", msg: "Anomaly detector confidence below 0.6 on R-204 stream" },
  { ts: "14:32:12", level: "INFO", msg: "Recommendation REC-512 generated for ALR-2041" },
  { ts: "14:30:08", level: "INFO", msg: "Drift monitor: feature 'inlet_temp' KS=0.06" },
  { ts: "14:28:44", level: "ERROR", msg: "Retry: connection to OPC-UA server timed out (recovered)" },
  { ts: "14:25:01", level: "INFO", msg: "Health check passed for all 14 services" },
];
