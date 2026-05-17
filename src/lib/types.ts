/**
 * @file types.ts
 * All TypeScript interfaces, enums, and type aliases for the Sinhalats engine.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Rule taxonomy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every token the engine can emit falls into one of these categories.
 * The category drives the HAL-kireema state machine.
 */
export enum RuleType {
  /** e.g. 'k' → ක, 'th' → ත  */
  CONSONANT = "consonant",

  /** e.g. 'a' → අ, 'aa' → ආ  (used at word-start or after a vowel) */
  INDEPENDENT_VOWEL = "independent_vowel",

  /**
   * e.g. 'a' → '', 'aa' → 'ා', 'ya' → '්‍ය'
   * Applied ONLY when the previous token was a consonant.
   * A vowel_sign rule with output '' removes the implicit HAL.
   */
  VOWEL_SIGN = "vowel_sign",

  /** x → ං, zn → ං, H → ඃ  — stand-alone diacritics */
  SPECIAL = "special",

  /**
   * Pre-built conjunct sequences stored as single lookup entries
   * for maximum throughput: 'ksha' → 'ක්‍ෂ'.
   * These are checked first (longest-match), beating individual rules.
   */
  CONJUNCT = "conjunct",
}

// ─────────────────────────────────────────────────────────────────────────────
// Core rule shape
// ─────────────────────────────────────────────────────────────────────────────

export interface Rule {
  /** The Singlish input pattern, e.g. "chh", "ya", "aa". */
  readonly pattern: string;

  /** The Sinhala Unicode output string. May be "" (for 'a' vowel sign). */
  readonly output: string;

  /** How the engine interprets this token. */
  readonly type: RuleType;

  /**
   * When a VOWEL_SIGN rule is matched in a non-consonant context,
   * fall back to this independent-vowel form.
   * For most rules this equals the corresponding INDEPENDENT_VOWEL output.
   */
  readonly independentForm?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface EngineOptions {
  /**
   * When true, the engine applies smart-case pre-processing:
   * all letters are lowercased EXCEPT those in PRESERVE_UPPERCASE,
   * which represent distinct Sinhala phonemes.
   * Default: true
   */
  smartCase?: boolean;

  /**
   * When true, unrecognised characters are silently dropped.
   * When false (default), they are passed through as-is.
   */
  dropUnrecognised?: boolean;

  /**
   * Expose detailed per-token breakdown for debugging.
   * Default: false
   */
  debug?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine output
// ─────────────────────────────────────────────────────────────────────────────

export interface TransliterateResult {
  /** The final Sinhala Unicode string. */
  readonly output: string;

  /** Elapsed time in milliseconds (populated only when debug: true). */
  readonly elapsedMs?: number;

  /** Token-level breakdown (populated only when debug: true). */
  readonly tokens?: TokenDebug[];
}

export interface TokenDebug {
  readonly singlish: string;
  readonly sinhala: string;
  readonly type: RuleType | "passthrough";
  readonly position: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dictionary JSON schema  (what the scraper emits; what rules.ts consumes)
// ─────────────────────────────────────────────────────────────────────────────

export interface DictionaryEntry {
  singlish: string;
  sinhala: string;
  type: string;
  independentForm?: string;
}

export interface DictionaryJSON {
  meta: {
    version: string;
    locale: string;
    generatedAt: string;
    totalEntries: number;
  };
  entries: DictionaryEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Bucketed rule index (internal, compiled at start-up)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rules bucketed by their first character for O(rules_per_char) lookup.
 * Within each bucket, rules are sorted longest-pattern-first.
 */
export type RuleBucket = ReadonlyMap<string, readonly Rule[]>;
