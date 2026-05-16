import { useEffect, useState } from "react";
import { History, Trash2, X } from "lucide-react";
import { clearHistory, loadHistory, type HistoryItem } from "@/lib/app-context";

export function HistoryPanel({ onRestore }: { onRestore: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(loadHistory());
    sync();
    window.addEventListener("sintype.history.update", sync);
    return () => window.removeEventListener("sintype.history.update", sync);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-accent/30 transition"
      >
        <History className="w-4 h-4" /> Recent
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm h-full bg-card border-l border-border p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg neon-text">Recent Conversions</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-accent/30"><X className="w-4 h-4" /></button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet. Start typing to build your record.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it.id}>
                    <button
                      onClick={() => { onRestore(it.input); setOpen(false); }}
                      className="w-full text-left p-3 rounded-md border border-border hover:border-[var(--neon-cyan)] hover:bg-accent/20 transition"
                    >
                      <div className="text-xs text-muted-foreground font-mono truncate">{it.input}</div>
                      <div className="text-sm mt-1 truncate">{it.output}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {items.length > 0 && (
              <button
                onClick={clearHistory}
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm py-2 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" /> Clear history
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
