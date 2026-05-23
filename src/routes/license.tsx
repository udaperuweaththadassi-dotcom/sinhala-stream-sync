import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Loader2, Copy, Check, KeyRound, ArrowRight, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/license")({
  head: () => ({
    meta: [
      { title: "Get a 7-day Activation Key — SinType.lk" },
      { name: "description", content: "Share SinType on WhatsApp or Facebook and unlock a free 7-day activation key for the desktop app." },
    ],
  }),
  component: LicenseHub,
});

type Step = "share" | "verifying" | "key";
const COOLDOWN_MS = 1000 * 60 * 60 * 6; // 6h per browser
const STORAGE_KEY = "sintype.ad_key";
const COOLDOWN_KEY = "sintype.ad_key.cooldown_until";

interface StoredKey {
  key: string;
  created_at: number;
  expires_at: number;
}

function genKey() {
  const seg = () => {
    const bytes = new Uint8Array(2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  return `STKR-${seg()}-${seg()}-${seg()}`;
}

function LicenseHub() {
  const [step, setStep] = useState<Step>("share");
  const [shareDone, setShareDone] = useState(false);
  const [stored, setStored] = useState<StoredKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const k = JSON.parse(raw) as StoredKey;
        if (k.expires_at > Date.now()) {
          setStored(k);
          setStep("key");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      const cd = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
      if (cd > Date.now()) setCooldownUntil(cd);
    } catch { /* noop */ }
  }, []);

  const onShare = (network: "whatsapp" | "facebook") => {
    const url = "https://sintype.lk";
    const text = "I just found SinType.lk — Singlish to Sinhala converter. Try it!";
    const target =
      network === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`
        : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(target, "_blank", "noopener,noreferrer,width=720,height=620");
    setShareDone(true);
  };

  const generate = async () => {
    if (cooldownUntil > Date.now()) {
      setError("Please wait before generating another key from this browser.");
      return;
    }
    setError(null);
    setStep("verifying");
    const created = Date.now();
    const expires = created + 7 * 24 * 60 * 60 * 1000;
    const key = genKey();

    // Simulated verification delay
    await new Promise((r) => setTimeout(r, 1600));

    try {
      const { error: dbErr } = await supabase.from("licenses").insert({
        is_ad_key: true,
        is_active: true,
        key_code: key,
        license_key: key,
        expires_at: new Date(expires).toISOString(),
        expiry_date: new Date(expires).toISOString(),
      });
      if (dbErr) throw dbErr;
    } catch (e: unknown) {
      setError((e as Error).message ?? "Could not save your key. Try again.");
      setStep("share");
      return;
    }

    const record: StoredKey = { key, created_at: created, expires_at: expires };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    const nextCd = Date.now() + COOLDOWN_MS;
    localStorage.setItem(COOLDOWN_KEY, String(nextCd));
    setCooldownUntil(nextCd);
    setStored(record);
    setStep("key");
  };

  return (
    <section className="max-w-5xl mx-auto px-6 pt-14 pb-24">
      <header className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">License</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Activation Hub</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Share SinType with a friend and unlock a free 7-day activation key for the Windows app.
        </p>
      </header>

      <Stepper step={step} />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {step === "share" && (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <ShareCard
                onShare={onShare}
                shareDone={shareDone}
                onContinue={generate}
                error={error}
                cooldownUntil={cooldownUntil}
              />
            </motion.div>
          )}
          {step === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl border border-white/10 p-12 text-center"
              style={{ background: "color-mix(in oklab, var(--card) 80%, transparent)", backdropFilter: "blur(18px)" }}
            >
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--neon-cyan)]" />
              <p className="mt-4 font-display text-xl">Verifying share & forging your key…</p>
              <p className="text-sm text-muted-foreground mt-1">Signing with secure entropy</p>
            </motion.div>
          )}
          {step === "key" && stored && (
            <motion.div
              key="key"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              <KeyCard stored={stored} onReset={() => { setStored(null); setShareDone(false); setStep("share"); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { id: "share", label: "Share" },
    { id: "verifying", label: "Verify" },
    { id: "key", label: "Your Key" },
  ] as const;
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
            i <= idx ? "border-transparent text-primary-foreground" : "border-border text-muted-foreground"
          }`}
            style={i <= idx ? { background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" } : undefined}>
            {i + 1}
          </div>
          <span className={`text-sm ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
          {i < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

function ShareCard({
  onShare, shareDone, onContinue, error, cooldownUntil,
}: {
  onShare: (n: "whatsapp" | "facebook") => void;
  shareDone: boolean;
  onContinue: () => void;
  error: string | null;
  cooldownUntil: number;
}) {
  const cdLeft = Math.max(0, cooldownUntil - Date.now());
  const cdHrs = Math.ceil(cdLeft / (1000 * 60 * 60));
  return (
    <div className="rounded-3xl border border-white/10 p-8"
         style={{ background: "color-mix(in oklab, var(--card) 85%, transparent)", backdropFilter: "blur(18px)" }}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <Sparkles className="w-3 h-3 text-[var(--neon-cyan)]" /> Step 1 · Share
      </div>
      <h2 className="font-display text-2xl mt-2">Share SinType to unlock</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-lg">
        Pick one platform. After sharing, the unlock button below will activate and forge your 7-day key.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onShare("whatsapp")}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
        >
          <Share2 className="w-4 h-4" /> Share on WhatsApp
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onShare("facebook")}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
          style={{ background: "linear-gradient(135deg, #1877F2, #0a4cc4)" }}
        >
          <Share2 className="w-4 h-4" /> Share on Facebook
        </motion.button>
      </div>

      <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {shareDone ? "Nice — share window opened. Tap below to claim." : "Awaiting share…"}
        </p>
        <motion.button
          whileHover={shareDone && cdLeft === 0 ? { scale: 1.03 } : undefined}
          whileTap={shareDone && cdLeft === 0 ? { scale: 0.97 } : undefined}
          onClick={onContinue}
          disabled={!shareDone || cdLeft > 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-primary-foreground disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
        >
          <KeyRound className="w-4 h-4" /> Generate my key
        </motion.button>
      </div>

      {cdLeft > 0 && (
        <p className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Cooldown active — try again in ~{cdHrs}h from this browser.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function KeyCard({ stored, onReset }: { stored: StoredKey; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const totalMs = stored.expires_at - stored.created_at;
  const leftMs = Math.max(0, stored.expires_at - Date.now());
  const daysLeft = Math.max(0, Math.ceil(leftMs / (1000 * 60 * 60 * 24)));
  const progress = leftMs / totalMs;

  const r = 56;
  const c = 2 * Math.PI * r;
  const dash = c * progress;

  const copy = async () => {
    await navigator.clipboard.writeText(stored.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-3xl border border-white/10 p-8 grid lg:grid-cols-[auto_1fr] gap-8 items-center"
         style={{ background: "color-mix(in oklab, var(--card) 85%, transparent)", backdropFilter: "blur(20px)" }}>
      <div className="relative w-[140px] h-[140px] grid place-items-center justify-self-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="70" cy="70" r={r} stroke="url(#kg)" strokeWidth="6" fill="none"
            strokeLinecap="round" strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - dash }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="kg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--neon-cyan)" />
              <stop offset="100%" stopColor="var(--neon-purple)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl">{daysLeft}</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Days left</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <KeyRound className="w-3 h-3 text-[var(--neon-cyan)]" /> Your activation key
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 p-1 pl-4">
          <code className="flex-1 font-mono text-base sm:text-lg tracking-[0.18em] truncate">{stored.key}</code>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-primary-foreground text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </motion.button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Paste this key inside the <strong className="text-foreground">SinType Desktop App</strong> to unlock access.
        </p>
        <button onClick={onReset} className="mt-4 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
          Start over
        </button>
      </div>
    </div>
  );
}
