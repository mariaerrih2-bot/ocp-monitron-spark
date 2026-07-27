const KEY = "ocp.pipeline.result";

type Listener = () => void;
const listeners = new Set<Listener>();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) listeners.forEach(l => l());
  });
}

export const store = {
  getResult: () => {
    if (typeof window === "undefined") return null;
    try {
      // Lit depuis les deux clés possibles
      const v1 = localStorage.getItem(KEY);
      if (v1) return JSON.parse(v1);
      const v2 = localStorage.getItem("pipeline_result");
      if (v2) return JSON.parse(v2);
      return null;
    } catch { return null; }
  },
  setResult: (result: any) => {
    if (typeof window === "undefined") return;
    const str = JSON.stringify(result);
    localStorage.setItem(KEY, str);
    localStorage.setItem("pipeline_result", str);
    listeners.forEach(l => l());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  clear: () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem("pipeline_result");
    listeners.forEach(l => l());
  },
};