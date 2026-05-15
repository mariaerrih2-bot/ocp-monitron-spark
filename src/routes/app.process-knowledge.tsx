import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/process-knowledge")({
  component: ProcessKnowledgePage,
});

function ProcessKnowledgePage() {
  const etapes = [
    {
      id: 1,
      nom: "Réaction d'Acidulation",
      equipement: "Cuve d'attaque AM06",
      params: [
        { label: "Température réaction", valeur: "≥ 104 °C", statut: "critique" },
        { label: "Densité bouillie", valeur: "1680 – 1700 g/L", statut: "critique" },
        { label: "Acidité libre (AL) bouillie", valeur: "< 11.5 %", statut: "critique" },
        { label: "Rapport acidulation", valeur: "0.85 – 1.05", statut: "important" },
      ],
      description: "Réaction : Ca5(PO4)3F + 7H3PO4 → 5Ca(H2PO4)2 + HF",
      couleur: "blue",
    },
    {
      id: 2,
      nom: "Granulation",
      equipement: "Granulateur rotatif",
      params: [
        { label: "Ratio recyclage/bouillie", valeur: "3 – 4.5", statut: "critique" },
        { label: "AL sortie granulateur", valeur: "< 4 %", statut: "critique" },
        { label: "Granulométrie < 2mm", valeur: "< 4 %", statut: "important" },
        { label: "Granulométrie > 4mm", valeur: "< 5 %", statut: "important" },
      ],
      description: "Formation des granulés par agglomération de la bouillie avec les matières recyclées",
      couleur: "green",
    },
    {
      id: 3,
      nom: "Séchage",
      equipement: "Sécheur rotatif",
      params: [
        { label: "Température sortie sécheur", valeur: "90 – 95 °C", statut: "critique" },
        { label: "Humidité produit", valeur: "< 5 %", statut: "critique" },
        { label: "Température entrée gaz chauds", valeur: "350 – 600 °C", statut: "important" },
      ],
      description: "Réduction de l'humidité des granulés dans un tambour rotatif traversé par des gaz chauds",
      couleur: "orange",
    },
    {
      id: 4,
      nom: "Classification Granulométrique",
      equipement: "Cribles vibrants",
      params: [
        { label: "Fraction conforme", valeur: "2 – 4 mm", statut: "critique" },
        { label: "Fines (< 2mm)", valeur: "Recyclage granulateur", statut: "info" },
        { label: "Sur-granulés (> 4mm)", valeur: "Broyage + recyclage", statut: "info" },
      ],
      description: "Séparation granulométrique : produit conforme vers stockage, refus vers recyclage",
      couleur: "purple",
    },
  ];

  const specs = [
    { param: "P2O5 Total", standard: "≥ 44 %", premium: "≥ 45.5 %" },
    { param: "P2O5 Assimilable", standard: "≥ 41 %", premium: "≥ 43 %" },
    { param: "Taux de Conversion", standard: "≥ 90 %", premium: "≥ 93 %" },
    { param: "SO4 Résiduel", standard: "≤ 3 %", premium: "≤ 2 %" },
    { param: "Fluorures F", standard: "≤ 2 %", premium: "≤ 1.5 %" },
    { param: "Humidité", standard: "≤ 5 %", premium: "≤ 4 %" },
  ];

  const couleurs: Record<string, string> = {
    blue: "border-blue-500 bg-blue-50",
    green: "border-green-500 bg-green-50",
    orange: "border-orange-500 bg-orange-50",
    purple: "border-purple-500 bg-purple-50",
  };

  const statutCouleur: Record<string, string> = {
    critique: "bg-red-100 text-red-700",
    important: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Procédé TSP — Ligne 107 DEF</h1>
        <p className="text-gray-500 mt-2">Logique procédé TSP — OCP Khouribga</p>
      </div>

      <div className="mb-8 p-4 bg-gray-100 rounded-xl">
        <h2 className="font-semibold text-gray-700 mb-3">Schéma du Procédé</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {["Phosphate + H3PO4", "Réaction AM06", "Granulation", "Séchage", "Criblage", "Stockage TSP"].map((e, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">{e}</div>
              {i < arr.length - 1 && <span className="text-gray-400 font-bold">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800"><strong>Recyclage :</strong> Fines + Sur-granulés → Broyage → Retour Granulateur (ratio 3–4.5)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {etapes.map((etape) => (
          <div key={etape.id} className={`border-l-4 rounded-xl p-5 shadow-sm ${couleurs[etape.couleur]}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-gray-400">0{etape.id}</span>
              <div>
                <h3 className="font-bold text-gray-900">{etape.nom}</h3>
                <p className="text-xs text-gray-500">{etape.equipement}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 italic">{etape.description}</p>
            <div className="space-y-2">
              {etape.params.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                  <span className="text-sm text-gray-700">{p.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{p.valeur}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statutCouleur[p.statut]}`}>{p.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Spécifications Qualité TSP — OCP</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Paramètre</th>
                <th className="text-center px-4 py-3 text-blue-600 font-semibold">TSP Standard OCP</th>
                <th className="text-center px-4 py-3 text-green-600 font-semibold">TSP Premium Export</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.param}</td>
                  <td className="px-4 py-3 text-center text-blue-700 font-semibold">{s.standard}</td>
                  <td className="px-4 py-3 text-center text-green-700 font-semibold">{s.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
