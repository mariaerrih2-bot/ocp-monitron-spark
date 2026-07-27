import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  Lightbulb,
  Brain,
  Activity,
  Server,
  TrendingUp,
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { getCurrentUser, logout, ROLE_LABELS, canAccess, type Role } from "@/lib/auth";
import ocpLogo from "@/assets/ocp-logo.png";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/app/alerts", label: "Alertes", icon: Bell },
  { to: "/app/recommendations", label: "Recommandations", icon: Lightbulb },
  { to: "/app/shap" as any, label: "Analyse SHAP", icon: Brain },
  { to: "/app/validation" as any, label: "Validation des actions", icon: Brain },
  { to: "/app/derive" as any, label: "Dérive du modèle", icon: Activity },
  { to: "/app/historique" as any, label: "Comparaison historique", icon: BarChart3 },
  { to: "/app/explain", label: "Explication IA", icon: Brain },
  { to: "/app/simulation" as any, label: "Simulation", icon: Activity },
  { to: "/app/diagnostic" as any, label: "Diagnostic avancé", icon: Activity },
  { to: "/app/monitoring", label: "Monitoring temps réel", icon: Activity },
  { to: "/app/pipelines" as any, label: "Pipelines data", icon: Activity },
  { to: "/app/logs" as any, label: "Logs", icon: FileText },
  { to: "/app/deploiement" as any, label: "Déploiement", icon: Server },
  { to: "/app/securite" as any, label: "Sécurité", icon: Server },
  { to: "/app/configuration" as any, label: "Configuration système", icon: Server },
  { to: "/app/drift" as any, label: "Drift Monitoring", icon: Activity },
  { to: "/app/featurestore" as any, label: "Feature Store", icon: Activity },
  { to: "/app/entrainement" as any, label: "Entraînement", icon: Activity },
  { to: "/app/modeles" as any, label: "Comparaison modèles", icon: Activity },
  { to: "/app/donnees" as any, label: "Données & Audit ML", icon: Activity },
  { to: "/app/architecture" as any, label: "Architecture", icon: Activity },
  { to: "/app/performance" as any, label: "Performance", icon: BarChart3 },
  { to: "/app/lignes" as any, label: "Lignes & procédés", icon: Activity },
  { to: "/app/insights" as any, label: "Insights IA", icon: Sparkles },
  { to: "/app/rapports" as any, label: "Rapports & Exports", icon: MessageSquare },
  { to: "/app/kpis" as any, label: "KPIs exécutifs", icon: TrendingUp },
  { to: "/app/feedback", label: "Retour opérateur", icon: MessageSquare },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string; role: Role } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
  }, [navigate]);

  if (!user) return null;

  const nav = ALL_NAV.filter((n) => canAccess(user.role, n.to));

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ease-out`}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <img src={ocpLogo} alt="OCP" className="w-9 h-9" width={36} height={36} />
          <div>
            <div className="font-semibold text-[15px] leading-tight">OCP AI Monitor</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              Industrial Platform
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-1 transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">
              {ROLE_LABELS[user.role]}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-14 bg-card/80 backdrop-blur border-b border-border flex items-center px-4 md:px-6 gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -ml-2 rounded hover:bg-muted"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="status-dot inline-block w-2 h-2 rounded-full bg-success text-success" />
            <span className="text-sm text-muted-foreground">Live · OCP El Jadida site</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">v2.0 · build 2026.05.16</span>
          </div>
        </header>

        <main className="ocp-watermark flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
