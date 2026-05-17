import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Sintype.lk" },
      { name: "description", content: "Sign in to Sintype.lk to sync your phone with your desktop." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const fn = mode === "in" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) setMsg(error);
    else if (mode === "up") setMsg("Check your email to confirm your account.");
  };

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <Zap className="w-10 h-10 text-[var(--neon-cyan)] logo-glow mx-auto" />
        <h1 className="font-display text-3xl neon-text mt-3">{mode === "in" ? "Welcome back" : "Create account"}</h1>
        <p className="text-sm text-muted-foreground mt-2">Sign in to pair your phone with this device.</p>
      </div>
      <form onSubmit={submit} className="neon-border p-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-secondary outline-none" autoComplete="email" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-secondary outline-none"
            autoComplete={mode === "in" ? "current-password" : "new-password"} />
        </div>
        {msg && <p className="text-sm text-destructive">{msg}</p>}
        <button type="submit" disabled={busy}
          className="w-full py-2.5 rounded-md font-semibold text-primary-foreground disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}>
          {busy ? "Please wait…" : mode === "in" ? "Sign In" : "Create Account"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}
          className="w-full text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground mt-6">
        <Link to="/">← Back to converter</Link>
      </p>
    </section>
  );
}
