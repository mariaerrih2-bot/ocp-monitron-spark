import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/app/explain")({
  head: () => ({ meta: [{ title: "Explication IA — OCP AI Monitor" }] }),
  component: ExplainPage,
});

function ExplainPage() {
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("last_analysis");
    if (saved) setLastAnalysis(JSON.parse(saved));
  }, []);

  const shapData = [
    { feature: "Gradient température réacteur", value: 0.58, impact: "negatif", icone: "🌡️", explication: "La montée rapide de température dans le réacteur est le facteur principal de risque de non-conformité.", conseil: "Réduire l'alimentation de 6% et augmenter le point de consigne du refroidisseur à 92°C." },
    { feature: "Retard débit H3PO4", value: 0.41, impact: "negatif", icone: "🔄", explication: "Le débit acide réagit trop lentement aux corrections, amplifiant la sensibilité à l'exotherme.", conseil: "Vérifier la vanne FC-12 et réduire le temps de réponse du régulateur PID." },
    { feature: "Activité catalytique", value: -0.29, impact: "positif", icone: "⚗️", explication: "L'activité catalytique contribue positivement à la stabilité de la réaction et à la qualité P2O5.", conseil: "Maintenir l'activité catalytique au-dessus du seuil nominal." },
    { feature: "Composition alimentation C2/C3", value: 0.22, impact: "negatif", icone: "🧪", explication: "La composition actuelle de l'alimentation dégrade légèrement le rendement de conversion.", conseil: "Ajuster le ratio C2/C3 vers la valeur cible de 0.95." },
    { feature: "Ratio recyclage bouillie", value: -0.18, impact: "positif", icone: "⚖️", explication: "Le ratio de recyclage actuel est favorable et contribue à stabiliser la granulométrie.", conseil: "Maintenir entre 3.0 et 4.5." },
    { feature: "Humidité ambiante", value: 0.09, impact: "negatif", icone: "💧", explication: "L'humidité ambiante élevée contribue marginalement à la dégradation de la qualité du produit fini.", conseil: "Vérifier la ventilation du sécheur — maintenir l'humidité produit sous 5%." },
  ];

  const chartData = shapData.map(d => ({ name: d.feature.length > 22 ? d.feature.substring(0, 22) + "…" : d.feature, valeur: d.value, impact: d.impact }));

  const predictionP2O5 = lastAnalysis?.p2o5 ?? 44.31;
  const confiance = lastAnalysis?.confiance ?? 0.87;
  const statut = lastAnalysis?.statut ?? (predictionP2O5 >= 44 ? "conforme" : "non-conforme");

  const resumePoints = [
    "La température du réacteur monte plus vite que la normale.",
    "Le débit de refroidissement sur la boucle FC-12 réagit trop lentement.",
    "L'activité catalytique perd progressivement en efficacité depuis 09h30.",
    "Sans correction, le risque de non-conformité dépasse le seuil de sécurité dans 18 minutes.",
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explication IA — Ligne 107 DEF</h1>
        <p className="text-gray-500 mt-1">Pourquoi le modèle a prédit ce résultat ? Explications pour opérateurs</p>
      </div>

      {/* Prédiction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`p-5 rounded-xl border-2 ${statut === "conforme" ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Prédiction</p>
          <p className="text-sm text-gray-600 mb-2">Risque de non-conformité P2O5 — Ligne 107</p>
          <p className={`text-5xl font-bold mb-2 ${statut === "conforme" ? "text-green-600" : "text-red-600"}`}>
            {(confiance * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">Indice de confiance</p>
          <div className="flex gap-2 mt-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statut !== "conforme" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
              {statut !== "conforme" ? "⚠️ ACTION RECOMMANDÉE" : "✅ CONFORME"}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
              MODÈLE V3.2.1
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cause principale (résumé IA)</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Le modèle attribue le risque principalement à un <strong>gradient de température de 2.4°C/min</strong> dans le réacteur, combiné à un <strong>retard de débit de 7.8%</strong> sur la boucle FC-12. L'activité catalytique est en déclin depuis 3 heures, amplifiant la sensibilité à l'exotherme.
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Action recommandée : <strong>réduire l'alimentation de 6%</strong> et augmenter le point de consigne du refroidisseur à <strong>92°C</strong> jusqu'à stabilisation du gradient thermique.
          </p>
        </div>
      </div>

      {/* Graphique SHAP horizontal */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-1">Importance des variables (SHAP)</h2>
        <p className="text-xs text-gray-500 mb-4">Contribution de chaque variable à la prédiction</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" domain={[-0.4, 0.7]} fontSize={11} tick={{ fill: "#9ca3af" }} />
            <YAxis type="category" dataKey="name" width={180} fontSize={11} tick={{ fill: "#374151" }} />
            <Tooltip
              formatter={(value: any) => [value.toFixed(2), "Contribution SHAP"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="valeur" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.impact === "positif" ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Pousse vers le risque</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Pousse vers la sécurité</span>
        </div>
      </div>

      {/* Détails par variable */}
      <div className="space-y-3">
        {shapData.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{item.icone}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{item.feature}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.impact === "positif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.impact === "positif" ? "↑ Améliore la qualité" : "↓ Réduit la qualité"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.explication}</p>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                  <span className="text-yellow-600 text-sm">💡</span>
                  <p className="text-xs text-yellow-800 font-medium">Conseil : {item.conseil}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé en langage simple */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3">Résumé en langage simple</h2>
        <ul className="space-y-2">
          {resumePoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}