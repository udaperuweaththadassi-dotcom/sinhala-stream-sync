import { useEffect, useMemo, useRef, useState } from "react";
import { Clipboard, Copy, Eraser, Keyboard as KeyboardIcon, Radio } from "lucide-react";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { SmartLearningEngine } from "@/lib/smartEngine";
import { findSpellIssues, processConversion } from "@/lib/sinhala";
import { useApp, pushHistory } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { MicButton } from "./MicButton";
import { HistoryPanel } from "./HistoryPanel";
import { AccountPanel } from "./AccountPanel";
import { supabase } from "@/integrations/supabase/client";

export function Converter() {
  // ටයිප් කරද්දී වෙනස්කම් බලාගන්නා SmartEngine එක (Local + Cloud Learning)
  const smartEngine = useRef(new SmartLearningEngine()).current;

  const { mode } = useApp();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [linked, setLinked] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const output = useMemo(() => processConversion(input, mode), [input, mode]);
  const unicodePreview = useMemo(() => processConversion(input, "unicode"), [input]);
  const issues = useMemo(() => findSpellIssues(unicodePreview), [unicodePreview]);

  // ටයිප් කරද්දී වෙනස්කම් බලාගන්නා Function එක
  const handleTyping = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.target.value;
    setInput(inputValue); // State එක අපඩේට් කරනවා

    // 1. ක්ෂණිකව අපේ Local Engine එකෙන් පට්ට Speed එකට Convert කරලා පෙන්වනවා (Offline Safe)
    const localResult = smartEngine.convert(inputValue);
    // localResult දැනටින් output state එක හරහා render වෙනවා

    // 2. [DEBOUNCE] යූසර් ටයිප් කරලා මිලි තත්පර 500ක් නැවතුණ ගමන් API එකෙන් ඉගෙන ගන්නවා
    // මේකෙන් සර්වර් එකට අනවශ්���ය රික්වෙස්ට් යාම වළක්වනවා
    window.clearTimeout((window as any).typingTimeout);
    (window as any).typingTimeout = window.setTimeout(() => {
      smartEngine.learnFromAPI(inputValue);
    }, 500);
  };

  // Push to history (debounced)
  useEffect(() => {
    if (!input.trim()) return;
    const id = setTimeout(() => pushHistory({ input, output }), 1200);
    return () => clearTimeout(id);
  }, [input, output]);

  // Real-time link: when signed in, listen for messages from this user's phone
  // and stream the text directly into the input box.
  useEffect(() => {
    if (!user) { setLinked(false); return; }
    const ch = supabase.channel(`sintype:${user.id}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "set" }, (payload) => {
      const text = (payload.payload as { text?: string }).text ?? "";
      setInput(text);
    }).on("broadcast", { event: "append" }, (payload) => {
      const text = (payload.payload as { text?: string }).text ?? "";
      if (text) setInput((prev) => (prev ? prev + " " : "") + text);
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") setLinked(true);
    });
    channelRef.current = ch;
    return () => { ch.unsubscribe(); setLinked(false); };
  }, [user]);

  const renderOutput = () => {
    if (mode === "legacy" || issues.length === 0) return output;
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
    <section className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <AccountPanel />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Mode</p>
            <p className="font-display text-lg">{mode === "unicode" ? "Unicode (Modern)" : "Legacy FM Font"}</p>
          </div>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2">
          <HistoryPanel onRestore={(t) => setInput(t)} />
          {linked && (
            <span className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-[var(--neon-cyan)] text-[var(--neon-cyan)]">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Phone linked
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
                onClick={async () => { try { setInput(input + (await navigator.clipboard.readText())); } catch { /* noop */ } }}
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
            onChange={handleTyping}
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
          <div className={`w-full h-64 overflow-y-auto text-xl leading-relaxed whitespace-pre-wrap break-words ${mode === "legacy" ? "font-fm-legacy" : ""}`}>
            {input ? renderOutput() : <span className="text-muted-foreground text-base">Output appears here in real time…</span>}
          </div>
          {issues.length > 0 && mode === "unicode" && (
            <p className="mt-2 text-xs text-destructive">
              {issues.length} spelling issue{issues.length > 1 ? "s" : ""} — hover the underlined words for suggestions.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setKbOpen((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--neon-cyan)] text-sm hover:bg-accent/30 transition"
          style={{ boxShadow: kbOpen ? "0 0 18px color-mix(in oklab, var(--neon-cyan) 60%, transparent)" : undefined }}
        >
          <KeyboardIcon className="w-4 h-4" />
          {kbOpen ? "Hide Keyboard" : "Show Sinhala Keyboard"}
        </button>
      </div>

      <VirtualKeyboard
        open={kbOpen}
        onClose={() => setKbOpen(false)}
        onInsert={(ch) => setInput((prev) => prev + ch)}
      />
    </section>
  );
}

function ModeToggle() {
  const { mode, setMode } = useApp();
  return (
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
  );
}
