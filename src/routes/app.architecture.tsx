import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/architecture")({
  head: () => ({ meta: [{ title: "Architecture — OCP AI Monitor" }] }),
  component: ArchitecturePage,
});

const noeuds = [
  [
    { icon: "🗄️", titre: "Sources de données", desc: "PLC · DCS · IoT · LIMS" },
    { icon: "⚙️", titre: "Data Pipeline", desc: "Kafka · streaming ETL" },
    { icon: "⏱️", titre: "Alignement temporel", desc: "Window join · resampling" },
    { icon: "📦", titre: "Feature Store", desc: "Online + offline parité" },
  ],
  [
    { icon: "🤖", titre: "Entraînement modèle", desc: "Hors ligne · clusters GPU" },
    { icon: "📋", titre: "Registre modèles", desc: "Versioning · staging" },
    { icon: "⚡", titre: "Stream Processing", desc: "Features en ligne" },
    { icon: "🧠", titre: "Moteur d'inférence", desc: "Prédictions temps réel" },
  ],
  [
    { icon: "🎯", titre: "Moteur de décision", desc: "Politiques · garde-fous sécurité" },
    { icon: "🔌", titre: "Backend API", desc: "REST · WebSocket" },
    { icon: "🖥️", titre: "Interface utilisateur", desc: "Dashboards par rôle" },
    { icon: "💬", titre: "Boucle de retour", desc: "Décisions opérateur" },
  ],
  [
    { icon: "📊", titre: "Observabilité", desc: "Métriques · dérive · audit" },
    { icon: "🔄", titre: "Orchestrateur", desc: "Plannings · DAGs" },
    { icon: "🛡️", titre: "Stratégie de repli", desc: "Règles si IA faible conf." },
  ],
];

function ArchitecturePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Architecture</h1>
        <p className="text-sm text-gray-500 mt-1">Ligne 107 DEF · Vue système complète</p>
      </div>

      {/* Bandeau */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏗️</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Vue Architecture</p>
            <p className="text-xs text-gray-400">Données → Traitement → IA → Décision → Retour</p>
          </div>
        </div>
        <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          ℹ️ Cette interface reflète l'architecture système sous-jacente
        </span>
      </div>

      {/* Flux end-to-end */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">Flux bout en bout</h2>
        <p className="text-xs text-gray-400 mb-5">Des signaux capteurs bruts aux décisions en boucle fermée, avec gouvernance et repli.</p>

        <div className="space-y-4">
          {noeuds.map((ligne, li) => (
            <div key={li} className="flex items-center gap-2 flex-wrap">
              {ligne.map((noeud, ni) => (
                <div key={ni} className="flex items-center gap-2">
                  <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 min-w-44 transition-all hover:shadow-md cursor-default ${
                    li === 1 && (ni === 2 || ni === 3) ? "border-green-300 bg-green-50" :
                    li === 2 && ni === 0 ? "border-green-300 bg-green-50" :
                    "border-gray-200 bg-white"
                  }`}>
                    <span className="text-xl shrink-0">{noeud.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{noeud.titre}</p>
                      <p className="text-xs text-gray-400">{noeud.desc}</p>
                    </div>
                  </div>
                  {ni < ligne.length - 1 && <span className="text-gray-300 text-lg shrink-0">→</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Composants clés */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">🔵 Couche données</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />Capteurs PI OPC-UA (temps réel)</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />LIMS laboratoire (P2O5 mesuré)</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />Kafka streaming ETL</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />Feature Store 142 variables</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">🟢 Couche IA</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />GBM prédiction P2O5 (R²=0.931)</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />ADWIN détection dérive</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />Optuna optimisation hyperparamètres</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />SHAP explicabilité variables</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">🟠 Couche décision</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Recommandations avec confiance</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Validation ingénieur requise</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Alertes temps réel opérateur</li>
            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Piste d'audit complète</li>
          </ul>
        </div>
      </div>

      {/* Stack technique */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Stack technique</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { cat: "Frontend", items: ["React + TanStack", "Cloudflare Workers", "Tailwind CSS"] },
            { cat: "Backend", items: ["FastAPI Python", "Railway.app", "REST + WebSocket"] },
            { cat: "ML", items: ["GBM (scikit-learn)", "SHAP", "Optuna + ADWIN"] },
            { cat: "Infra", items: ["GitHub CI/CD", "Wrangler deploy", "Feature Store local"] },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">{s.cat}</p>
              <ul className="space-y-1">
                {s.items.map((item, j) => (
                  <li key={j} className="text-xs text-gray-700 flex items-center gap-1">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}