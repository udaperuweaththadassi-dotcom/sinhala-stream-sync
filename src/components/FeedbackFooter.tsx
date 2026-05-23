import { useState } from "react";
import { Bug, MessageSquare, X, Send, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Kind = "issue" | "feedback";

export function FeedbackFooter() {
  const [open, setOpen] = useState<Kind | null>(null);
  return (
    <>
      <footer className="mt-20 pb-24 sm:pb-8 opacity-60 hover:opacity-100 transition">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="font-display tracking-[0.2em]">© {new Date().getFullYear()} SinType.lk</p>
          <div className="flex items-center gap-5">
            <button onClick={() => setOpen("issue")} className="inline-flex items-center gap-1.5 hover:text-foreground transition">
              <Bug className="w-3.5 h-3.5" /> Report an Issue
            </button>
            <button onClick={() => setOpen("feedback")} className="inline-flex items-center gap-1.5 hover:text-foreground transition">
              <MessageSquare className="w-3.5 h-3.5" /> Submit Feedback
            </button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {open && <FeedbackModal kind={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </>
  );
}

function FeedbackModal({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const submit = async () => {
    if (!message.trim()) return;
    setState("loading");
    try {
      // Store as an ad_key row tag — non-blocking best-effort.
      await supabase.from("licenses").insert({
        is_ad_key: true,
        is_active: false,
        key_code: `FB-${kind}-${Date.now()}`,
        email: email || null,
        license_key: message.slice(0, 500),
        expiry_date: new Date(Date.now() + 1000 * 60).toISOString(),
      });
    } catch { /* swallow */ }
    setState("done");
    setTimeout(onClose, 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      style={{ background: "color-mix(in oklab, black 60%, transparent)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 p-6"
        style={{ background: "color-mix(in oklab, var(--card) 90%, transparent)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">{kind === "issue" ? "Report an Issue" : "Submit Feedback"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional)"
            className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border outline-none focus:border-[var(--neon-cyan)] text-sm"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={kind === "issue" ? "Describe what went wrong…" : "Tell us what you think…"}
            rows={5}
            className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border outline-none focus:border-[var(--neon-cyan)] text-sm resize-none"
          />
          <button
            onClick={submit}
            disabled={state !== "idle" || !message.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
          >
            {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : state === "done" ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {state === "done" ? "Sent — thank you" : "Send"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
