/**
 * @file rules.ts
 * The authoritative Singlish → Sinhala phoneme mapping table.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  EDIT HERE to tune the dictionary.  All other engine code auto-adapts. │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Rules are compiled into a bucketed index (by first character) at module
 * load time.  Within each bucket they are sorted longest-pattern-first so the
 * tokenizer always tries the most specific match before falling back.
 *
 * Unicode reference:
 *   HAL  (virama / al-lakuna)  : U+0DCA  ්
 *   ZWJ  (zero-width joiner)   : U+200D
 *   ZWNJ (zero-width non-join) : U+200C
 */

import { Rule, RuleType, RuleBucket } from "./types.js";

const { CONSONANT, INDEPENDENT_VOWEL, VOWEL_SIGN, SPECIAL, CONJUNCT } = RuleType;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const c  = (pattern: string, output: string): Rule => ({ pattern, output, type: CONSONANT });
const iv = (pattern: string, output: string): Rule => ({ pattern, output, type: INDEPENDENT_VOWEL });
const vs = (
  pattern: string,
  output: string,
  independentForm?: string,
): Rule => ({ pattern, output, type: VOWEL_SIGN, independentForm });
const sp = (pattern: string, output: string): Rule => ({ pattern, output, type: SPECIAL });
const co = (pattern: string, output: string): Rule => ({ pattern, output, type: CONJUNCT });

// ─────────────────────────────────────────────────────────────────────────────
// § A  Pre-built conjuncts  (longest entries — always tried first)
// ─────────────────────────────────────────────────────────────────────────────
// These represent common multi-consonant ligatures that are best treated as
// atomic units.  Add more as needed; longer patterns are always preferred.
//
// Yansaya  (්‍ය)  — HAL + ZWJ + ය
// Rakaransaya (්‍ර) — HAL + ZWJ + ර
// Ksha ligature   — ක + HAL + ZWJ + ෂ

const CONJUNCT_RULES: Rule[] = [
  // ── ksha family ─────────────────────────────────────────────────────────
  co("ksha",  "ක්\u200Dෂ"),   // ksha  → ක්‍ෂ
  co("kshu",  "ක්\u200Dෂු"),  // kshu  → ක්‍ෂු
  co("kshi",  "ක්\u200Dෂි"),  // kshi  → ක්‍ෂි
  // ── Common Sinhala conjunct words stored whole ───────────────────────────
  co("ththa", "ත්ත"),          // geminate dental tha
  co("ndha",  "න්ද"),          // na + da cluster
  co("mba",   "ම්බ"),          // ma + ba cluster
  co("ndha",  "ඳ"),            // pre-nasalised da (alt)
];

// ─────────────────────────────────────────────────────────────────────────────
// § B  Specials  (anusvara, visarga, ksha-append)
// ─────────────────────────────────────────────────────────────────────────────

const SPECIAL_RULES: Rule[] = [
  sp("zn", "ං"),        // Anuswaraya (alt)
  sp("x",  "ං"),        // Anuswaraya
  sp("H",  "ඃ"),        // Visargaya   (H preserved)
  sp("X",  "්\u200Dෂ"), // Ksha append (X preserved): kX → ක්‍ෂ
];

// ─────────────────────────────────────────────────────────────────────────────
// § C  Consonants
// ─────────────────────────────────────────────────────────────────────────────
// Multi-char digraphs must appear before their single-char prefixes here so
// that when the bucket-sorter runs, length ordering is respected.
//
// Case notes (smart-case pre-processing already applied):
//   t  → ට (retroflex)       T  → ඨ (aspirated retroflex)
//   d  → ඩ (retroflex)       D  → ඪ (aspirated retroflex)
//   n  → න (dental)          N  → ණ (retroflex)
//   l  → ල (dental)          L  → ළ (retroflex)
//   s  → ස (dental)          S  → ෂ (retroflex aspirated)
//   j  → ජ (palatal)         J  → ඣ (aspirated palatal)
//   b  → බ (labial)          B  → ඹ (amba bayanna)
//   R  → ර (used as vowel)   r  → ර (consonant)

const CONSONANT_RULES: Rule[] = [
  // ── 3-character ──────────────────────────────────────────────────────────
  c("zdh", "ඳ"),  // pre-nasalised ḍa
  c("chh", "ඡ"),  // aspirated ca
  c("thh", "ථ"),  // aspirated dental ta
  c("dhh", "ධ"),  // aspirated dental da

  // ── 2-character ──────────────────────────────────────────────────────────
  c("kh",  "ඛ"),  // aspirated ka
  c("gh",  "ඝ"),  // aspirated ga
  c("ch",  "ච"),  // palatal ca
  c("th",  "ත"),  // dental ta   (common: 'tha' → ත)
  c("dh",  "ද"),  // dental da   (common: 'dha' → ද)
  c("ph",  "ඵ"),  // aspirated pa
  c("bh",  "භ"),  // aspirated ba
  c("sh",  "ශ"),  // palatal sha
  c("Sh",  "ෂ"),  // retroflex sha  (S preserved + h)
  c("nj",  "ඤ"),  // ñca-group na
  c("zg",  "ඟ"),  // pre-nasalised ga
  c("zj",  "ඦ"),  // pre-nasalised ja  (rare)
  c("zd",  "ඬ"),  // pre-nasalised ḍa
  c("zk",  "ඞ"),  // ṅa (velar nasal)
  c("zh",  "ඥ"),  // ña (palatal nasal)
  c("ng",  "ඞ"),  // alt: ng → ṅa

  // ── 1-character ──────────────────────────────────────────────────────────
  c("k",  "ක"),
  c("g",  "ග"),
  c("j",  "ජ"),
  c("J",  "ඣ"),  // J preserved
  c("t",  "ට"),  // retroflex ta
  c("T",  "ඨ"),  // T preserved: aspirated retroflex ta
  c("d",  "ඩ"),  // retroflex da
  c("D",  "ඪ"),  // D preserved: aspirated retroflex da
  c("n",  "න"),
  c("N",  "ණ"),  // N preserved: retroflex na
  c("p",  "ප"),
  c("b",  "බ"),
  c("B",  "ඹ"),  // B preserved: amba bayanna
  c("m",  "ම"),
  c("y",  "ය"),
  c("r",  "ර"),
  c("l",  "ල"),
  c("L",  "ළ"),  // L preserved: retroflex la
  c("w",  "ව"),
  c("v",  "ව"),
  c("s",  "ස"),
  c("S",  "ෂ"),  // S preserved: retroflex sha
  c("h",  "හ"),
  c("f",  "ෆ"),
];

// ─────────────────────────────────────────────────────────────────────────────
// § D  Independent Vowels  (word-start or post-vowel context)
// ─────────────────────────────────────────────────────────────────────────────

const INDEPENDENT_VOWEL_RULES: Rule[] = [
  // ── 2-character ──────────────────────────────────────────────────────────
  iv("Aa", "ඈ"),  // æː  (A preserved + a)
  iv("AA", "ඈ"),  // æː  (both A preserved)
  iv("aa", "ආ"),
  iv("ai", "ඓ"),
  iv("au", "ඖ"),
  iv("ou", "ඖ"),
  iv("ii", "ඊ"),
  iv("uu", "ඌ"),
  iv("ee", "ඒ"),
  iv("oo", "ඕ"),
  iv("Ru", "ඎ"),  // ṝ long vowel  (R preserved + u)

  // ── 1-character ──────────────────────────────────────────────────────────
  iv("A", "ඇ"),   // æ  (A preserved)
  iv("R", "ඍ"),   // ṛ vowel  (R preserved)
  iv("a", "අ"),
  iv("i", "ඉ"),
  iv("u", "උ"),
  iv("e", "එ"),
  iv("o", "ඔ"),
];

// ─────────────────────────────────────────────────────────────────────────────
// § E  Vowel Signs / Modifiers  (post-consonant context only)
// ─────────────────────────────────────────────────────────────────────────────
// When a rule of type VOWEL_SIGN is matched AFTER a consonant:
//   • output ""  → strip implicit HAL (inherent 'a')
//   • output "ා" → replace HAL with vowel diacritic
//   • output '්‍ය' → yansaya ligature   (HAL + ZWJ + ය)
//   • output '්‍ර' → rakaransaya ligature (HAL + ZWJ + ර)
//
// independentForm is used when the same pattern appears NOT after a consonant
// (e.g. 'aa' at start of word → ආ, not ා).

const VOWEL_SIGN_RULES: Rule[] = [
  // ── 3-character ──────────────────────────────────────────────────────────
  vs("ruu", "ෲ",           "ඌ"),   // long ṝ modifier / independent uu

  // ── 2-character ──────────────────────────────────────────────────────────
  vs("Aa",  "ෑ",           "ඈ"),   // æː diacritic
  vs("AA",  "ෑ",           "ඈ"),
  vs("aa",  "ා",           "ආ"),
  vs("ai",  "ෛ",           "ඓ"),
  vs("au",  "ෞ",           "ඖ"),
  vs("ou",  "ෞ",           "ඖ"),
  vs("ii",  "ී",            "ඊ"),
  vs("uu",  "ූ",            "ඌ"),
  vs("ee",  "ේ",            "ඒ"),
  vs("oo",  "ෝ",            "ඕ"),
  vs("ru",  "ෘ",            "ඍ"),   // short ṛ modifier
  vs("ra",  "්\u200Dර",    "ර"),   // rakaransaya: HAL + ZWJ + ර
  vs("ya",  "්\u200Dය",    "ය"),   // yansaya:      HAL + ZWJ + ය

  // ── 1-character ──────────────────────────────────────────────────────────
  vs("X",   "්\u200Dෂ",   "ෂ"),   // ksha append   (X preserved)
  vs("A",   "ැ",           "ඇ"),   // æ diacritic   (A preserved)
  vs("a",   "",            "අ"),   // inherent a — removes HAL
  vs("i",   "ි",            "ඉ"),
  vs("u",   "ු",            "උ"),
  vs("e",   "ෙ",            "එ"),
  vs("o",   "ො",            "ඔ"),
];

// ─────────────────────────────────────────────────────────────────────────────
// § F  Compile: flat list → bucketed index
// ─────────────────────────────────────────────────────────────────────────────

/** All rules in declaration order.  Compilation sorts within each bucket. */
export const ALL_RULES: readonly Rule[] = [
  ...CONJUNCT_RULES,
  ...SPECIAL_RULES,
  ...CONSONANT_RULES,
  ...INDEPENDENT_VOWEL_RULES,
  ...VOWEL_SIGN_RULES,
];

/**
 * Build the bucketed index consumed by the engine.
 *
 * Design:
 *   bucket_key = rule.pattern[0]         → O(1) first-char dispatch
 *   within bucket: sorted longest-first  → greedy longest-match guaranteed
 *
 * Called once at module load; result is frozen for the lifetime of the app.
 */
function buildBucket(rules: readonly Rule[]): RuleBucket {
  const raw = new Map<string, Rule[]>();

  for (const rule of rules) {
    const key = rule.pattern[0];
    if (!raw.has(key)) raw.set(key, []);
    raw.get(key)!.push(rule);
  }

  // Sort each bucket longest → shortest, then freeze
  const frozen = new Map<string, readonly Rule[]>();
  for (const [key, bucket] of raw) {
    frozen.set(key, Object.freeze([...bucket].sort((a, b) => b.pattern.length - a.pattern.length)));
  }

  return Object.freeze(frozen) as RuleBucket;
}

/** Pre-compiled bucket index.  Import this in the engine — never re-build. */
export const RULE_BUCKET: RuleBucket = buildBucket(ALL_RULES);

/**
 * Separate bucket containing ONLY vowel-sign rules, for the post-consonant
 * lookup step.  Using a dedicated bucket avoids scanning consonant/conjunct
 * rules during the vowel-modifier phase.
 */
export const VOWEL_SIGN_BUCKET: RuleBucket = buildBucket([...SPECIAL_RULES, ...VOWEL_SIGN_RULES]);

// ─────────────────────────────────────────────────────────────────────────────
// § G  Exported constants
// ─────────────────────────────────────────────────────────────────────────────

/** The set of uppercase input characters that must NOT be lowercased. */
export const PRESERVE_UPPERCASE: ReadonlySet<string> = new Set([
  "A",  // ඇ / ැ  (æ sound)
  "T",  // ඨ      (maha-prāna retroflex ta)
  "D",  // ඪ      (maha-prāna retroflex da)
  "N",  // ණ      (mūrdhaja na)
  "L",  // ළ      (mūrdhaja la)
  "S",  // ෂ      (maha-prāna retroflex sha)
  "J",  // ඣ      (maha-prāna ja)
  "B",  // ඹ      (amba bayanna)
  "H",  // ඃ      (visargaya)
  "X",  // ෂ-append / ksha ligature
  "R",  // ඍ / ඎ  (vocalic r)
]);

export const HAL  = "\u0DCA";    // ් virama / al-lakuna
export const ZWJ  = "\u200D";    // zero-width joiner
export const ZWNJ = "\u200C";    // zero-width non-joiner
