import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { login, getCurrentUser, ROLE_HOMES, DEMO_ACCOUNTS, ROLE_LABELS } from "@/lib/auth";
import ocpFacility from "@/assets/ocp-facility.jpg";
import ocpLogo from "@/assets/ocp-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — OCP AI Monitoring" },
      { name: "description", content: "Secure access to OCP Group's industrial AI monitoring platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("operator@ocp.ma");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (u) navigate({ to: ROLE_HOMES[u.role] });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = login(email);
    if (!user) {
      setError("Unknown account. Try one of the demo accounts below.");
      return;
    }
    navigate({ to: ROLE_HOMES[user.role] });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left visual */}
      <div className="hidden lg:flex relative flex-1 overflow-hidden">
        <img
          src={ocpFacility}
          alt="OCP industrial site"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1280}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.04 230 / 0.85), oklch(0.3 0.12 160 / 0.55))",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src={ocpLogo} alt="OCP" className="w-11 h-11 bg-white/95 rounded-lg p-1" />
            <div>
              <div className="font-semibold text-lg leading-tight">OCP Group</div>
              <div className="text-xs uppercase tracking-widest text-white/70">
                AI Monitoring Platform
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-tight">
              Real-time intelligence
              <br /> for industrial excellence.
            </h1>
            <p className="mt-4 text-white/80 text-base">
              Monitor production, anticipate anomalies, and act on AI-driven recommendations
              across every plant, in real time.
            </p>
            <div className="mt-8 flex gap-6 text-sm">
              <div>
                <div className="text-3xl font-semibold">99.7%</div>
                <div className="text-white/70">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-semibold">12.4k</div>
                <div className="text-white/70">Signals/sec</div>
              </div>
              <div>
                <div className="text-3xl font-semibold">14</div>
                <div className="text-white/70">Live models</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-white/60">
                                                          
            © {new Date().getFullYear()} OCP Group · El Jadida · Jorf Lasfar
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background ocp-watermark">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={ocpLogo} alt="OCP" className="w-10 h-10" />
            <div>
              <div className="font-semibold">OCP AI Monitor</div>
              <div className="text-xs text-muted-foreground">Industrial Platform</div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access your operations dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@ocp.ma"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:opacity-95 transition"
            >
              Sign in <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Demo accounts (any password)
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => setEmail(a.email)}
                  className="flex items-center justify-between text-left text-xs px-3 py-2 rounded-md border border-border hover:border-primary hover:bg-accent transition"
                >
                  <span className="font-mono">{a.email}</span>
                  <span className="text-muted-foreground">{ROLE_LABELS[a.role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
