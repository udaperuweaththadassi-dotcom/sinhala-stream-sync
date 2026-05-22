// Singlish → Sinhala (Unicode / Legacy FM) conversion engine.
//
// The dictionary is parsed from `singlish_dict.txt` at module load.
// Each block in that file has the shape:
//
//   N.start  trig1 trig2 trig3 ...
//   <unicode1> <unicode2> <unicode3> ...
//   <legacy1>  <legacy2>  <legacy3>  ... end
//
// We build two maps:
//   trigger → unicode    (used in Unicode mode)
//   trigger → legacy     (used in Legacy / FM mode)
//
// Conversion uses a left-to-right greedy longest-match scan.

// Vite raw import — file lives next to this module.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ?raw asset import
import DICT_RAW from "./singlish_dict.txt?raw";

export type ConversionMode = "unicode" | "legacy";

// ─── Parser ────────────────────────────────────────────────────────────────

interface ParsedDict {
  // Singlish → Unicode (used in Unicode mode)
  unicode: Map<string, string>;
  // Singlish → Legacy AND Unicode → Legacy (used in Legacy mode, merged)
  legacy: Map<string, string>;
  // Unicode → Legacy only (kept separate for clarity / future use)
  unicodeToLegacy: Map<string, string>;
  maxKeyLenUnicode: number;
  maxKeyLenLegacy: number;
}

function parseDict(src: string): ParsedDict {
  const unicode = new Map<string, string>();
  const legacy = new Map<string, string>();
  const unicodeToLegacy = new Map<string, string>();

  const rawLines = src.replace(/\r\n?/g, "\n").split("\n");
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    const startIdx = header.indexOf(".start");
    if (startIdx === -1) continue;

    const triggerLine = header.slice(startIdx + ".start".length).trim();
    const triggers = triggerLine.split(/\s+/).filter(Boolean);

    const uniLine = lines[i + 1] ?? "";
    let legLine = lines[i + 2] ?? "";
    legLine = legLine.replace(/\s+end\s*$/i, "").trim();

    const unis = uniLine.split(/\s+/).filter(Boolean);
    const legs = legLine.split(/\s+/).filter(Boolean);

    const n = Math.min(triggers.length, unis.length, legs.length);
    for (let k = 0; k < n; k++) {
      const t = triggers[k];
      const u = unis[k];
      const l = legs[k];
      // Dict A: Singlish → Unicode / Legacy (first occurrence wins)
      if (!unicode.has(t)) unicode.set(t, u);
      if (!legacy.has(t)) legacy.set(t, l);
      // Dict B: Unicode → Legacy
      if (u && !unicodeToLegacy.has(u)) unicodeToLegacy.set(u, l);
    }

    i += 2;
  }

  // Merge Dict B into the legacy lookup so the greedy engine can resolve
  // either Singlish OR raw Unicode in a single pass.
  for (const [u, l] of unicodeToLegacy) {
    if (!legacy.has(u)) legacy.set(u, l);
  }

  let maxKeyLenUnicode = 1;
  for (const k of unicode.keys()) if (k.length > maxKeyLenUnicode) maxKeyLenUnicode = k.length;
  let maxKeyLenLegacy = 1;
  for (const k of legacy.keys()) if (k.length > maxKeyLenLegacy) maxKeyLenLegacy = k.length;

  return { unicode, legacy, unicodeToLegacy, maxKeyLenUnicode, maxKeyLenLegacy };
}

const DICT: ParsedDict = parseDict(DICT_RAW as unknown as string);

// ─── Keyboard helpers ──────────────────────────────────────────────────────
export interface UnicodeBlock { base: string; variants: string[]; }

function buildUnicodeBlocks(src: string): UnicodeBlock[] {
  const blocks: UnicodeBlock[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf(".start") === -1) continue;
    const unis = (lines[i + 1] ?? "").split(/\s+/).filter(Boolean);
    if (unis.length) blocks.push({ base: unis[0], variants: unis });
    i += 2;
  }
  return blocks;
}

const UNICODE_BLOCKS = buildUnicodeBlocks(DICT_RAW as unknown as string);

/** 18 vowels (first block). */
export function getVowels(): string[] {
  return (UNICODE_BLOCKS[0]?.variants ?? []).slice(0, 18);
}

/** Consonant blocks (everything after the vowels block). */
export function getConsonantBlocks(): UnicodeBlock[] {
  return UNICODE_BLOCKS.slice(1);
}

// ─── Greedy match engine ───────────────────────────────────────────────────
//
// Walks the input left-to-right, trying the longest possible key first.
// Any character not found in the table is passed through unchanged — this
// is what makes mixed Singlish + Sinhala-Unicode input "just work":
//   - Unicode mode: Singlish triggers convert; existing Sinhala chars are
//     never in the singlish table, so they fall through verbatim.
//   - Legacy mode:  the table contains BOTH Singlish→Legacy and
//     Unicode→Legacy, so both kinds of input collapse to FM legacy glyphs.

function convert(input: string, table: Map<string, string>, maxLen: number): string {
  let out = "";
  let i = 0;
  const n = input.length;

  while (i < n) {
    const upper = Math.min(maxLen, n - i);
    let matched = false;
    for (let len = upper; len >= 1; len--) {
      const slice = input.substr(i, len);
      const hit = table.get(slice);
      if (hit !== undefined) {
        out += hit;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += input[i];
      i += 1;
    }
  }

  return out;
}

// ─── Public API (signature preserved for existing UI) ──────────────────────

export function singlishToUnicode(text: string): string {
  return convert(text, DICT.unicode, DICT.maxKeyLenUnicode);
}

export function singlishToLegacy(text: string): string {
  return convert(text, DICT.legacy, DICT.maxKeyLenLegacy);
}


export function processConversion(input: string, mode: ConversionMode): string {
  if (!input) return "";
  return mode === "legacy" ? singlishToLegacy(input) : singlishToUnicode(input);
}

// Spell-checker hook used by the existing UI. The dictionary-driven engine
// does not produce annotated suggestions, so we return an empty list — the
// UI safely renders plain text when this is empty.
export interface SpellIssue {
  word: string;
  start: number;
  end: number;
  suggestion: string;
}

export function findSpellIssues(_text: string): SpellIssue[] {
  return [];
}
