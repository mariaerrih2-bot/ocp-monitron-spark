const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  getLiveData: () => fetch(`${API_BASE}/api/v1/data/live`).then(r => r.json()),
  getMetrics: () => fetch(`${API_BASE}/api/v1/monitoring/metrics`).then(r => r.json()),
  getHistory: () => fetch(`${API_BASE}/api/v1/data/history`).then(r => r.json()),
  getStats: () => fetch(`${API_BASE}/api/v1/data/stats`).then(r => r.json()),
  getModels: () => fetch(`${API_BASE}/api/v1/monitoring/models`).then(r => r.json()),
  
  predict: (data: any) => fetch(`${API_BASE}/api/v1/predictions/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  analyzeDrift: (data: any) => fetch(`${API_BASE}/api/v1/drift/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  optimize: (data: any) => fetch(`${API_BASE}/api/v1/optimization/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
};