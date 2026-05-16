// Singlish → Sinhala Unicode + Unicode → FM (Legacy) conversion
// Self-contained, no external Sinhala libraries.

// Vowels (independent) and their dependent signs (pili)
const VOWELS: Record<string, string> = {
  a: "අ", aa: "ආ", A: "ඇ", Aa: "ඈ",
  i: "ඉ", ii: "ඊ", ee: "ඊ",
  u: "උ", uu: "ඌ",
  e: "එ", E: "ඒ",
  o: "ඔ", O: "ඕ", au: "ඖ",
};

const VOWEL_SIGNS: Record<string, string> = {
  a: "",        // inherent
  aa: "ා",
  A: "ැ",
  Aa: "ෑ",
  i: "ි",
  ii: "ී", ee: "ී",
  u: "ු",
  uu: "ූ",
  e: "ෙ",
  E: "ේ",
  o: "ො",
  O: "ෝ",
  au: "ෞ",
};

// Consonants — longer keys first matter
const CONSONANTS: Record<string, string> = {
  kh: "ඛ", gh: "ඝ",
  ch: "ච", Ch: "ඡ", jh: "ඣ",
  Th: "ඨ", Dh: "ඪ",
  th: "ථ", dh: "ධ",
  sh: "ශ", Sh: "ෂ",
  ng: "ඞ", Ng: "ඟ", Nd: "ඬ", nd: "ඳ", mb: "ඹ", nj: "ඤ",
  k: "ක", g: "ග", j: "ජ",
  T: "ට", D: "ඩ", N: "ණ",
  t: "ත", d: "ද", n: "න",
  p: "ප", b: "බ", m: "ම",
  y: "ය", r: "ර", l: "ල", L: "ළ", v: "ව", w: "ව",
  s: "ස", S: "ස", h: "හ", f: "ෆ",
};

const HAL = "්"; // virama / al-lakuna
const ZWJ = "\u200D";

function sortedKeys(o: Record<string, string>) {
  return Object.keys(o).sort((a, b) => b.length - a.length);
}
const CONS_KEYS = sortedKeys(CONSONANTS);
const VOWEL_KEYS = sortedKeys(VOWELS);
const SIGN_KEYS = sortedKeys(VOWEL_SIGNS);

function matchKey(input: string, i: number, keys: string[]): string | null {
  for (const k of keys) if (input.startsWith(k, i)) return k;
  return null;
}

export function singlishToUnicode(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    // Whitespace / punctuation pass-through
    if (!/[a-zA-Z]/.test(ch)) {
      out += ch;
      i++;
      continue;
    }

    // Try consonant first
    const cKey = matchKey(text, i, CONS_KEYS);
    if (cKey) {
      out += CONSONANTS[cKey];
      i += cKey.length;

      // ng / m at word boundary => anusvara "ං"
      // Check for following vowel: if none, add hal (virama)
      const vKey = matchKey(text, i, SIGN_KEYS);
      if (vKey) {
        out += VOWEL_SIGNS[vKey];
        i += vKey.length;
      } else {
        // No vowel — peek next: if next is consonant or end, add hal
        const next = text[i];
        if (!next || !/[a-zA-Z]/.test(next) || matchKey(text, i, CONS_KEYS)) {
          out += HAL;
        }
      }
      continue;
    }

    // Standalone vowel
    const vKey = matchKey(text, i, VOWEL_KEYS);
    if (vKey) {
      out += VOWELS[vKey];
      i += vKey.length;
      continue;
    }

    out += ch;
    i++;
  }
  // Handle "ng" anusvara heuristic: "ang" -> "අං"
  out = out.replace(/නග්(?=[\s\W]|$)/g, "ං");
  return out;
}

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

// --- Spell checker: common ණ/න and ළ/ල confusions ---
// These are words where the *correct* spelling uses the murdaja (ණ/ළ).
// If the user writes them with the dental (න/ල), we flag the wrong form.
const NA_CORRECT = ["ගණන", "පුණ්‍ය", "ආරම්භණ", "ණය", "ගුණ", "මිණි", "කරුණා", "පූර්ණ"];
const LA_CORRECT = ["පාළු", "කළු", "ගිළුණා", "මුළු", "කැළෑ", "ළමා", "ළිඳ", "මාළු"];

function swap(s: string, a: string, b: string) {
  return s.split("").map((c) => (c === a ? b : c)).join("");
}

export interface SpellIssue { word: string; start: number; end: number; suggestion: string; }

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
