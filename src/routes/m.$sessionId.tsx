import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Zap, Trash2 } from "lucide-react";
import { processConversion } from "@/lib/sinhala";
import { MicButton } from "@/components/MicButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/m/$sessionId")({
  head: () => ({
    meta: [
      { title: "Sintype.lk · Mobile Input" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MobilePage,
});

function MobilePage() {
  const { sessionId } = Route.useParams();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sinhala = processConversion(draft, "unicode");
  const sinhalaRef = useRef(sinhala);
  sinhalaRef.current = sinhala;

  useEffect(() => {
    const ch = supabase.channel(`sintype:${sessionId}`, { config: { broadcast: { self: false } } });
    ch.subscribe((s) => {
      if (s === "SUBSCRIBED") setStatus("live");
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("error");
    });
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [sessionId]);

  // Stream the converted Sinhala straight into the desktop input on every change (debounced).
  useEffect(() => {
    if (status !== "live") return;
    const id = setTimeout(() => {
      channelRef.current?.send({ type: "broadcast", event: "set", payload: { text: sinhalaRef.current } });
    }, 120);
    return () => clearTimeout(id);
  }, [sinhala, status]);

  const sendNow = () => {
    channelRef.current?.send({ type: "broadcast", event: "set", payload: { text: sinhala } });
  };

  const clearBoth = () => {
    setDraft("");
    channelRef.current?.send({ type: "broadcast", event: "set", payload: { text: "" } });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 px-4 py-3 border-b border-border bg-card/80 backdrop-blur flex items-center gap-3">
        <Zap className="w-5 h-5 text-[var(--neon-cyan)] logo-glow" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold tracking-wider neon-text text-lg">Sintype.lk · Mobile</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
            {status === "live" ? "Live · streaming to desktop" : status === "connecting" ? "Connecting…" : "Connection error"}
          </p>
        </div>
        <button onClick={clearBoth} className="p-2 rounded-md border border-border" aria-label="Clear">
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Live preview (desktop is mirroring this)</p>
        <div className="min-h-[40vh] p-4 rounded-xl bg-card border border-border text-lg leading-relaxed whitespace-pre-wrap break-words">
          {sinhala || <span className="text-muted-foreground text-sm">Start typing or speaking below…</span>}
        </div>
      </main>

      <footer className="sticky bottom-0 px-3 py-3 border-t border-border bg-card/90 backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type Singlish or Sinhala…"
            rows={2}
            className="flex-1 min-h-[56px] max-h-40 px-3 py-3 rounded-2xl bg-secondary text-base outline-none resize-none"
          />
          <MicButton onTranscript={(t) => setDraft((d) => (d ? d + " " : "") + t)} />
          <button
            onClick={sendNow}
            className="p-3 rounded-full"
            style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
            aria-label="Push to desktop"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          Each keystroke streams automatically — Send forces an instant push.
        </p>
      </footer>
    </div>
  );
}
