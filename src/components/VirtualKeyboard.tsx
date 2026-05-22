import { useMemo, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ArrowLeft, GripHorizontal, X } from "lucide-react";
import { getVowels, getConsonantBlocks, type UnicodeBlock } from "@/lib/sinhala";

type Tab = "vowels" | "consonants" | "emojis";

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😘","😎","🤩","🥳","😭","😡","🤔","😴","🙏",
  "👍","👎","👏","🙌","💪","🤝","✌️","👌","🫶","❤️","🧡","💛","💚","💙","💜",
  "🔥","✨","🌟","⭐","💯","🎉","🎂","🎁","☀️","🌙","🌈","☕","🍵","🍰","🍕",
  "⚽","🏏","🎵","📱","💻","🚗","✈️","🏠","🇱🇰","🌺","🌸","🪔","🛕","📿","🙇",
];

export function VirtualKeyboard({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (ch: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("vowels");
  const [activeBlock, setActiveBlock] = useState<UnicodeBlock | null>(null);
  const dragControls = useDragControls();

  const vowels = useMemo(() => getVowels(), []);
  const consonants = useMemo(() => getConsonantBlocks(), []);

  // Layout: rows 1–5 × 6 = 30, row 6 = 4, row 7 = 6  → 40 base consonants
  const consonantLayout = useMemo(() => {
    const c = consonants.slice(0, 40);
    const rows: UnicodeBlock[][] = [];
    let i = 0;
    for (let r = 0; r < 5; r++) { rows.push(c.slice(i, i + 6)); i += 6; }
    rows.push(c.slice(i, i + 4)); i += 4;
    rows.push(c.slice(i, i + 6));
    return rows;
  }, [consonants]);

  const handleKey = (ch: string) => onInsert(ch);

  const handleSubKey = (ch: string) => {
    onInsert(ch);
    setActiveBlock(null);
  };

  if (!open) return null;

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2 w-[min(720px,95vw)] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl"
      style={{ boxShadow: "0 0 30px color-mix(in oklab, var(--neon-purple) 35%, transparent)" }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-border/60 select-none touch-none"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripHorizontal className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Sinhala Keyboard</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent/40" aria-label="Close keyboard">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 pt-3">
        {(["vowels", "consonants", "emojis"] as Tab[]).map((t) => (
          <button
            key={t}
            className="vk-tab"
            data-active={tab === t && !activeBlock}
            onClick={() => { setTab(t); setActiveBlock(null); }}
          >
            {t === "vowels" ? "Vowels" : t === "consonants" ? "Consonants" : "Emojis"}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Sub-character view */}
          {tab === "consonants" && activeBlock ? (
            <motion.div
              key="sub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setActiveBlock(null)}
                className="mb-3 flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent/30"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <p className="text-xs text-muted-foreground mb-2">
                Variations of <span className="text-foreground font-medium">{activeBlock.base}</span>
              </p>
              <Grid columns={6}>
                {activeBlock.variants.map((ch, i) => (
                  <Key key={i} ch={ch} onPress={handleSubKey} />
                ))}
              </Grid>
            </motion.div>
          ) : tab === "vowels" ? (
            <motion.div key="vow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Grid columns={6}>
                {vowels.map((ch, i) => <Key key={i} ch={ch} onPress={handleKey} />)}
              </Grid>
            </motion.div>
          ) : tab === "consonants" ? (
            <motion.div key="con" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {consonantLayout.map((row, ri) => (
                <Grid key={ri} columns={row.length}>
                  {row.map((b, i) => (
                    <Key key={i} ch={b.base} onPress={() => setActiveBlock(b)} />
                  ))}
                </Grid>
              ))}
            </motion.div>
          ) : (
            <motion.div key="emo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Grid columns={8}>
                {EMOJIS.map((ch, i) => <Key key={i} ch={ch} onPress={handleKey} />)}
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Grid({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {children}
    </div>
  );
}

function Key({ ch, onPress }: { ch: string; onPress: (ch: string) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="vk-key"
      onClick={() => onPress(ch)}
      type="button"
    >
      {ch}
    </motion.button>
  );
}
