import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AnySpeechRecognition = {
  new (): {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
    onend: () => void;
    onerror: (e: unknown) => void;
    start: () => void;
    stop: () => void;
  };
};

export function MicButton({ onTranscript, lang = "si-LK" }: { onTranscript: (t: string) => void; lang?: string }) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<ReturnType<AnySpeechRecognition["prototype"]["start"]> extends infer _ ? any : never>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: AnySpeechRecognition; webkitSpeechRecognition?: AnySpeechRecognition };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const toggle = () => {
    const w = window as unknown as { SpeechRecognition?: AnySpeechRecognition; webkitSpeechRecognition?: AnySpeechRecognition };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    if (active && recRef.current) { recRef.current.stop(); return; }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      if (t) onTranscript(t);
    };
    rec.onend = () => setActive(false);
    rec.onerror = () => setActive(false);
    rec.start();
    recRef.current = rec;
    setActive(true);
  };

  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Voice typing"
      className={`p-3 rounded-full border border-border bg-card hover:bg-accent/30 transition ${active ? "mic-active" : ""}`}
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
