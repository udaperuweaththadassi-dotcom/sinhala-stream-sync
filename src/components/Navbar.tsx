import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Moon, Sun, Zap } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { theme, setTheme, mode, setMode } = useApp();
  const { user, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isMobileRoute = path.startsWith("/m/");
  if (isMobileRoute) return null;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-[var(--neon-cyan)] logo-glow" />
          <span className="font-display text-lg sm:text-xl font-bold tracking-wider neon-text">
            Sintype.lk
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          <Link to="/" activeOptions={{ exact: true }} className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>Converter</Link>
          <Link to="/faq" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>FAQ</Link>
          <Link to="/about" className="hover:text-foreground transition">About</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode toggle */}
          <label className="hidden sm:flex items-center gap-2 text-xs sm:text-sm select-none">
            <div
              role="switch"
              aria-checked={mode === "legacy"}
              tabIndex={0}
              onClick={() => setMode(mode === "unicode" ? "legacy" : "unicode")}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setMode(mode === "unicode" ? "legacy" : "unicode")}
              className="relative cursor-pointer rounded-full border border-border bg-secondary px-1 py-1 flex items-center w-[150px]"
            >
              <span
                className="absolute top-1 bottom-1 w-[71px] rounded-full transition-all"
                style={{
                  left: mode === "unicode" ? 4 : 75,
                  background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))",
                  boxShadow: "0 0 12px color-mix(in oklab, var(--neon-cyan) 50%, transparent)",
                }}
              />
              <span className={`relative z-10 w-[71px] text-center text-[11px] font-semibold ${mode === "unicode" ? "text-primary-foreground" : "text-muted-foreground"}`}>Unicode</span>
              <span className={`relative z-10 w-[71px] text-center text-[11px] font-semibold ${mode === "legacy" ? "text-primary-foreground" : "text-muted-foreground"}`}>Legacy</span>
            </div>
          </label>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md border border-border hover:bg-accent/30 transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <button onClick={signOut}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-accent/30"
              title={user.email ?? "Sign out"}>
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <Link to="/login"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md font-semibold text-primary-foreground"
              style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}>
              <LogIn className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
