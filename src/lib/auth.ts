// Mock RBAC auth — client-side only for demo purposes.
// In production, replace with Lovable Cloud auth + user_roles table.

export type Role = "operator" | "engineer" | "scientist" | "itops" | "management";

export interface User {
  email: string;
  name: string;
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  operator: "Operator",
  engineer: "Process Engineer",
  scientist: "Data Scientist",
  itops: "IT / Ops",
  management: "Management",
};

export const ROLE_HOMES: Record<Role, string> = {
  operator: "/app/dashboard",
  engineer: "/app/recommendations",
  scientist: "/app/monitoring",
  itops: "/app/pipelines",
  management: "/app/management",
};

// Demo accounts — any password works in demo mode.
export const DEMO_ACCOUNTS: Array<{ email: string; role: Role; name: string }> = [
  { email: "operator@ocp.ma", role: "operator", name: "Yassine Operator" },
  { email: "engineer@ocp.ma", role: "engineer", name: "Sara El Idrissi" },
  { email: "scientist@ocp.ma", role: "scientist", name: "Errih Maria" },
  { email: "itops@ocp.ma", role: "itops", name: "Mohammed Tazi" },
  { email: "management@ocp.ma", role: "management", name: "Leila Amrani" },
];

const STORAGE_KEY = "ocp.auth.user";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function login(email: string): User | null {
  const found = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!found) return null;
  const user: User = { email: found.email, name: found.name, role: found.role };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function canAccess(role: Role, path: string): boolean {
  // Page → allowed roles map
  const map: Record<string, Role[]> = {
    "/app/dashboard": ["operator", "engineer", "scientist"],
    "/app/alerts": ["operator", "engineer"],
    "/app/analyse": [],
    "/app/recommendations": ["operator"],
    "/app/explain": ["operator", "engineer", "scientist"],
    "/app/diagnostic": ["engineer"],
    "/app/shap": ["engineer"],
    "/app/validation": ["engineer"],
    "/app/derive": ["engineer", "scientist"],
    "/app/historique": ["engineer"],
    "/app/monitoring": ["operator"],
    "/app/admin": ["itops"],
    "/app/pipelines": ["itops"],
    "/app/logs": ["itops"],
    "/app/deploiement": ["itops"],
    "/app/securite": ["itops"],
    "/app/configuration": ["itops"],
    "/app/drift": ["scientist"],
    "/app/simulation": ["operator", "engineer"],
    "/app/performance": ["management"],
    "/app/featurestore": ["scientist"],
    "/app/entrainement": ["scientist"],
    "/app/modeles": ["scientist"],
    "/app/donnees": ["scientist", "itops"],
    "/app/architecture": ["scientist", "itops"],
    "/app/kpis": ["management"],
    "/app/lignes": ["management"],
    "/app/insights": ["management"],
    "/app/rapports": ["management"],
    "/app/feedback": ["operator", "engineer", "scientist", "itops", "management"],
  };
  return map[path]?.includes(role) ?? true;
}
