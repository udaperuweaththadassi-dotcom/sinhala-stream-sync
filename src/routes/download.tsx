import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Download, Monitor, Shield, Sparkles, CheckCircle2, Activity } from "lucide-react";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "SinType Desktop for Windows — Download" },
      { name: "description", content: "Download the SinType desktop app for Windows. Type Singlish anywhere, system-wide." },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Desktop</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">SinType for Windows</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          A native, system-wide Singlish input engine for Windows. Type Sinhala in any app — chat, docs, browser — with the same engine you love on the web.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <DownloadCard />
        <LiveStats />
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Feature icon={Sparkles} title="Smart engine" body="Greedy-match converter with custom dictionary, Unicode + Legacy FM." />
        <Feature icon={Shield} title="Private & offline" body="Conversion runs locally. No keystrokes leave your machine." />
        <Feature icon={Monitor} title="System-wide" body="Works in any window — global hotkey toggles Singlish mode." />
      </div>
    </section>
  );
}

function DownloadCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 p-7"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--card) 92%, transparent), color-mix(in oklab, var(--neon-purple) 8%, var(--card)))",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-40"
           style={{ background: "radial-gradient(circle, var(--neon-cyan), transparent 60%)" }} />
      <div className="flex items-start justify-between gap-4 relative">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground">
            <Monitor className="w-3 h-3" /> Windows 10 / 11
          </div>
          <h2 className="font-display text-3xl mt-3">SinType Desktop</h2>
          <p className="text-sm text-muted-foreground mt-1">v1.0 · 18 MB · Stable channel</p>
        </div>
      </div>

      <motion.a
        href="#"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative mt-6 inline-flex items-center gap-3 px-6 py-4 rounded-2xl text-primary-foreground font-semibold shadow-xl"
        style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
      >
        <Download className="w-5 h-5" />
        Download for Windows
        <span className="text-xs font-normal opacity-80">.exe · 18 MB</span>
      </motion.a>

      <div className="mt-7 relative">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Release notes — v1.0</p>
        <ul className="space-y-2 text-sm">
          {[
            "First public Windows release",
            "System-wide Singlish input via global hotkey (Ctrl + Space)",
            "Unicode + Legacy FM font output modes",
            "7-day activation key support via sintype.lk",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[var(--neon-cyan)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function LiveStats() {
  const [downloads, setDownloads] = useState(12847);
  const [active, setActive] = useState(238);

  useEffect(() => {
    const id = setInterval(() => {
      setDownloads((d) => d + Math.floor(Math.random() * 3));
      setActive((a) => Math.max(180, a + (Math.random() > 0.5 ? 1 : -1)));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl border border-white/10 p-6 flex flex-col"
      style={{
        background: "color-mix(in oklab, var(--card) 80%, transparent)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Activity className="w-3 h-3 text-[var(--neon-cyan)] animate-pulse" /> Live
      </div>
      <h3 className="font-display text-xl mt-2">Usage right now</h3>

      <div className="mt-6 space-y-5">
        <Stat label="Total downloads" value={downloads.toLocaleString()} />
        <Stat label="Active users (5 min)" value={active.toLocaleString()} />
        <Stat label="Avg. session" value="14m 22s" />
      </div>

      <div className="mt-auto pt-6 text-xs text-muted-foreground">
        Trusted by typists across Sri Lanka and the diaspora.
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.4, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl mt-1"
      >
        {value}
      </motion.p>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Sparkles; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5"
         style={{ background: "color-mix(in oklab, var(--card) 70%, transparent)", backdropFilter: "blur(12px)" }}>
      <Icon className="w-5 h-5 text-[var(--neon-cyan)]" />
      <h4 className="font-display mt-3">{title}</h4>
      <p className="text-sm text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
