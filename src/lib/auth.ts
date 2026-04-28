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
  itops: "/app/admin",
  management: "/app/management",
};

// Demo accounts — any password works in demo mode.
export const DEMO_ACCOUNTS: Array<{ email: string; role: Role; name: string }> = [
  { email: "operator@ocp.ma", role: "operator", name: "Yassine Operator" },
  { email: "engineer@ocp.ma", role: "engineer", name: "Sara El Idrissi" },
  { email: "scientist@ocp.ma", role: "scientist", name: "Karim Benali" },
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
    "/app/dashboard": ["operator", "engineer", "scientist", "itops", "management"],
    "/app/analyse": ["operator", "engineer", "scientist", "itops", "management"],
    "/app/nettoyage": ["operator", "engineer", "scientist", "itops", "management"],
    "/app/alerts": ["operator", "engineer", "scientist", "itops", "management"],
    "/app/recommendations": ["operator", "engineer", "scientist", "management"],
    "/app/explain": ["engineer", "scientist", "management"],
    "/app/monitoring": ["scientist", "itops"],
    "/app/admin": ["itops"],
    "/app/management": ["management"],
    "/app/feedback": ["operator", "engineer", "scientist", "itops", "management"],
  };
  return map[path]?.includes(role) ?? true;
}
