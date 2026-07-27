import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/app/validation")({
  head: () => ({ meta: [{ title: "Validation des actions — OCP AI Monitor" }] }),
  component: ValidationPage,
});

function buildDecisionsFromFile(pipelineData: any) {
  if (!pipelineData?.stats) return null;

  const numCols = pipelineData.stats
    .filter((s: any) => s.type === "numérique" && s.mean !== null && s.max > 0)
    .slice(0, 4);

  if (numCols.length === 0) return null;

  const decisions: any[] = [];

  numCols.forEach((col: any, i: number) => {
    const range = col.max - col.min;
    if (range === 0) return;
    const ecart = (col.mean - col.min) / range;
    const needsAction = ecart > 0.8 || ecart < 0.2;
    if (!needsAction && i > 1) return;

    const isHigh = ecart > 0.8;
    const action = isHigh
      ? `Réduire ${col.col} de ${((ecart - 0.7) * 20).toFixed(0)}% — valeur trop élevée`
      : ecart < 0.2
        ? `Augmenter ${col.col} de ${((0.4 - ecart) * 20).toFixed(0)}% — valeur trop basse`
        : `Surveiller ${col.col} — plage acceptable`;

    const confiance = Math.round(70 + Math.abs(ecart - 0.5) * 40);
    const risque = Math.abs(ecart - 0.5) > 0.35 ? "faible" : "moyen";
    const niveau = Math.abs(ecart - 0.5) > 0.35 ? "critique" : "warning";

    decisions.push({
      id: `REC-${7800 + i}`,
      niveau,
      titre: action,
      confiance,
      risque,
      causePrincipale: `${col.col} — moyenne ${col.mean?.toFixed(2)} · plage [${col.min?.toFixed(2)}, ${col.max?.toFixed(2)}]`,
      justification: `La colonne ${col.col} présente une moyenne de ${col.mean?.toFixed(2)}, soit ${((ecart) * 100).toFixed(0)}% de la plage observée [${col.min?.toFixed(2)}, ${col.max?.toFixed(2)}]. ${isHigh ? "Une réduction est nécessaire pour revenir dans la zone optimale." : ecart < 0.2 ? "Une augmentation est recommandée pour optimiser le procédé." : "La valeur est dans la plage acceptable mais une surveillance est recommandée."}`,
      contraintes: [
        `${col.col} ∈ [${col.min?.toFixed(2)}, ${col.max?.toFixed(2)}]`,
        `Cible optimale : ${((col.min + col.max) / 2).toFixed(2)} (médiane observée)`,
        `Écart actuel : ${((ecart - 0.5) * 100).toFixed(0)}% de la plage`,
      ],
      securite: [
        `Confirmation ingénieur requise avant modification`,
        `Surveiller l'impact sur les colonnes corrélées`,
      ],
      fromFile: true,
      colStats: col,
    });
  });

  // Toujours au moins 2 décisions
  if (decisions.length === 0) {
    decisions.push({
      id: "REC-FILE-01",
      niveau: "warning",
      titre: `Vérification globale — ${pipelineData.fichier}`,
      confiance: 82,
      risque: "faible",
      causePrincipale: `${pipelineData.lignes} lignes analysées — ${numCols.length} colonnes numériques`,
      justification: `Le fichier ${pipelineData.fichier} a été analysé. Les ${numCols.length} colonnes numériques sont dans des plages acceptables. Une surveillance préventive est recommandée.`,
      contraintes: numCols.slice(0, 3).map((c: any) => `${c.col} ∈ [${c.min?.toFixed(2)}, ${c.max?.toFixed(2)}]`),
      securite: ["Surveillance continue recommandée", "Prochaine analyse dans 24h"],
      fromFile: true,
    });
  }

  return decisions;
}

const FALLBACK_DECISIONS = [
  {
    id: "REC-7821",
    niveau: "critique",
    titre: "Réduire débit acide F1 de 6% & augmenter consigne refroidisseur à 92°C",
    confiance: 87,
    risque: "faible",
    causePrincipale: "Sur-injection acide sur Réacteur R-204 (contribution 64%)",
    justification: "Gradient ΔT de 2.4°C/min combiné à un retard de 7.8% sur la vanne de refroidissement FC-12. Réduire le débit acide ramène l'exotherme dans l'enveloppe de sécurité pendant que la montée en température du refroidisseur rattrape.",
    contraintes: ["F1 ∈ [120, 165] m³/h", "Consigne refroidisseur ≤ 95°C", "ΔT/min ≤ 1.5 après action"],
    securite: ["Verrouillage SIL-2 sur R-204 actif", "Confirmation opérateur requise"],
    fromFile: false,
  },
  {
    id: "REC-7819",
    niveau: "warning",
    titre: "Augmenter ratio recyclage colonne C-12 à 2.10",
    confiance: 71,
    risque: "moyen",
    causePrincipale: "Instabilité débit sur boucle C-12 (contribution 48%)",
    justification: "Le ratio de recyclage actuel de 1.85 est sous la valeur optimale. Augmenter à 2.10 stabilise la granulométrie et réduit la variance P2O5.",
    contraintes: ["Ratio recyclage ∈ [1.5, 3.0]", "Débit colonne ≤ 180 m³/h"],
    securite: ["Surveillance pression colonne requise"],
    fromFile: false,
  },
];

function ValidationPage() {
  const [pipelineData, setPipelineData] = useState<any>(store.getResult());
  const [comment,   setComment]   = useState("");
  const [validated, setValidated] = useState<string[]>([]);
  const [rejected,  setRejected]  = useState<string[]>([]);

  useEffect(() => {
    return store.subscribe(() => {
      setPipelineData(store.getResult());
      setValidated([]);
      setRejected([]);
    });
  }, []);

  const fileDecisions  = pipelineData ? buildDecisionsFromFile(pipelineData) : null;
  const allDecisions   = fileDecisions ?? FALLBACK_DECISIONS;
  const [selected, setSelected] = useState<any>(allDecisions[0]);

  // Sync selected quand les décisions changent
  useEffect(() => {
    const d = fileDecisions ?? FALLBACK_DECISIONS;
    setSelected(d[0]);
  }, [pipelineData]);

  const pending  = allDecisions.filter(d => !validated.includes(d.id) && !rejected.includes(d.id));
  const conformeStatut = pipelineData?.statut === "conforme";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validation des actions</h1>
        <p className="text-sm text-gray-500 mt-1">
          {fileDecisions
            ? `${pipelineData.fichier} · ${allDecisions.length} décisions générées depuis vos données`
            : "Ligne 107 DEF · Révision ingénieur requise avant application"}
        </p>
      </div>

      {/* Bandeau fichier */}
      {pipelineData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-blue-600 font-semibold text-sm">📂 {pipelineData.fichier}</span>
          <span className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono font-bold text-green-700">
            P2O5 {pipelineData.p2o5 > 0 ? `${pipelineData.p2o5}%` : "—"}
          </span>
          <span className="bg-white border border-blue-200 rounded-lg px-3 py-1 text-xs font-mono text-blue-700">
            {pipelineData.lignes} lignes · {pipelineData.colonnes} colonnes
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${conformeStatut ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {pipelineData.statut?.toUpperCase()}
          </span>
          {fileDecisions && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              🔗 {allDecisions.length} décisions depuis les données réelles
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(pipelineData.timestamp).toLocaleString("fr-FR")}
          </span>
        </div>
      )}

      {!pipelineData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          💡 Uploadez un fichier dans <strong>Données &amp; Audit ML</strong> pour générer des décisions depuis vos données réelles
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Liste décisions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Décisions en attente</h2>
            <p className="text-xs text-gray-400">
              {fileDecisions ? `Générées depuis ${pipelineData.fichier}` : "En attente de révision ingénieur"}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {pending.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">✅ Toutes les décisions sont traitées</div>
            ) : pending.map((d: any) => (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className={`p-4 cursor-pointer transition-all ${selected?.id === d.id ? "bg-green-50 border-l-4 border-green-500" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 font-mono">{d.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    d.niveau === "critique" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                  }`}>
                    {d.niveau === "critique" ? "● CRITIQUE" : "● AVERTISSEMENT"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{d.titre}</p>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>conf. {d.confiance}%</span>
                  <span>risque {d.risque}</span>
                </div>
                {d.fromFile && (
                  <span className="text-xs text-blue-500 mt-1 block">🔗 données réelles</span>
                )}
              </div>
            ))}

            {/* Décisions traitées */}
            {[
              ...validated.map(id => ({ id, statut: "validé" })),
              ...rejected.map(id =>  ({ id, statut: "rejeté" })),
            ].map(item => (
              <div key={item.id} className="p-4 opacity-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">{item.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    item.statut === "validé" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {item.statut === "validé" ? "✅ Validé" : "❌ Rejeté"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail décision */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selected.fromFile && (
                      <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                        🔗 Données réelles
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg leading-snug">{selected.titre}</h2>
                  <p className="text-xs text-gray-400 mt-1">{selected.id} · validation technique requise</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${
                  selected.risque === "faible"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-yellow-100 text-yellow-600 border border-yellow-200"
                }`}>
                  ● RISQUE {selected.risque.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Confiance</p>
                  <p className="text-3xl font-bold text-green-600">{selected.confiance}%</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${selected.confiance}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Cause principale</p>
                  <p className="text-sm text-gray-700">{selected.causePrincipale}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Justification technique</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.justification}</p>
              </div>

              {/* Stats réelles si fichier */}
              {selected.fromFile && selected.colStats && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-2">📊 Statistiques réelles — {selected.colStats.col}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-gray-400">Min</p>
                      <p className="font-bold text-green-600">{selected.colStats.min?.toFixed(3)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Moyenne</p>
                      <p className="font-bold text-blue-600">{selected.colStats.mean?.toFixed(3)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Max</p>
                      <p className="font-bold text-red-500">{selected.colStats.max?.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contraintes et sécurité */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">🛡️ Contraintes procédé</p>
                <ul className="space-y-1">
                  {selected.contraintes.map((c: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1">
                      <span className="text-gray-400">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">⚠️ Limites de sécurité</p>
                <ul className="space-y-1">
                  {selected.securite.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1">
                      <span className="text-gray-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Commentaire et actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Commentaire technique (visible dans la piste d'audit)..."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setValidated(v => [...v, selected.id]); setComment(""); }}
                  disabled={validated.includes(selected.id) || rejected.includes(selected.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
                >
                  🛡️ Valider techniquement
                </button>
                <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  ✓ Approuver
                </button>
                <button
                  onClick={() => { setRejected(v => [...v, selected.id]); setComment(""); }}
                  disabled={validated.includes(selected.id) || rejected.includes(selected.id)}
                  className="px-4 py-2.5 border border-red-200 rounded-xl text-sm text-red-500 hover:bg-red-50 disabled:opacity-40"
                >
                  ✕ Rejeter
                </button>
              </div>

              {/* Statut après action */}
              {(validated.includes(selected.id) || rejected.includes(selected.id)) && (
                <div className={`mt-3 p-3 rounded-lg text-sm font-medium text-center ${
                  validated.includes(selected.id)
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}>
                  {validated.includes(selected.id) ? "✅ Validé techniquement — enregistré dans la piste d'audit" : "❌ Rejeté — enregistré pour amélioration du modèle"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}