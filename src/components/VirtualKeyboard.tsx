import { useMemo, useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ArrowLeft, GripHorizontal, X } from "lucide-react";
import { getVowels, getConsonantBlocks, type UnicodeBlock } from "@/lib/sinhala";

const BODY_HEIGHT = 400;

export function VirtualKeyboard({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (ch: string) => void;
}) {
  const [activeBlock, setActiveBlock] = useState<UnicodeBlock | null>(null);
  const dragControls = useDragControls();

  const vowels = useMemo(() => getVowels(), []);
  const consonants = useMemo(() => getConsonantBlocks(), []);

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
      {/* Fixed header with drag + close */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-border/60 select-none touch-none shrink-0"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripHorizontal className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Sinhala Keyboard</span>
        </div>
        <div className="flex items-center gap-2">
          {activeBlock && (
            <button
              onClick={() => setActiveBlock(null)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-accent/30"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-accent/40" aria-label="Close keyboard">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Single scrollable body */}
      <div className="px-4 py-3 overflow-y-auto vk-scroll" style={{ height: BODY_HEIGHT }}>
        <AnimatePresence mode="wait">
          {activeBlock ? (
            <motion.div
              key="sub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-xs text-muted-foreground mb-3">
                Variations of <span className="text-foreground font-medium">{activeBlock.base}</span>
              </p>
              <KeyGrid
                items={activeBlock.variants}
                onPress={(ch) => {
                  onInsert(ch);
                  setActiveBlock(null);
                }}
              />
            </motion.div>
          ) : (
            <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SectionHeader label="Vowels" />
              <KeyGrid items={vowels} onPress={(ch) => onInsert(ch)} />

              <div className="h-4" />
              <SectionHeader label="Consonants" />
              <KeyGrid
                items={consonants.map((b) => b.base)}
                onPress={(_, i) => setActiveBlock(consonants[i])}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-2 sticky top-0 bg-card/95 backdrop-blur-sm py-1 z-10">
      <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
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
    <div
      className="grid gap-1.5 justify-items-center"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))" }}
    >
      {items.map((ch, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="vk-key vk-key-sm"
          onClick={() => onPress(ch, i)}
          type="button"
        >
          {ch}
        </motion.button>
      ))}
    </div>
  );
}
