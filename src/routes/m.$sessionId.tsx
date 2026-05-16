import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Pencil, Zap } from "lucide-react";
import { processConversion } from "@/lib/sinhala";
import { MicButton } from "@/components/MicButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/m/$sessionId")({
  head: () => ({
    meta: [
      { title: "Sintype.lk Mobile Sync" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
    ],
  }),
  component: MobilePage,
});

interface Msg { id: string; text: string; }

function MobilePage() {
  const { sessionId } = Route.useParams();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const ch = supabase.channel(`sintype:${sessionId}`, { config: { broadcast: { self: false } } });
    ch.subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [sessionId]);

  const sinhala = processConversion(draft, "unicode");

  const send = () => {
    if (!sinhala.trim()) return;
    if (editingId) {
      setMessages((m) => m.map((x) => (x.id === editingId ? { ...x, text: sinhala } : x)));
      setEditingId(null);
    } else {
      setMessages((m) => [...m, { id: crypto.randomUUID(), text: sinhala }]);
    }
    channelRef.current?.send({ type: "broadcast", event: "msg", payload: { text: sinhala } });
    setDraft("");
  };

  const startEdit = (m: Msg) => {
    setDraft(m.text);
    setEditingId(m.id);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 px-4 py-3 border-b border-border bg-card/80 backdrop-blur flex items-center gap-3">
        <Zap className="w-5 h-5 text-[var(--neon-cyan)] logo-glow" />
        <div className="flex-1">
          <h1 className="font-display font-bold tracking-wider neon-text text-lg">Sintype.lk Mobile Sync</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Session · {sessionId}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-10">Send your first message — it lands on the desktop instantly.</p>
        )}
        {messages.map((m) => (
          <button
            key={m.id}
            onClick={() => startEdit(m)}
            className="block ml-auto max-w-[80%] text-left p-3 rounded-2xl rounded-tr-sm bubble-out"
          >
            <p className="text-base leading-snug break-words">{m.text}</p>
            <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Pencil className="w-3 h-3" /> tap to edit</span>
          </button>
        ))}
      </main>

      <footer className="sticky bottom-0 px-3 py-3 border-t border-border bg-card/90 backdrop-blur">
        {draft && (
          <div className="mb-2 text-xs text-muted-foreground">
            Preview: <span className="text-foreground">{sinhala}</span>
            {editingId && <span className="ml-2 text-[var(--neon-cyan)]">editing…</span>}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type Singlish or Sinhala…"
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 px-3 py-3 rounded-2xl bg-secondary text-base outline-none resize-none"
          />
          <MicButton onTranscript={(t) => setDraft((d) => (d ? d + " " : "") + t)} />
          <button
            onClick={send}
            className="p-3 rounded-full"
            style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
            aria-label="Send"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </footer>
    </div>
  );
}
