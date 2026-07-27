import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/configuration")({
  head: () => ({ meta: [{ title: "Configuration système — OCP AI Monitor" }] }),
  component: ConfigurationPage,
});

function Field({ label, value, unit, onChange }: { label: string; value: string | number; unit?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-32 text-sm text-right border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400 font-mono"
        />
        {unit && <span className="text-xs text-gray-400 w-10">{unit}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative ${value ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

function ConfigurationPage() {
  const [saved, setSaved] = useState(false);

  // ETL & Pipelines
  const [intervalPipeline, setIntervalPipeline] = useState("5");
  const [retention, setRetention] = useState("90");
  const [apiTimeout, setApiTimeout] = useState("30");
  const [batchSize, setBatchSize] = useState("512");
  const [seuilPSI, setSeuilPSI] = useState("0.15");
  const [autoFallback, setAutoFallback] = useState(true);
  const [freqRetrain, setFreqRetrain] = useState("weekly");

  // Moteur IA
  const [seuilConfiance, setSeuilConfiance] = useState("0.82");
  const [seuilDrift, setSeuilDrift] = useState("0.20");
  const [modeleChampion, setModeleChampion] = useState("tsp-optim-v3");
  const [freqInference, setFreqInference] = useState("30");
  const [politiqueRetrain, setPolitiqueRetrain] = useState("drift-trigger");
  const [confianceMin, setConfianceMin] = useState("0.75");

  // Sécurité & Audit
  const [jwtExpiration, setJwtExpiration] = useState("8");
  const [maxConnexions, setMaxConnexions] = useState("5");
  const [chiffrement, setChiffrement] = useState("AES-256");
  const [retentionLogs, setRetentionLogs] = useState("365");
  const [auth2fa, setAuth2fa] = useState(true);
  const [validationRoles, setValidationRoles] = useState(true);

  // Infrastructure
  const [limitesCPU, setLimitesCPU] = useState("8");
  const [ram, setRam] = useState("32");
  const [retentionKafka, setRetentionKafka] = useState("72");
  const [refreshMonitoring, setRefreshMonitoring] = useState("10");
  const [apiGatewayTimeout, setApiGatewayTimeout] = useState("15");
  const [seuilEscalade, setSeuilEscalade] = useState("3");

  const handleApply = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration système</h1>
        <p className="text-sm text-gray-500 mt-1">Paramètres globaux de la plateforme IA industrielle</p>
      </div>

      {/* Bandeau MLOps */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">⚡</div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">MLOps Control Plane · <span className="text-green-600">Synchronisé</span></p>
            <p className="text-xs text-gray-400">Connecté aux pipelines ETL, à l'inference engine, au drift monitor et à la couche streaming Kafka.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
            🔄 Rollback
          </button>
          <button className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
            ✓ Valider
          </button>
          <button className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
            💾 Enregistrer
          </button>
          <button
            onClick={handleApply}
            className="text-sm px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            ⚡ {saved ? "Appliqué ✓" : "Appliquer"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-green-700 text-sm font-medium">
          ✅ Configuration appliquée avec succès
        </div>
      )}

      {/* Sections en grille */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Section icon="🔗" title="ETL & Pipelines" subtitle="Ingestion streaming, batchs et orchestration">
          <Field label="Intervalle pipeline" value={intervalPipeline} unit="min" onChange={setIntervalPipeline} />
          <Field label="Rétention des données" value={retention} unit="days" onChange={setRetention} />
          <Field label="API timeout" value={apiTimeout} unit="s" onChange={setApiTimeout} />
          <Field label="Batch size" value={batchSize} onChange={setBatchSize} />
          <Field label="Seuil recalibration PSI" value={seuilPSI} onChange={setSeuilPSI} />
          <Toggle label="Auto fallback mode" value={autoFallback} onChange={setAutoFallback} />
          <Field label="Fréquence retrain" value={freqRetrain} onChange={setFreqRetrain} />
        </Section>

        <Section icon="🧠" title="Moteur IA" subtitle="Inférence, drift et seuils de recommandation">
          <Field label="Seuil de confiance" value={seuilConfiance} onChange={setSeuilConfiance} />
          <Field label="Seuil d'alerte drift" value={seuilDrift} onChange={setSeuilDrift} />
          <Field label="Modèle champion actif" value={modeleChampion} onChange={setModeleChampion} />
          <Field label="Fréquence d'inférence" value={freqInference} unit="s" onChange={setFreqInference} />
          <Field label="Politique de retrain" value={politiqueRetrain} onChange={setPolitiqueRetrain} />
          <Field label="Confiance min. recommandation" value={confianceMin} onChange={setConfianceMin} />
        </Section>

        <Section icon="🛡️" title="Sécurité & Audit" subtitle="Authentification, chiffrement et conformité">
          <Field label="Expiration JWT" value={jwtExpiration} unit="hours" onChange={setJwtExpiration} />
          <Field label="Tentatives max. de connexion" value={maxConnexions} onChange={setMaxConnexions} />
          <Field label="Mode de chiffrement" value={chiffrement} onChange={setChiffrement} />
          <Field label="Rétention logs d'audit" value={retentionLogs} unit="days" onChange={setRetentionLogs} />
          <Toggle label="Authentification 2FA" value={auth2fa} onChange={setAuth2fa} />
          <Toggle label="Validation des rôles" value={validationRoles} onChange={setValidationRoles} />
        </Section>

        <Section icon="🖥️" title="Infrastructure" subtitle="Ressources, Kafka et seuils d'escalade">
          <Field label="Limites CPU" value={limitesCPU} unit="vCPU" onChange={setLimitesCPU} />
          <Field label="Allocation RAM" value={ram} unit="GB" onChange={setRam} />
          <Field label="Rétention Kafka" value={retentionKafka} unit="hours" onChange={setRetentionKafka} />
          <Field label="Refresh monitoring" value={refreshMonitoring} unit="s" onChange={setRefreshMonitoring} />
          <Field label="API gateway timeout" value={apiGatewayTimeout} unit="s" onChange={setApiGatewayTimeout} />
          <Field label="Seuil escalade alertes" value={seuilEscalade} onChange={setSeuilEscalade} />
        </Section>
      </div>
    </div>
  );
}