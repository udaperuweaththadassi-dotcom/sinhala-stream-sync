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
  unicode: Map<string, string>;
  legacy: Map<string, string>;
  maxKeyLen: number;
}

function parseDict(src: string): ParsedDict {
  const unicode = new Map<string, string>();
  const legacy = new Map<string, string>();

  // Normalise line endings, then split.
  const rawLines = src.replace(/\r\n?/g, "\n").split("\n");

  // Collapse to non-empty lines but remember nothing else — blocks are
  // detected by ".start" / "end" markers.
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    const startIdx = header.indexOf(".start");
    if (startIdx === -1) continue;

    // Triggers come from everything AFTER ".start" on the header line.
    const triggerLine = header.slice(startIdx + ".start".length).trim();
    const triggers = triggerLine.split(/\s+/).filter(Boolean);

    // Next non-empty line = unicode mapping.
    const uniLine = lines[i + 1] ?? "";
    // Line after that = legacy mapping (may end with " end").
    let legLine = lines[i + 2] ?? "";
    legLine = legLine.replace(/\s+end\s*$/i, "").trim();

    const unis = uniLine.split(/\s+/).filter(Boolean);
    const legs = legLine.split(/\s+/).filter(Boolean);

    const n = Math.min(triggers.length, unis.length, legs.length);
    for (let k = 0; k < n; k++) {
      const t = triggers[k];
      // Only register the first occurrence so earlier blocks win on conflict.
      if (!unicode.has(t)) unicode.set(t, unis[k]);
      if (!legacy.has(t)) legacy.set(t, legs[k]);
    }

    // Skip past consumed lines.
    i += 2;
  }

  let maxKeyLen = 1;
  for (const k of unicode.keys()) if (k.length > maxKeyLen) maxKeyLen = k.length;

  return { unicode, legacy, maxKeyLen };
}

const DICT: ParsedDict = parseDict(DICT_RAW as unknown as string);

// ─── Greedy match engine ───────────────────────────────────────────────────

function convert(input: string, table: Map<string, string>, maxLen: number): string {
  let out = "";
  let i = 0;
  const n = input.length;

  while (i < n) {
    // Try the longest possible window first, shrinking down to 1.
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
      // Pass character through unchanged (spaces, punctuation, newlines, …).
      out += input[i];
      i += 1;
    }
  }

  return out;
}

// ─── Public API (signature preserved for existing UI) ──────────────────────

export function singlishToUnicode(text: string): string {
  return convert(text, DICT.unicode, DICT.maxKeyLen);
}

export function singlishToLegacy(text: string): string {
  return convert(text, DICT.legacy, DICT.maxKeyLen);
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
