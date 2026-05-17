import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Result shape we read from the recognizer (kept loose for cross-browser compatibility).
type SRResult = { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> };
type SRInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  onresult: (e: SRResult) => void;
  onend: () => void;
  onerror: (e: unknown) => void;
  onstart?: () => void;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};
type SRCtor = { new (): SRInstance };

function getSR(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function MicButton({ onTranscript, lang = "si-LK" }: { onTranscript: (t: string) => void; lang?: string }) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SRInstance | null>(null);
  const wantActiveRef = useRef(false);   // user intent — keep restarting on iOS
  const lastFinalRef = useRef("");

  useEffect(() => { if (!getSR()) setSupported(false); }, []);

  // Detect iOS / Safari — they only support short, non-continuous sessions reliably.
  const isIOS = typeof navigator !== "undefined" &&
    (/iP(hone|ad|od)/.test(navigator.userAgent) ||
      (/Mac/.test(navigator.platform) && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1));

  const buildRec = (): SRInstance | null => {
    const SR = getSR();
    if (!SR) return null;
    const rec = new SR();
    rec.lang = lang;
    // iOS Safari ignores/breaks `continuous`; force false and restart manually onend.
    rec.continuous = !isIOS;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const transcript = res[0]?.transcript ?? "";
        if ((res as { isFinal?: boolean }).isFinal) finalText += transcript;
      }
      finalText = finalText.trim();
      if (finalText && finalText !== lastFinalRef.current) {
        lastFinalRef.current = finalText;
        onTranscript(finalText);
      }
    };
    rec.onend = () => {
      // Auto-restart while the user still wants to listen (essential on iOS).
      if (wantActiveRef.current) {
        try { rec.start(); return; } catch { /* fallthrough */ }
      }
      setActive(false);
    };
    rec.onerror = (err) => {
      const name = (err as { error?: string })?.error;
      if (name === "no-speech" || name === "aborted") return; // benign on iOS
      wantActiveRef.current = false;
      setActive(false);
    };
    return rec;
  };

  const start = async () => {
    const SR = getSR();
    if (!SR) return;
    // Prime mic permission via getUserMedia first — iOS/Safari is much more reliable this way.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch { /* user denied — let recognizer surface the real error */ }

    const rec = buildRec();
    if (!rec) return;
    recRef.current = rec;
    lastFinalRef.current = "";
    wantActiveRef.current = true;
    try { rec.start(); setActive(true); } catch { wantActiveRef.current = false; }
  };

  const stop = () => {
    wantActiveRef.current = false;
    try { recRef.current?.stop(); } catch { /* noop */ }
    setActive(false);
  };

  const toggle = () => { active ? stop() : start(); };

  useEffect(() => () => { wantActiveRef.current = false; try { recRef.current?.abort?.(); } catch { /* noop */ } }, []);

  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? "Stop voice typing" : "Start voice typing"}
      aria-pressed={active}
      className={`p-3 rounded-full border border-border bg-card hover:bg-accent/30 transition ${active ? "mic-active" : ""}`}
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
