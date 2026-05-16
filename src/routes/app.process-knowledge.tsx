import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/process-knowledge")({
  component: ProcessKnowledgePage,
});

const API = "https://ocp-tsp-intelligence-platform-2026-production.up.railway.app";

const PARAMS = [
  { key: "temperature_reaction", label: "Temperature reaction",  min: 75,  max: 105, unite: "C"   },
  { key: "pression_filtre",      label: "Pression filtre",       min: 1,   max: 10,  unite: "bar" },
  { key: "debit_acide",          label: "Debit acide H3PO4",     min: 6,   max: 28,  unite: "m3/h"},
  { key: "debit_phosphate",      label: "Debit phosphate",       min: 10,  max: 50,  unite: "t/h" },
  { key: "temperature_sechage",  label: "Temperature sechage",   min: 80,  max: 700, unite: "C"   },
  { key: "humidite_entree",      label: "Humidite entree",       min: 1.5, max: 8,   unite: "%"   },
  { key: "granulometrie_d50",    label: "Granulometrie D50",     min: 1.5, max: 6,   unite: "mm"  },
  { key: "ratio_ss",             label: "Ratio acide/phosphate", min: 0.8, max: 1.1, unite: "-"   },
];

function ProcessKnowledgePage() {
  const [readings, setReadings] = useState(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const fetchData = async () => {
    try {
      const r = await fetch(API + "/api/v1/data/current");
      const d = await r.json();
      setReadings(d.readings);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    const saved = localStorage.getItem("last_analysis");
    if (saved) setLastAnalysis(JSON.parse(saved));
    return () => clearInterval(t);
  }, []);

  const isOk = (key, val) => {
    const p = PARAMS.find(x => x.key === key);
    return p ? val >= p.min && val <= p.max : true;
  };

  const nbAlertes = readings ? PARAMS.filter(p => readings[p.key] !== undefined && !isOk(p.key, readings[p.key])).length : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procede TSP — Ligne 107 DEF</h1>
          <p className="text-gray-500">OCP Khouribga · Surveillance temps reel</p>
        </div>
        <div className="flex gap-3 items-center">
          {nbAlertes > 0 && <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-semibold">? {nbAlertes} hors borne</span>}
          {nbAlertes === 0 && !loading && readings && <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-semibold">? Tous OK</span>}
          <span className="text-sm text-gray-400">{lastUpdate || "Connexion..."}</span>
          <button onClick={fetchData} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">Rafraichir</button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <p className="font-semibold text-gray-700 mb-3">Schema du Procede</p>
        <div className="flex items-center gap-2 flex-wrap">
          {["Phosphate+H3PO4","Reaction AM06","Granulation","Sechage","Criblage","Stockage TSP"].map((e,i,arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700">{e}</div>
              {i < arr.length-1 && <span className="text-gray-400">to</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Recyclage : Fines + Sur-granules - Broyage - Retour Granulateur (ratio 3-4.5)</p>
        </div>
      </div>

      {lastAnalysis && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <h2 className="font-bold text-indigo-800 mb-3">Derniere Analyse IA</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm"><p className="text-xs text-gray-500">P2O5 Predit</p><p className="text-xl font-bold text-indigo-700">{lastAnalysis.p2o5.toFixed(2)}%</p></div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm"><p className="text-xs text-gray-500">SO4</p><p className="text-xl font-bold text-blue-700">{lastAnalysis.so4.toFixed(2)}%</p></div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Fluorures</p><p className="text-xl font-bold text-orange-700">{lastAnalysis.fluorures.toFixed(2)}%</p></div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm"><p className="text-xs text-gray-500">Statut</p><p className={"text-lg font-bold " + (lastAnalysis.statut === "conforme" ? "text-green-600" : "text-red-600")}>{lastAnalysis.statut.toUpperCase()}</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {PARAMS.map(p => {
          const val = readings?.[p.key];
          const ok = val !== undefined ? isOk(p.key, val) : null;
          const pct = val !== undefined ? Math.min(100, Math.max(0, ((val-p.min)/(p.max-p.min))*100)) : 0;
          return (
            <div key={p.key} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800 text-sm">{p.label}</span>
                {loading ? <span className="text-gray-400 text-xs animate-pulse">Chargement...</span>
                  : val !== undefined
                    ? <div className="flex items-center gap-2">
                        <span className={"font-bold text-sm " + (ok ? "text-green-700" : "text-red-700")}>{val} {p.unite}</span>
                        <span className={"text-xs px-2 py-0.5 rounded-full " + (ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{ok ? "OK" : "Alerte"}</span>
                      </div>
                    : <span className="text-gray-400 text-sm">— reseau OCP</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={"h-2 rounded-full " + (ok ? "bg-green-500" : "bg-red-500")} style={{width: pct + "%"}} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Bornes : {p.min} – {p.max} {p.unite}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-bold text-gray-900">Specifications Qualite TSP — OCP</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600">Parametre</th>
              <th className="text-center px-4 py-3 text-blue-600">TSP Standard</th>
              <th className="text-center px-4 py-3 text-green-600">TSP Premium</th>
            </tr>
          </thead>
          <tbody>
            {[["P2O5 Total","44 %","45.5 %"],["P2O5 Assimilable","41 %","43 %"],["Taux Conversion","90 %","93 %"],["SO4 Residuel","3 %","2 %"],["Fluorures F","2 %","1.5 %"],["Humidite","5 %","4 %"]].map((s,i) => (
              <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                <td className="px-4 py-3 font-medium text-gray-800">{s[0]}</td>
                <td className="px-4 py-3 text-center text-blue-700 font-semibold">{s[1]}</td>
                <td className="px-4 py-3 text-center text-green-700 font-semibold">{s[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
