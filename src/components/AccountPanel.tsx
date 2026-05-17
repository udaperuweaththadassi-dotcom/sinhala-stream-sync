import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { Copy, Check, LogIn, LogOut, Smartphone, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AccountPanel() {
  const { user, signOut, loading } = useAuth();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const url = user && origin ? `${origin}/m/${user.id}` : "";

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 180,
      margin: 1,
      color: { dark: "#22d3ee", light: "#00000000" },
    }).catch(() => {});
  }, [url]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="neon-border p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserIcon className="w-5 h-5 text-[var(--neon-cyan)]" />
          <div>
            <p className="font-display text-sm tracking-widest uppercase text-muted-foreground">Mobile Sync</p>
            <p className="text-sm">Sign in to pair your phone via QR code.</p>
          </div>
        </div>
        <Link to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-primary-foreground"
          style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}>
          <LogIn className="w-4 h-4" /> Sign in
        </Link>
      </div>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="neon-border p-5">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="p-3 rounded-xl bg-background border border-border shrink-0 mx-auto md:mx-0">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex-1 w-full">
          <p className="font-display text-sm tracking-widest uppercase text-muted-foreground">Your account</p>
          <p className="text-base mt-0.5 truncate">{user.email}</p>

          <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">Unique ID</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-xs font-mono px-3 py-2 rounded-md bg-secondary truncate">{user.id}</code>
            <button onClick={copy} className="p-2 rounded-md border border-border hover:bg-accent/30" title="Copy ID">
              {copied ? <Check className="w-4 h-4 text-[var(--neon-cyan)]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />
            Scan the QR with your phone — text you type there will stream directly into the input box below.
          </p>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={signOut}
              className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-border hover:bg-accent/30">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
