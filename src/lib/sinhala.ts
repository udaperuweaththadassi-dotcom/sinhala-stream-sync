// Singlish → Sinhala Unicode + Unicode → FM (Legacy) conversion
// Self-contained, no external Sinhala libraries.

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Pre-processing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * These uppercase letters each represent a *distinct* Sinhala letter and must
 * NOT be lowercased during pre-processing.
 *
 *   A  → ඇ / ැ (æ sound)       T  → ඨ (maha prānta ta)
 *   D  → ඪ (maha prānta da)    N  → ණ (mūrdhaja na)
 *   L  → ළ (mūrdhaja la)       S  → ෂ (maha prānta sa)
 *   J  → ඣ (maha prānta ja)    B  → ඹ (amba bayanna)
 *   H  → ඃ (visargaya)         X  → ්‍ෂ (ksha ligature appendage)
 *   R  → ඍ / ඎ (ri / ruu vowel)
 */
const PRESERVE_UPPERCASE = new Set<string>([
  "A", "T", "D", "N", "L", "S", "J", "B", "H", "X", "R",
]);

/**
 * Lower-case every ASCII letter that is NOT in PRESERVE_UPPERCASE.
 * Non-ASCII characters (already-converted Sinhala Unicode, punctuation, etc.)
 * are passed through unchanged.
 */
function preprocessInput(text: string): string {
  return Array.from(text)
    .map((ch) => {
      if (ch.charCodeAt(0) > 127) return ch; // Sinhala / non-ASCII passthrough
      return PRESERVE_UPPERCASE.has(ch) ? ch : ch.toLowerCase();
    })
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Lookup tables
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Standalone special characters.
 * Checked BEFORE consonants so that 'x' / 'zn' / 'H' / 'X' are never
 * accidentally consumed as part of a consonant match.
 */
const SPECIALS: Record<string, string> = {
  zn: "ං", // Anuswaraya (alternate)
  x: "ං",  // Anuswaraya
  H: "ඃ",  // Visargaya
  X: "්‍ෂ", // Ksha ligature appendage (standalone position)
};

/**
 * Consonant base characters (without hal / virama).
 * Keys are sorted longest-first at runtime so that multi-char digraphs
 * ('chh', 'thh', 'zdh' …) are matched before their prefixes ('ch', 'th', …).
 *
 * New mapping (§3 of the spec):
 *   k/kh  g/gh  ch/chh  j/J  t/T  d/D  th/thh  dh/dhh
 *   n/N   p/ph  b/bh/B  m    y    r    l/L      w/v
 *   s/sh/S/Sh   h    f
 *   z-series rare consonants: zg zj zd zdh zk zh
 */
const CONSONANTS: Record<string, string> = {
  // ── 3-character digraphs ──────────────────────────────────────────────────
  zdh: "ඳ", // nd sound (maha-prāna)
  chh: "ඡ", // cha maha-prāna
  thh: "ථ", // tha maha-prāna (dental)
  dhh: "ධ", // dha maha-prāna (dental)

  // ── 2-character digraphs ──────────────────────────────────────────────────
  kh: "ඛ",
  gh: "ඝ",
  ch: "ච",
  th: "ත",  // dental tha (common)
  dh: "ද",  // dental da (common)
  ph: "ඵ",
  bh: "භ",
  sh: "ශ",  // sha (palatal)
  Sh: "ෂ",  // Sha (retroflex) — 'S' preserved, 'h' lowercased
  zg: "ඟ",
  zj: "ඦ",
  zd: "ඬ",
  zk: "ඞ",
  zh: "ඥ",

  // ── 1-character consonants ────────────────────────────────────────────────
  k: "ක",
  g: "ග",
  j: "ජ",
  J: "ඣ",  // maha-prāna ja  (J preserved)
  t: "ට",  // retroflex ta
  T: "ඨ",  // maha-prāna retroflex ta  (T preserved)
  d: "ඩ",  // retroflex da
  D: "ඪ",  // maha-prāna retroflex da  (D preserved)
  n: "න",  // dental na
  N: "ණ",  // retroflex na  (N preserved)
  p: "ප",
  b: "බ",
  B: "ඹ",  // amba bayanna  (B preserved)
  m: "ම",
  y: "ය",
  r: "ර",
  l: "ල",
  L: "ළ",  // retroflex la  (L preserved)
  w: "ව",
  v: "ව",
  s: "ස",
  S: "ෂ",  // retroflex sha  (S preserved)
  h: "හ",
  f: "ෆ",
};

/**
 * Independent vowels — used when a vowel appears at the start of a word or
 * after another vowel / non-consonant context.
 *
 * New mapping (§4 of the spec):
 *   a/aa  A/Aa/AA  i/ii  u/uu  R/Ru  e/ee/ai  o/oo/au/ou
 */
const INDEPENDENT_VOWELS: Record<string, string> = {
  // ── 2-character ───────────────────────────────────────────────────────────
  Aa: "ඈ", // æː  (A preserved, a lowercased)
  AA: "ඈ", // æː  (both A preserved)
  aa: "ආ",
  ai: "ඓ",
  au: "ඖ",
  ou: "ඖ",
  ii: "ඊ",
  uu: "ඌ",
  ee: "ඒ",
  oo: "ඕ",
  Ru: "ඎ", // ṝ long vowel  (R preserved, u lowercased)

  // ── 1-character ───────────────────────────────────────────────────────────
  A: "ඇ",  // æ  (A preserved)
  R: "ඍ",  // ṛ vowel  (R preserved)
  a: "අ",
  i: "ඉ",
  u: "උ",
  e: "එ",
  o: "ඔ",
};

/**
 * Vowel modifier signs — appended to a consonant base.
 * 'a' maps to "" (removes the implicit hal / virama).
 * Special ligature modifiers:
 *   ya → ්‍ය  (yansaya,     e.g. kya → ක්‍ය)
 *   ra → ්‍ර  (rakaransaya, e.g. kra → ක්‍ර)
 *   X  → ්‍ෂ  (ksha,        e.g. kX  → ක්‍ෂ)
 *
 * New mapping (§5 of the spec):
 *   a/aa  A/Aa/AA  i/ii  u/uu  ru/ruu  e/ee/ai  o/oo/au/ou
 *   ya  ra  X
 */
const VOWEL_SIGNS: Record<string, string> = {
  // ── 3-character ───────────────────────────────────────────────────────────
  ruu: "ෲ", // long ṝ modifier

  // ── 2-character ───────────────────────────────────────────────────────────
  Aa: "ෑ",
  AA: "ෑ",
  aa: "ා",
  ai: "ෛ",
  au: "ෞ",
  ou: "ෞ",
  ii: "ී",
  uu: "ූ",
  ee: "ේ",
  oo: "ෝ",
  ru: "ෘ",  // short ṛ modifier
  ra: "්‍ර", // rakaransaya  (hal + ZWJ + ර)
  ya: "්‍ය", // yansaya       (hal + ZWJ + ය)

  // ── 1-character ───────────────────────────────────────────────────────────
  X: "්‍ෂ", // ksha ligature (after consonant, e.g. kX → ක්‍ෂ)
  A: "ැ",
  a: "",   // inherent 'a' — consumes hal, adds nothing
  i: "ි",
  u: "ු",
  e: "ෙ",
  o: "ො",
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Helpers
// ─────────────────────────────────────────────────────────────────────────────

const HAL = "්";   // virama / al-lakuna
const ZWJ = "\u200D"; // zero-width joiner (used in ligatures)

/** Sort keys longest-first so longer digraphs are always tried before prefixes. */
function sortedKeys(o: Record<string, string>): string[] {
  return Object.keys(o).sort((a, b) => b.length - a.length);
}

/** Return the first key in `keys` that matches `input` starting at `i`, or null. */
function matchKey(input: string, i: number, keys: string[]): string | null {
  for (const k of keys) if (input.startsWith(k, i)) return k;
  return null;
}

// Pre-compute sorted key arrays once at module load.
const SPEC_KEYS = sortedKeys(SPECIALS);
const CONS_KEYS = sortedKeys(CONSONANTS);
const IVOW_KEYS = sortedKeys(INDEPENDENT_VOWELS);
const SIGN_KEYS = sortedKeys(VOWEL_SIGNS);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Main transliteration function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert Singlish (English transliteration) to Sinhala Unicode.
 *
 * Algorithm:
 *  1. Pre-process: smart case normalisation.
 *  2. Scan left-to-right, always matching the LONGEST possible key first.
 *  3. Priority order at each position:
 *       a. Non-alphabetic character → pass through as-is.
 *       b. Special symbol (x, zn, H, X standalone).
 *       c. Consonant → emit base letter, then:
 *            • If a vowel sign / ligature modifier follows → emit sign.
 *            • Otherwise                                  → emit HAL (්).
 *       d. Independent vowel.
 *       e. Unrecognised character → pass through.
 */
export function singlishToUnicode(rawText: string): string {
  const text = preprocessInput(rawText);
  let out = "";
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // ── (a) Non-alphabetic pass-through ─────────────────────────────────────
    if (!/[a-zA-Z]/.test(ch)) {
      out += ch;
      i++;
      continue;
    }

    // ── (b) Standalone special characters ───────────────────────────────────
    // Checked before consonants so 'x'/'zn'/'H'/'X' are never consumed by them.
    const spKey = matchKey(text, i, SPEC_KEYS);
    if (spKey) {
      out += SPECIALS[spKey];
      i += spKey.length;
      continue;
    }

    // ── (c) Consonant + optional vowel sign / ligature modifier ─────────────
    const cKey = matchKey(text, i, CONS_KEYS);
    if (cKey) {
      out += CONSONANTS[cKey];
      i += cKey.length;

      // Look for a following vowel sign, yansaya (ya), rakaransaya (ra),
      // or ksha ligature (X).
      const vKey = matchKey(text, i, SIGN_KEYS);
      if (vKey !== null) {
        // vKey found — 'a' maps to "" (no hal), others add their sign.
        out += VOWEL_SIGNS[vKey];
        i += vKey.length;
      } else {
        // No vowel modifier → consonant is fully closed with hal kireema.
        out += HAL;
      }
      continue;
    }

    // ── (d) Independent vowel ────────────────────────────────────────────────
    const ivKey = matchKey(text, i, IVOW_KEYS);
    if (ivKey) {
      out += INDEPENDENT_VOWELS[ivKey];
      i += ivKey.length;
      continue;
    }

    // ── (e) Unrecognised character ───────────────────────────────────────────
    out += ch;
    i++;
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Unicode → FM (legacy font) conversion  [UNCHANGED]
// ─────────────────────────────────────────────────────────────────────────────

// Minimal Unicode → FM (legacy) mapping. Real FM fonts use a complex
// reorder system; this gives a usable preview for common letters.
const UNI_TO_FM: Record<string, string> = {
  "අ": "w", "ආ": "wd", "ඇ": "we", "ඈ": "wE",
  "ඉ": "b", "ඊ": "B", "උ": "W", "ඌ": "WD",
  "එ": "t", "ඒ": "ta", "ඔ": "T", "ඕ": "Ta", "ඖ": "TT",
  "ක": "l", "ඛ": "L", "ග": ".", "ඝ": ">",
  "ච": "p", "ඡ": "P", "ජ": "c", "ඣ": "C",
  "ඤ": "[", "ඥ": "{",
  "ට": "g", "ඨ": "G", "ඩ": "v", "ඪ": "V", "ණ": "K",
  "ත": ";", "ථ": ":", "ද": "o", "ධ": "O", "න": "k",
  "ප": "m", "ඵ": "M", "බ": "n", "භ": "N", "ම": "u",
  "ය": "h", "ර": "r", "ල": ",", "ව": "j",
  "ශ": "Y", "ෂ": "I", "ස": "i", "හ": "y", "ළ": "<", "ෆ": "*",
  "්": "a", "ා": "d", "ැ": "e", "ෑ": "E",
  "ි": "s", "ී": "S", "ු": "q", "ූ": "Q",
  "ෙ": "f", "ේ": "fa", "ො": "fd", "ෝ": "fda", "ෞ": "ff",
  "ං": "x", "ඃ": "%",
  " ": " ", "\n": "\n", "\t": "\t",
};

export function unicodeToFM(text: string): string {
  let out = "";
  for (const ch of text) out += UNI_TO_FM[ch] ?? ch;
  return out;
}

export type ConversionMode = "unicode" | "legacy";

export function processConversion(input: string, mode: ConversionMode): string {
  const isEnglish = /[a-zA-Z]/.test(input);
  const unicode = isEnglish ? singlishToUnicode(input) : input;
  return mode === "legacy" ? unicodeToFM(unicode) : unicode;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Spell checker  [UNCHANGED]
// ─────────────────────────────────────────────────────────────────────────────

// Spell checker: common ණ/න and ළ/ල confusions.
// These are words where the *correct* spelling uses the murdaja (ණ/ළ).
// If the user writes them with the dental (න/ල), we flag the wrong form.
const NA_CORRECT = ["ගණන", "පුණ්‍ය", "ආරම්භණ", "ණය", "ගුණ", "මිණි", "කරුණා", "පූර්ණ"];
const LA_CORRECT = ["පාළු", "කළු", "ගිළුණා", "මුළු", "කැළෑ", "ළමා", "ළිඳ", "මාළු"];

function swap(s: string, a: string, b: string) {
  return s.split("").map((c) => (c === a ? b : c)).join("");
}

export interface SpellIssue {
  word: string;
  start: number;
  end: number;
  suggestion: string;
}

export function findSpellIssues(text: string): SpellIssue[] {
  const issues: SpellIssue[] = [];
  const re = /[\u0D80-\u0DFF\u200D]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const w = m[0];
    for (const correct of NA_CORRECT) {
      const wrong = swap(correct, "ණ", "න");
      if (wrong !== correct && w === wrong) {
        issues.push({ word: w, start: m.index, end: m.index + w.length, suggestion: correct });
      }
    }
    for (const correct of LA_CORRECT) {
      const wrong = swap(correct, "ළ", "ල");
      if (wrong !== correct && w === wrong) {
        issues.push({ word: w, start: m.index, end: m.index + w.length, suggestion: correct });
      }
    }
  }
  return issues;
}
