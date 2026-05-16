import { useEffect, useMemo, useRef, useState } from "react";
import { Clipboard, Copy, Eraser, Radio } from "lucide-react";
import { findSpellIssues, processConversion } from "@/lib/sinhala";
import { useApp, pushHistory } from "@/lib/app-context";
import { MicButton } from "./MicButton";
import { HistoryPanel } from "./HistoryPanel";
import { supabase } from "@/integrations/supabase/client";

export function Converter() {
  const { mode } = useApp();
  const [input, setInput] = useState("");
  const [liveBoard, setLiveBoard] = useState<string[]>([]);
  const [syncOn, setSyncOn] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const output = useMemo(() => processConversion(input, mode), [input, mode]);
  const unicodePreview = useMemo(() => processConversion(input, "unicode"), [input]);
  const issues = useMemo(() => findSpellIssues(unicodePreview), [unicodePreview]);

  // Push to history (debounced)
  useEffect(() => {
    if (!input.trim()) return;
    const id = setTimeout(() => pushHistory({ input, output }), 1200);
    return () => clearTimeout(id);
  }, [input, output]);

  // Realtime board listener — attach when a session is stored from /sync
  useEffect(() => {
    const id = localStorage.getItem("sintype.session");
    if (!id) return;
    setSessionId(id);
    setSyncOn(true);
    const ch = supabase.channel(`sintype:${id}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "msg" }, (payload) => {
      const text = (payload.payload as { text?: string }).text ?? "";
      if (text) setLiveBoard((b) => [text, ...b].slice(0, 30));
    }).subscribe();
    channelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, []);

  const disconnect = () => {
    if (channelRef.current) channelRef.current.unsubscribe();
    localStorage.removeItem("sintype.session");
    setSyncOn(false);
    setSessionId(null);
    setLiveBoard([]);
  };

  const renderOutput = () => {
    if (mode === "legacy" || issues.length === 0) return output;
    // highlight spell issues on the unicode output
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const iss of issues) {
      if (iss.start > cursor) parts.push(unicodePreview.slice(cursor, iss.start));
      parts.push(
        <span key={iss.start} className="spell-error" title={`Suggested: ${iss.suggestion}`}>{iss.word}</span>
      );
      cursor = iss.end;
    }
    if (cursor < unicodePreview.length) parts.push(unicodePreview.slice(cursor));
    return parts;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Mode</p>
          <p className="font-display text-lg">{mode === "unicode" ? "Unicode (Modern)" : "Legacy FM Font"}</p>
        </div>
        <div className="flex items-center gap-2">
          <HistoryPanel onRestore={(t) => setInput(t)} />
          {syncOn && (
            <span className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-[var(--neon-cyan)] text-[var(--neon-cyan)]">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live · {sessionId?.slice(0, 6)}
              <button onClick={disconnect} className="ml-2 underline">disconnect</button>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUT */}
        <div className="neon-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">Singlish Input</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => { try { setInput(input + (await navigator.clipboard.readText())); } catch {} }}
                className="p-2 rounded-md border border-border hover:bg-accent/30" title="Paste"
              ><Clipboard className="w-4 h-4" /></button>
              <button onClick={() => setInput("")} className="p-2 rounded-md border border-border hover:bg-accent/30" title="Clear">
                <Eraser className="w-4 h-4" />
              </button>
              <MicButton onTranscript={(t) => setInput((prev) => (prev ? prev + " " : "") + t)} />
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type like: ammaa, mama gedara yanavaa…"
            className="w-full h-64 resize-none bg-transparent outline-none font-mono text-base placeholder:text-muted-foreground/60"
          />
          <p className="mt-2 text-xs text-muted-foreground">Tip: <code>aa</code> → ආ · <code>th</code> → ථ · <code>sh</code> → ශ</p>
        </div>

        {/* OUTPUT */}
        <div className="neon-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground">Live Output</h2>
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border hover:bg-accent/30"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <div className="w-full h-64 overflow-y-auto text-xl leading-relaxed whitespace-pre-wrap break-words">
            {input ? renderOutput() : <span className="text-muted-foreground text-base">Output appears here in real time…</span>}
          </div>
          {issues.length > 0 && mode === "unicode" && (
            <p className="mt-2 text-xs text-destructive">
              {issues.length} spelling issue{issues.length > 1 ? "s" : ""} — hover the underlined words for suggestions.
            </p>
          )}
        </div>
      </div>

      {/* Live board */}
      {syncOn && (
        <div className="mt-8 neon-border p-5">
          <h2 className="font-display text-sm tracking-widest uppercase text-muted-foreground mb-3">Live Board · Mobile feed</h2>
          {liveBoard.length === 0 ? (
            <p className="text-muted-foreground text-sm">Waiting for messages from your phone…</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {liveBoard.map((m, i) => (
                <li key={i} className="p-3 rounded-md bg-secondary/40 border border-border">{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
