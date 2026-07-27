import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/app/logs")({
  head: () => ({ meta: [{ title: "Logs — OCP AI Monitor" }] }),
  component: LogsPage,
});

type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
}

const MESSAGES = [
  { level: "INFO" as LogLevel, message: "inference.engine: model v3.2.1 served 142 requests in 1s window" },
  { level: "WARN" as LogLevel, message: "stream.processor: window join completed in 38ms" },
  { level: "ERROR" as LogLevel, message: "etl.lims: connection timeout after 30s, retry 2/5" },
  { level: "INFO" as LogLevel, message: "feature.store: online write batch=512 ok" },
  { level: "INFO" as LogLevel, message: "decision.api: applied recommendation REC-7821 (op=OP-1042)" },
  { level: "WARN" as LogLevel, message: "drift.monitor: psi=0.23 feed_c2c3_ratio threshold breach" },
  { level: "INFO" as LogLevel, message: "registry: model v3.3.0-rc1 staged" },
  { level: "ERROR" as LogLevel, message: "etl.batch: partition 2025-04-19 failed (out of memory)" },
  { level: "INFO" as LogLevel, message: "audit: user MG-9001 viewed decision log" },
  { level: "INFO" as LogLevel, message: "orchestrator: dag-002 finished in 4.2s" },
];

function getNow() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function generateLog(id: number): LogEntry {
  const m = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return { id, time: getNow(), level: m.level, message: m.message };
}

function LogsPage() {
  const initial = Array.from({ length: 20 }, (_, i) => generateLog(i));
  const [logs, setLogs] = useState<LogEntry[]>(initial);
  const [filter, setFilter] = useState<"ALL" | LogLevel>("ALL");
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(20);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setLogs(prev => [...prev, generateLog(idRef.current++)].slice(-200));
    }, 1500);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, paused]);

  const visible = logs.filter(l =>
    (filter === "ALL" || l.level === filter) &&
    (search === "" || l.message.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    INFO: logs.filter(l => l.level === "INFO").length,
    WARN: logs.filter(l => l.level === "WARN").length,
    ERROR: logs.filter(l => l.level === "ERROR").length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Log stream temps réel — Ligne 107 DEF</p>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${paused ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${paused ? "bg-gray-400" : "bg-green-500 animate-pulse"}`} />
            {paused ? "EN PAUSE" : "EN DIRECT · 1.5s"}
          </span>
          <span className="text-xs text-gray-500">Usine 107 · Ligne 3 · TSP-A</span>
        </div>
        <button
          onClick={() => setPaused(p => !p)}
          className={`text-xs px-4 py-1.5 rounded-full font-semibold border transition ${paused ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
        >
          {paused ? "▶ Reprendre" : "⏸ Pause"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{counts.INFO}</p>
          <p className="text-xs text-gray-500 mt-1">INFO</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-orange-500">{counts.WARN}</p>
          <p className="text-xs text-gray-500 mt-1">WARN</p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-600">{counts.ERROR}</p>
          <p className="text-xs text-gray-500 mt-1">ERROR</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {(["ALL", "INFO", "WARN", "ERROR"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-4 py-1.5 rounded-full font-semibold border transition ${filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            {f}
          </button>
        ))}
        <input
          type="text"
          placeholder="Rechercher dans les logs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto text-xs border border-gray-200 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <button
          onClick={() => setLogs([])}
          className="text-xs px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
        >
          🗑 Vider
        </button>
      </div>

      <div className="bg-gray-950 rounded-xl p-4 shadow-inner h-96 overflow-y-auto font-mono text-xs">
        {visible.map(l => (
          <div key={l.id} className="flex items-start gap-3 py-0.5 hover:bg-gray-900 px-1 rounded">
            <span className="text-gray-500 shrink-0 w-20">{l.time}</span>
            <span className={`shrink-0 w-12 font-bold ${l.level === "INFO" ? "text-blue-400" : l.level === "WARN" ? "text-orange-400" : "text-red-400"}`}>
              {l.level}
            </span>
            <span className="text-gray-300">{l.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}