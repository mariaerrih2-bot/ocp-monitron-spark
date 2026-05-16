import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/explain")({
  head: () => ({ meta: [{ title: "AI Explanation — OCP AI Monitor" }] }),
  component: ExplainPage,
});

function ExplainPage() {
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("last_analysis");
    if (saved) setLastAnalysis(JSON.parse(saved));
  }, []);

  const shapData = [
    { feature: "Temperature reaction", value: 32, impact: "positif", explication: "La temperature elevee favorise la reaction chimique et ameliore la qualite P2O5", icone: "🌡️", conseil: "Maintenir entre 90-100°C" },
    { feature: "Ratio acide/phosphate", value: 28, impact: "positif", explication: "Un bon ratio assure une conversion complete du phosphate en P2O5 assimilable", icone: "⚗️", conseil: "Maintenir entre 0.85-1.05" },
    { feature: "Humidite produit", value: 16, impact: "negatif", explication: "Une humidite elevee reduit la concentration P2O5 et cause des problemes de stockage", icone: "💧", conseil: "Maintenir sous 5%" },
    { feature: "Debit acide H3PO4", value: 11, impact: "positif", explication: "Un debit optimal garantit une alimentation constante du reacteur", icone: "🔄", conseil: "Maintenir entre 8-25 m3/h" },
    { feature: "Concentration H3PO4", value: 7, impact: "positif", explication: "Une concentration elevee ameliore le rendement de la reaction", icone: "🧪", conseil: "Maintenir entre 40-54% P2O5" },
    { feature: "Granulometrie D50", value: 4, impact: "neutre", explication: "La taille des granules influe sur la surface de contact et la vitesse de reaction", icone: "⚖️", conseil: "Maintenir entre 2-5 mm" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explication IA — Ligne 107 DEF</h1>
        <p className="text-gray-500 mt-2">Pourquoi le modele a predit ce resultat ? Explications pour operateurs</p>
      </div>

      {lastAnalysis && (
        <div className={"mb-6 p-5 rounded-xl border " + (lastAnalysis.statut === "conforme" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{lastAnalysis.statut === "conforme" ? "✅" : "⚠️"}</span>
            <div>
              <h2 className="font-bold text-lg">Derniere prediction : P2O5 = {lastAnalysis.p2o5.toFixed(2)}%</h2>
              <p className="text-sm">Statut : {lastAnalysis.statut.toUpperCase()} — Confiance : {(lastAnalysis.confiance * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <h2 className="font-bold text-blue-900 mb-2">📊 Comment lire ce tableau ?</h2>
        <p className="text-sm text-blue-800">Chaque variable ci-dessous a contribue a la prediction. Plus la barre est longue, plus cette variable a eu d influence. Vert = ameliore la qualite, Rouge = reduit la qualite.</p>
      </div>

      <div className="space-y-4 mb-8">
        {shapData.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="text-2xl">{item.icone}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">{item.feature}</h3>
                  <span className={"text-xs px-2 py-1 rounded-full font-medium " + (item.impact === "positif" ? "bg-green-100 text-green-700" : item.impact === "negatif" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700")}>
                    {item.impact === "positif" ? "↑ Ameliore la qualite" : item.impact === "negatif" ? "↓ Reduit la qualite" : "→ Effet neutre"}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                  <div className={"h-3 rounded-full " + (item.impact === "positif" ? "bg-green-500" : item.impact === "negatif" ? "bg-red-500" : "bg-gray-400")} style={{width: item.value + "%"}}></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.explication}</p>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="text-yellow-600">💡</span>
                  <p className="text-xs text-yellow-800 font-medium">Conseil : {item.conseil}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-3">🎯 Conclusion pour l operateur</h2>
        <p className="text-sm text-gray-700">Le facteur le plus important est la <strong>temperature de reaction</strong> (32%), suivie du <strong>ratio acide/phosphate</strong> (28%). Concentrez-vous sur ces deux parametres pour ameliorer la qualite TSP.</p>
      </div>
    </div>
  );
}
