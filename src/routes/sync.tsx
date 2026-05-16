import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "Mobile Sync · Sintype.lk" },
      { name: "description", content: "Pair your phone with Sintype.lk via QR code to send Sinhala text from mobile to desktop in real time." },
    ],
    links: [{ rel: "canonical", href: "/sync" }],
  }),
  component: SyncPage,
});

function SyncPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let id = localStorage.getItem("sintype.session");
    if (!id) {
      id = crypto.randomUUID().slice(0, 8);
      localStorage.setItem("sintype.session", id);
    }
    setSessionId(id);
    setOrigin(window.location.origin);
  }, []);

  const url = origin && sessionId ? `${origin}/m/${sessionId}` : "";

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 260,
      margin: 1,
      color: { dark: "#22d3ee", light: "#00000000" },
    }).catch(() => {});
  }, [url]);

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-5xl font-bold neon-text">Mobile Sync</h1>
        <p className="mt-3 text-muted-foreground">Scan the code with your phone to start sending text to this desktop Live Board.</p>
      </header>

      <div className="neon-border p-8 flex flex-col items-center gap-6">
        <div className="p-4 rounded-xl bg-background border border-border">
          <canvas ref={canvasRef} />
        </div>
        <div className="w-full text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Session ID</p>
          <p className="font-mono text-2xl mt-1">{sessionId}</p>
        </div>
        <div className="flex items-center gap-2 w-full">
          <input value={url} readOnly className="flex-1 px-3 py-2 rounded-md bg-secondary text-sm font-mono" />
          <button
            onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="px-3 py-2 rounded-md border border-border hover:bg-accent/30 flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-[var(--neon-cyan)]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <a href="/" className="inline-flex items-center gap-2 text-sm text-[var(--neon-cyan)] hover:underline">
          <Smartphone className="w-4 h-4" /> Open Live Board on the Converter page
        </a>
      </div>

      <div className="mt-8 text-sm text-muted-foreground space-y-2">
        <p>1. Open this page on your laptop.</p>
        <p>2. Scan the QR with your phone camera.</p>
        <p>3. Type or speak Sinhala on your phone — it appears instantly on the desktop board.</p>
      </div>
    </section>
  );
}
