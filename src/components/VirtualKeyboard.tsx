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

// Fixed body height so the keyboard never resizes between tabs.
const BODY_HEIGHT = 360;

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
      className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2 w-[min(720px,95vw)] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col"
      style={{ boxShadow: "0 0 30px color-mix(in oklab, var(--neon-purple) 35%, transparent)" }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-border/60 select-none touch-none shrink-0"
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
      <div className="flex items-center gap-2 px-4 pt-3 shrink-0">
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

      {/* Body — fixed height, scrollable */}
      <div
        className="px-4 py-3 overflow-y-auto vk-scroll"
        style={{ height: BODY_HEIGHT }}
      >
        <AnimatePresence mode="wait">
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
              <KeyGrid items={activeBlock.variants} onPress={handleSubKey} />
            </motion.div>
          ) : tab === "vowels" ? (
            <motion.div key="vow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KeyGrid items={vowels} onPress={handleKey} />
            </motion.div>
          ) : tab === "consonants" ? (
            <motion.div key="con" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KeyGrid
                items={consonants.map((b) => b.base)}
                onPress={(_, i) => setActiveBlock(consonants[i])}
              />
            </motion.div>
          ) : (
            <motion.div key="emo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KeyGrid items={EMOJIS} onPress={handleKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function KeyGrid({
  items,
  onPress,
}: {
  items: string[];
  onPress: (ch: string, index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {items.map((ch, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="vk-key"
          onClick={() => onPress(ch, i)}
          type="button"
        >
          {ch}
        </motion.button>
      ))}
    </div>
  );
}
