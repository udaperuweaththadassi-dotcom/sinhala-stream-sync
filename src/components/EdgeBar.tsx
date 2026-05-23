import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Download, KeyRound, HelpCircle, Info, LogIn, LogOut, Moon, Sun, Zap } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";

const items = [
  { to: "/", label: "Converter", icon: Home, exact: true },
  { to: "/download", label: "Desktop App", icon: Download },
  { to: "/license", label: "Get Key", icon: KeyRound },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/about", label: "About", icon: Info },
] as const;

export function EdgeBar() {
  const { theme, setTheme } = useApp();
  const { user, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/m/")) return null;

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <aside
      className="fixed left-3 top-1/2 -translate-y-1/2 z-50 hidden sm:flex flex-col items-center gap-2 p-2 rounded-3xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      style={{
        background: "color-mix(in oklab, var(--card) 55%, transparent)",
        backdropFilter: "blur(22px) saturate(160%)",
        WebkitBackdropFilter: "blur(22px) saturate(160%)",
      }}
    >
      <Link to="/" className="p-2 rounded-2xl">
        <Zap className="w-5 h-5 text-[var(--neon-cyan)] logo-glow" />
      </Link>
      <div className="h-px w-8 bg-white/10 my-1" />

      <LayoutGroup id="edgebar">
        <nav className="flex flex-col gap-1 relative">
          {items.map((it) => {
            const active = isActive(it.to, "exact" in it ? it.exact : false);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} className="group relative">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
                >
                  {active && (
                    <motion.span
                      layoutId="edgebar-active"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in oklab, var(--neon-cyan) 35%, transparent), color-mix(in oklab, var(--neon-purple) 35%, transparent))",
                        boxShadow:
                          "0 0 18px color-mix(in oklab, var(--neon-cyan) 45%, transparent), inset 0 0 0 1px color-mix(in oklab, var(--neon-cyan) 40%, transparent)",
                      }}
                    />
                  )}
                  <Icon
                    className={`relative w-5 h-5 transition ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                </motion.div>
                <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition border border-border bg-card/90 backdrop-blur">
                  {it.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="h-px w-8 bg-white/10 my-1" />

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {user ? (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={signOut}
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground"
          title={user.email ?? "Sign out"}
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      ) : (
        <Link to="/login">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-primary-foreground"
            style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
          >
            <LogIn className="w-5 h-5" />
          </motion.div>
        </Link>
      )}
    </aside>
  );
}

/** Compact bottom dock for mobile (sm:hidden). */
export function EdgeDock() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/m/")) return null;
  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");
  return (
    <div className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <LayoutGroup id="edgedock">
        <div
          className="flex items-center gap-1 p-1.5 rounded-full border border-white/10 shadow-2xl"
          style={{
            background: "color-mix(in oklab, var(--card) 60%, transparent)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
          }}
        >
          {items.map((it) => {
            const active = isActive(it.to, "exact" in it ? it.exact : false);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {active && (
                    <motion.span
                      layoutId="edgedock-active"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in oklab, var(--neon-cyan) 35%, transparent), color-mix(in oklab, var(--neon-purple) 35%, transparent))",
                      }}
                    />
                  )}
                  <Icon className={`relative w-4.5 h-4.5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
