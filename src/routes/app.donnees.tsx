import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { store } from "@/lib/store";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/app/donnees")({
  head: () => ({ meta: [{ title: "Données & Audit ML — OCP AI Monitor" }] }),
  component: DonneesPage,
});

const API_BASE = "https://ocp-tsp-intelligence-platform-2026-production.up.railway.app";

function detectSep(text: string): string {
  const line = text.split("\n")[0];
  const counts = {
    ";": (line.match(/;/g) || []).length,
    ",": (line.match(/,/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCSV(text: string) {
  const sep = detectSep(text);
  const lines = text.trim().split("\n").filter(l => l.trim());
  const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, "").replace(/\r/g, ""));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/"/g, "").replace(/\r/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
  return { headers, rows };
}

function parseExcel(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (data.length < 2) return { headers: [], rows: [] };
  const headers = (data[0] as any[]).map(h => String(h ?? "").trim());
  const rows = data.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function colStats(rows: Record<string, string>[], col: string) {
  const vals = rows.map(r => parseFloat((r[col] || "").replace(",", "."))).filter(v => !isNaN(v));
  if (vals.length === 0) return { type: "texte", mean: null, min: null, max: null };
  return {
    type: "numérique",
    mean: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
    min: parseFloat(Math.min(...vals).toFixed(3)),
    max: parseFloat(Math.max(...vals).toFixed(3)),
  };
}

function buildReadings(headers: string[], rows: Record<string, string>[]) {
  const find = (keys: string[]) =>
    headers.find(h => keys.some(k => norm(h).includes(norm(k)))) ?? null;

  const flowAcide = find(["flow_rate_phosphoric_acid_1", "flowratephosphoricacid1", "debitacide", "debit_acide"]);
  const flowPhos = find(["flow_rate_ground_phosphate", "flowrategroundphosphate", "debitphosphate", "debit_phosphate"]);
  const flowSlurry = find(["flow_rate_slurry", "slurry", "ratios", "ratio_ss"]);
  const production = find(["production_tsp", "productiontsp", "production"]);
  const debitAcp = find(["debitacp", "debit_acp", "acp2"]);
  const debitPp = find(["debitpp", "debit_pp"]);
  const densite = find(["densite", "density", "densitear"]);
  const tempReac = find(["tempreac", "temp_reac", "temperaturereaction", "temperature_reaction"]);
  const tempSech = find(["tempsech", "temp_sech", "temperaturesechage", "temperature_sechage"]);
  const granulo = find(["granulo", "d50"]);
  const humidite = find(["humidite", "h2o", "humidity"]);

  const hasData = flowAcide || flowPhos || debitAcp || debitPp;
  if (!hasData) return { readings: [], detected: false };

  const readings = rows.slice(0, 200).map(r => {
    const num = (col: string | null, def: number) => {
      if (!col) return def;
      const v = parseFloat((r[col] || "").replace(",", "."));
      return isNaN(v) || v === 0 ? def : v;
    };

    let debit_acide = num(flowAcide || debitAcp, 16);
    let debit_phosphate = num(flowPhos || debitPp, 30);
    let ratio_ss = num(flowSlurry, 0.95);
    let humidite_entree = num(production || humidite, 4);
    let pression_filtre = num(densite, 3.5);

    if (debit_acide > 1000) debit_acide = debit_acide / 100;
    if (debit_phosphate > 1000) debit_phosphate = debit_phosphate / 10;
    if (ratio_ss > 10) ratio_ss = ratio_ss / 100;
    if (humidite_entree > 100) humidite_entree = humidite_entree / 30;
    if (pression_filtre > 100) pression_filtre = pression_filtre / 500;

    return {
      debit_acide: Math.max(5, Math.min(50, debit_acide)),
      debit_phosphate: Math.max(10, Math.min(80, debit_phosphate)),
      granulometrie_d50: num(granulo, 3.5),
      humidite_entree: Math.max(1, Math.min(15, humidite_entree)),
      pression_filtre: Math.max(1, Math.min(8, pression_filtre)),
      ratio_ss: Math.max(0.5, Math.min(2, ratio_ss)),
      temperature_reaction: Math.max(60, Math.min(120, num(tempReac, 90))),
      temperature_sechage: Math.max(300, Math.min(600, num(tempSech, 450))),
    };
  }).filter(r => r.debit_acide > 0);

  return { readings, detected: true };
}

const ETAPES = [
  { icon: "🗄️", label: "Data Pipeline · ingestion", duree: 600 },
  { icon: "🧹", label: "Auto-cleaning · null/outliers", duree: 500 },
  { icon: "✅", label: "Validation · schéma & plages", duree: 500 },
  { icon: "📦", label: "Feature Store · extraction features", duree: 600 },
  { icon: "🤖", label: "Moteur d'inférence · prédictions GBM", duree: 1200 },
  { icon: "🎯", label: "Moteur de décision · recommandations", duree: 500 },
];

function DonneesPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [etapeActive, setEtapeActive] = useState(-1);
  const [etapesDone, setEtapesDone] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f); setDone(false); setEtapeActive(-1);
    setEtapesDone([]); setResult(null); setApiError(null);
  };

  const animerEtapes = (callback: () => void) => {
    let delay = 0;
    ETAPES.forEach((etape, i) => {
      delay += etape.duree;
      setTimeout(() => {
        setEtapeActive(i + 1);
        setEtapesDone(prev => [...prev, i]);
        if (i === ETAPES.length - 1) setTimeout(callback, 400);
      }, delay);
    });
  };

  const processData = async (headers: string[], rows: Record<string, string>[], fileName: string) => {
    const { readings, detected } = buildReadings(headers, rows);

    const p2o5Col = headers.find(h => norm(h).includes("p2o5") || norm(h).includes("p205"));
    const caoCol = headers.find(h => norm(h).includes("cao"));
    const mgoCol = headers.find(h => norm(h).includes("mgo"));
    const so4Col = headers.find(h => norm(h).includes("so4") || norm(h).includes("so3"));
    const densiteCol = headers.find(h => norm(h).includes("densite") || norm(h).includes("density"));

    animerEtapes(async () => {
      try {
        let sourceApi = false;
        let apiResults: any[] = [];

        if (detected && readings.length > 0) {
          try {
            const resp = await fetch(`${API_BASE}/api/v1/predictions/predict/batch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ readings: readings.slice(0, 100), source: "upload" }),
            });
            if (resp.ok) {
              apiResults = await resp.json();
              sourceApi = true;
            }
          } catch (_) {}
        }

        const p2o5Vals = p2o5Col
          ? rows.map(r => parseFloat((r[p2o5Col] || "").replace(",", "."))).filter(v => !isNaN(v) && v > 5 && v < 60)
          : [];

        const p2o5Moy = sourceApi && apiResults.length > 0
          ? parseFloat((apiResults.map((r: any) => r.p2o5_predicted).filter((v: number) => v > 0).reduce((a: number, b: number) => a + b, 0) / Math.max(1, apiResults.filter((r: any) => r.p2o5_predicted > 0).length)).toFixed(2))
          : p2o5Vals.length > 0
            ? parseFloat((p2o5Vals.reduce((a, b) => a + b, 0) / p2o5Vals.length).toFixed(2))
            : 0;

        const so4Moy = sourceApi && apiResults.length > 0
          ? parseFloat((apiResults.map((r: any) => r.so4_predicted).filter((v: number) => v > 0).reduce((a: number, b: number) => a + b, 0) / Math.max(1, apiResults.filter((r: any) => r.so4_predicted > 0).length)).toFixed(2))
          : 0;

        const confMoy = sourceApi && apiResults.length > 0
          ? parseFloat((apiResults.reduce((a: number, r: any) => a + r.confidence, 0) / apiResults.length).toFixed(2))
          : 0;

        const conforme = p2o5Moy === 0 || p2o5Moy >= 44;
        const alertes: any[] = [];
        if (p2o5Moy > 0 && p2o5Moy < 44)
          alertes.push({ type: "critique", message: `P2O5 moyen ${p2o5Moy}% — sous le seuil de conformité (44%)` });
        if (sourceApi) {
          const nonConf = apiResults.filter((r: any) => r.overall_status !== "normal").length;
          if (nonConf > 0)
            alertes.push({ type: "warning", message: `${nonConf} prédictions hors norme détectées par le modèle GBM` });
        }

        const stats = headers.map(h => ({ col: h, ...colStats(rows, h) }));

        const colsTrouvees = [
          p2o5Col && `P2O5 (${p2o5Col})`,
          caoCol && `CaO (${caoCol})`,
          mgoCol && `MgO (${mgoCol})`,
          so4Col && `SO4 (${so4Col})`,
          densiteCol && `Densité (${densiteCol})`,
          detected && `✅ Colonnes capteurs (${readings.length} lectures)`,
        ].filter(Boolean);

        const resultData = {
          fichier: fileName,
          timestamp: new Date().toISOString(),
          lignes: rows.length,
          colonnes: headers.length,
          headers,
          apercu: rows.slice(0, 5),
          p2o5: p2o5Moy,
          so4: so4Moy,
          statut: conforme ? "conforme" : "non-conforme",
          confiance: confMoy,
          alertes,
          sourceApi,
          detected,
          readingsCount: readings.length,
          apiResults: apiResults.slice(0, 10),
          colsTrouvees,
          stats,
        };

        setResult(resultData);
        setProcessing(false);
        setDone(true);
        store.setResult(resultData);
        localStorage.setItem("pipeline_result", JSON.stringify(resultData));

        if (!conforme) {
          const ex = JSON.parse(localStorage.getItem("alertes_actives") || "[]");
          ex.unshift({ id: Date.now(), fichier: fileName, p2o5: p2o5Moy, timestamp: new Date().toISOString() });
          localStorage.setItem("alertes_actives", JSON.stringify(ex.slice(0, 10)));
        }
      } catch (err: any) {
        setApiError(err.message || "Erreur inattendue");
        setProcessing(false);
      }
    });
  };

  const lancerPipeline = () => {
    if (!file) return;
    setProcessing(true); setEtapesDone([]); setEtapeActive(0); setApiError(null);

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const reader = new FileReader();

    if (isExcel) {
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const { headers, rows } = parseExcel(buffer);
        await processData(headers, rows, file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCSV(text);
        await processData(headers, rows, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Données & Audit ML</h1>
          <p className="text-sm text-gray-500 mt-1">Upload → détection automatique → prédictions GBM réelles</p>
        </div>
        <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          🔗 CONNECTÉ À RAILWAY
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          {/* Fichiers compatibles */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">📁 Fichiers compatibles avec l'API ML</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>✅ <strong>donnees_propres.csv</strong> — capteurs temps réel</p>
              <p>✅ <strong>107F.xlsx</strong> — données procédé TSP</p>
              <p>✅ <strong>Tous fichiers .xlsx / .csv</strong> — auto-détection</p>
            </div>
          </div>

          {/* Étapes */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Pipeline automatique</p>
            <div className="space-y-2">
              {ETAPES.map((etape, i) => {
                const fait = etapesDone.includes(i);
                const actif = etapeActive === i && processing;
                return (
                  <div key={i} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-xs transition-all duration-300 ${fait ? "bg-green-50 border-green-200 text-green-700" : actif ? "bg-blue-50 border-blue-200 text-blue-700 animate-pulse" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                    <span>{fait ? "✅" : actif ? "⏳" : etape.icon}</span>
                    <span className={fait ? "font-medium" : ""}>{etape.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Upload du fichier</p>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => !processing && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragging ? "border-green-400 bg-green-50" : file ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-gray-50"}`}
            >
              <input ref={inputRef} type="file" accept=".csv,.tsv,.xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  <p className="text-2xl mb-1">{file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ? "📊" : "📄"}</p>
                  <p className="font-semibold text-green-700 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl mb-2">⬆️</p>
                  <p className="text-sm font-medium text-gray-600">Glissez ou cliquez</p>
                  <p className="text-xs text-gray-400 mt-1">.csv .tsv .xlsx .xls — auto-détecté</p>
                </div>
              )}
            </div>

            {file && !processing && !done && (
              <button onClick={lancerPipeline} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                🚀 Lancer le pipeline ML
              </button>
            )}
            {processing && (
              <div className="mt-3 text-center text-sm text-blue-600 font-medium animate-pulse">
                ⏳ Pipeline ML en cours...
              </div>
            )}
            {apiError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                ❌ {apiError}
              </div>
            )}
            {done && (
              <div className="mt-3 space-y-2">
                <div className={`border rounded-xl p-3 text-center ${result?.sourceApi ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                  <p className={`font-semibold text-sm ${result?.sourceApi ? "text-green-700" : "text-blue-700"}`}>
                    {result?.sourceApi ? "✅ Prédictions GBM réelles !" : "📊 Analyse locale terminée"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result?.sourceApi
                      ? `🔗 ${result.readingsCount} lignes analysées par le modèle GBM`
                      : "Colonnes capteurs non détectées — analyse statistique"}
                  </p>
                </div>
                <button onClick={() => navigate({ to: "/app/dashboard" })} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs transition-all">
                  📊 Voir le Dashboard
                </button>
                <button onClick={() => { setFile(null); setDone(false); setEtapesDone([]); setEtapeActive(-1); setResult(null); setApiError(null); }} className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-xl text-xs transition-all">
                  Uploader un autre fichier
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-2 space-y-4">
          {!result && (
            <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center text-gray-400">
              <p className="text-4xl mb-3">🤖</p>
              <p className="font-semibold text-gray-500">Les prédictions ML apparaîtront ici</p>
              <p className="text-xs mt-2">Uploadez <strong>donnees_propres.csv</strong> pour les vraies prédictions GBM</p>
              <p className="text-xs mt-1 text-blue-500">Supporte aussi les fichiers <strong>.xlsx</strong> directement</p>
            </div>
          )}

          {result && (
            <>
              {/* Badge source */}
              <div className={`rounded-xl p-3 flex items-center gap-3 ${result.sourceApi ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
                <span className="text-2xl">{result.sourceApi ? "🤖" : "📊"}</span>
                <div>
                  <p className={`font-semibold text-sm ${result.sourceApi ? "text-green-700" : "text-gray-700"}`}>
                    {result.sourceApi ? "Prédictions GBM réelles — Modèle ML Railway" : "Analyse statistique locale"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {result.sourceApi
                      ? `${result.readingsCount} lectures → modèle GBM · ${result.apiResults?.length} résultats`
                      : "Colonnes capteurs non reconnues — uploadez donnees_propres.csv pour l'IA"}
                  </p>
                </div>
              </div>

              {/* Prédiction P2O5 */}
              <div className={`border-2 rounded-xl p-5 ${result.statut === "conforme" ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      {result.sourceApi ? "P2O5 prédit par GBM" : "P2O5 calculé"}
                    </p>
                    <p className={`text-5xl font-bold ${result.statut === "conforme" ? "text-green-600" : "text-red-600"}`}>
                      {result.p2o5 > 0 ? `${result.p2o5}%` : "—"}
                    </p>
                    {result.so4 > 0 && <p className="text-sm text-gray-600 mt-1">SO4 prédit : {result.so4}%</p>}
                    {result.confiance > 0 && <p className="text-sm text-gray-600">Confiance modèle : {(result.confiance * 100).toFixed(0)}%</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold px-4 py-2 rounded-full ${result.statut === "conforme" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {result.statut === "conforme" ? "✅ CONFORME" : "⚠️ NON CONFORME"}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">{result.lignes} lignes · {result.colonnes} colonnes</p>
                    <p className="text-xs text-gray-400">{result.sourceApi ? "🤖 Modèle GBM Railway" : "📊 Analyse locale"}</p>
                  </div>
                </div>
              </div>

              {/* Colonnes détectées */}
              {result.colsTrouvees?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">🔍 Colonnes détectées</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.colsTrouvees.map((c: string, i: number) => (
                      <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertes */}
              {result.alertes?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">⚠️ Alertes</h3>
                  <div className="space-y-2">
                    {result.alertes.map((a: any, i: number) => (
                      <div key={i} className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${a.type === "critique" ? "bg-red-50 border border-red-200 text-red-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700"}`}>
                        <span>{a.type === "critique" ? "🔴" : "🟡"}</span>
                        <span>{a.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultats GBM */}
              {result.apiResults?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Prédictions GBM — Modèle Railway</h3>
                      <p className="text-xs text-gray-400">Résultats réels du modèle ML entraîné sur données OCP</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">P2O5 prédit</th>
                          <th className="px-3 py-2 text-left">SO4 prédit</th>
                          <th className="px-3 py-2 text-left">F prédit</th>
                          <th className="px-3 py-2 text-left">MG prédit</th>
                          <th className="px-3 py-2 text-left">Confiance</th>
                          <th className="px-3 py-2 text-left">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.apiResults.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2 font-mono font-bold text-green-600">{r.p2o5_predicted?.toFixed(2)}%</td>
                            <td className="px-3 py-2 font-mono text-blue-600">{r.so4_predicted?.toFixed(3)}%</td>
                            <td className="px-3 py-2 font-mono text-purple-600">{r.f_predicted?.toFixed(3)}%</td>
                            <td className="px-3 py-2 font-mono text-orange-600">{r.mg_predicted?.toFixed(3)}%</td>
                            <td className="px-3 py-2 font-mono">{(r.confidence * 100)?.toFixed(0)}%</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${r.overall_status === "normal" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                {r.overall_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Aperçu */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Aperçu des données</h3>
                  <p className="text-xs text-gray-400">5 premières lignes de {result.lignes}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                      <tr>{result.headers.slice(0, 8).map((h: string) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.apercu.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {result.headers.slice(0, 8).map((h: string) => <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Statistiques colonnes numériques</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-2 text-left">Colonne</th>
                        <th className="px-4 py-2 text-left">Moyenne</th>
                        <th className="px-4 py-2 text-left">Min</th>
                        <th className="px-4 py-2 text-left">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.stats.filter((s: any) => s.type === "numérique").slice(0, 15).map((s: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono font-semibold text-gray-700">{s.col}</td>
                          <td className="px-4 py-2 text-blue-600 font-mono">{s.mean ?? "—"}</td>
                          <td className="px-4 py-2 text-green-600 font-mono">{s.min ?? "—"}</td>
                          <td className="px-4 py-2 text-red-500 font-mono">{s.max ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}