/**
 * @file smartEngine.ts
 * SmartLearningEngine — Self-Learning Singlish → Sinhala wrapper.
 *
 * Architecture
 * ────────────
 *  convert()       → instant, synchronous, always offline-safe
 *                    local engine → apply learned patterns → return
 *
 *  learnFromAPI()  → async, background, never blocks UI
 *                    fetch API → word-level diff → persist new patterns
 *
 *  All localStorage I/O is wrapped in try/catch so the engine degrades
 *  gracefully in private-browsing mode or when storage is full.
 */

import { SinhalaTransliterator } from "./engine.js";
import type { EngineOptions } from "./types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LearnedPattern {
  /** Unique stable ID for this entry. */
  readonly id: string;
  /** The Singlish input word that triggered this learning event. */
  singlish: string;
  /** The Sinhala output as returned by the external API. */
  sinhala: string;
  /** What our local engine produced (kept for debugging / audit). */
  localWas: string;
  /**
   * Incremented each time the API confirms this mapping.
   * High-confidence patterns are preferred on export.
   */
  confidence: number;
  /** ISO-8601 timestamp: when we first learned this pattern. */
  learnedAt: string;
  /** ISO-8601 timestamp: last time this pattern was applied in convert(). */
  lastSeen: string;
  /** Always "api" — reserved for future sources (user-correction, import…). */
  source: "api" | "import" | "user";
}

export interface LearningStats {
  totalLearned: number;
  topPatterns: Pick<LearnedPattern, "singlish" | "sinhala" | "confidence">[];
  lastLearnedAt: string | null;
  /** Approximate localStorage usage for the pattern store, in bytes. */
  storageBytes: number;
}

export interface ExportPayload {
  meta: {
    exportedAt: string;
    totalPatterns: number;
    engineVersion: string;
  };
  patterns: LearnedPattern[];
}

export interface SmartEngineOptions extends EngineOptions {
  /**
   * Override the learning API endpoint.
   * Default: "https://easysinhalaunicode.com/Api/convert"
   */
  apiEndpoint?: string;
  /** Fetch timeout in milliseconds. Default: 6000 */
  apiTimeoutMs?: number;
  /** Max patterns kept in memory/storage before LRU eviction. Default: 500 */
  maxPatterns?: number;
  /** localStorage key for the pattern store. Default: "sinhala_learned_patterns" */
  storageKey?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ENGINE_VERSION    = "2.0.0";
const DEFAULT_ENDPOINT  = "https://easysinhalaunicode.com/Api/convert";
const DEFAULT_TIMEOUT   = 6_000;
const DEFAULT_MAX       = 500;
const DEFAULT_KEY       = "sinhala_learned_patterns";

/** Sinhala Unicode block: U+0D80 – U+0DFF */
const SINHALA_RE = /[\u0D80-\u0DFF]/;

/** Splits text into word + whitespace tokens, preserving all whitespace. */
const TOKENISE_RE = /(\s+)/;

// ─────────────────────────────────────────────────────────────────────────────
// SmartLearningEngine
// ─────────────────────────────────────────────────────────────────────────────

export class SmartLearningEngine {
  // ── Private state ──────────────────────────────────────────────────────────
  private readonly local: SinhalaTransliterator;
  private readonly apiEndpoint: string;
  private readonly apiTimeoutMs: number;
  private readonly maxPatterns: number;
  private readonly storageKey: string;

  /**
   * In-memory pattern cache.
   * Key: singlish word lowercased.
   * Value: the full LearnedPattern record.
   *
   * Loaded from localStorage at construction; written back after every new
   * learning event.  All reads in convert() hit this Map (O(1)), never
   * touching localStorage during the hot path.
   */
  private cache: Map<string, LearnedPattern>;

  /** Prevents concurrent API calls for the same text. */
  private activeFetch: AbortController | null = null;

  // ─────────────────────────────────────────────────────────────────────────
  constructor(options: SmartEngineOptions = {}) {
    this.local         = new SinhalaTransliterator(options);
    this.apiEndpoint   = options.apiEndpoint  ?? DEFAULT_ENDPOINT;
    this.apiTimeoutMs  = options.apiTimeoutMs ?? DEFAULT_TIMEOUT;
    this.maxPatterns   = options.maxPatterns  ?? DEFAULT_MAX;
    this.storageKey    = options.storageKey   ?? DEFAULT_KEY;
    this.cache         = this.hydrateCache();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // § 1  convert() — synchronous hot path
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Transliterate Singlish text to Sinhala Unicode.
   *
   * Processing order per word-token:
   *   1. Exact-match lookup in the learned-pattern cache  (O(1))
   *   2. Local SinhalaTransliterator engine               (O(rules))
   *
   * Whitespace is always preserved verbatim.
   * This method is synchronous and never throws.
   */
  convert(singlishText: string): string {
    if (!singlishText) return "";

    return singlishText
      .split(TOKENISE_RE)
      .map((token) => {
        // Preserve whitespace tokens unchanged
        if (!token || /^\s+$/.test(token)) return token;

        // 1. Learned pattern cache — highest priority
        const cached = this.cache.get(token.toLowerCase());
        if (cached) {
          cached.lastSeen = new Date().toISOString();
          return cached.sinhala;
        }

        // 2. Local engine fallback
        return this.local.transliterateText(token);
      })
      .join("");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // § 2  learnFromAPI() — async background learning
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fire a background request to the external API, diff the result against
   * the local engine output, and persist any newly discovered patterns.
   *
   * This method:
   *  • Never throws — all errors are caught and logged as warnings.
   *  • Cancels any in-flight request before starting a new one.
   *  • Validates that API output contains Sinhala Unicode before storing.
   *  • Skips storing single-character differences (likely punctuation noise).
   */
  async learnFromAPI(singlishText: string): Promise<void> {
    const trimmed = singlishText.trim();
    if (!trimmed) return;

    // Cancel any previous in-flight request
    this.activeFetch?.abort();
    this.activeFetch = new AbortController();

    try {
      // ── Step 1: Fetch API output ─────────────────────────────────────────
      const apiRaw = await this.fetchAPI(trimmed, this.activeFetch.signal);
      if (!apiRaw) return;

      // ── Step 2: Word-level alignment ─────────────────────────────────────
      const inputWords = trimmed.split(/\s+/);
      const apiWords   = apiRaw.trim().split(/\s+/);
      const localWords = inputWords.map((w) => this.local.transliterateText(w));

      if (apiWords.length !== inputWords.length) {
        // Word-count mismatch — API may have tokenised differently.
        // Learning is unsafe here; skip to avoid corrupt mappings.
        console.warn(
          `[SmartEngine] Word count mismatch (input=${inputWords.length} ` +
          `api=${apiWords.length}). Skipping learning for this input.`
        );
        return;
      }

      // ── Step 3: Diff and persist ─────────────────────────────────────────
      let newPatterns = 0;

      for (let i = 0; i < inputWords.length; i++) {
        const singlish   = inputWords[i];
        const apiOut     = apiWords[i];
        const localOut   = localWords[i];

        if (
          apiOut !== localOut &&            // a real difference exists
          this.isValidSinhala(apiOut) &&    // API returned valid Sinhala
          singlish.length > 1              // skip single-char noise
        ) {
          this.upsertPattern(singlish, apiOut, localOut);
          newPatterns++;
        }
      }

      if (newPatterns > 0) {
        this.flushToStorage();
        console.info(`[SmartEngine] ✓ Learned ${newPatterns} new pattern(s).`);
      }

    } catch (err) {
      if ((err as Error).name === "AbortError") return; // intentional cancel
      // Any network / parse error must never break offline mode
      console.warn("[SmartEngine] API learning skipped (offline mode continues):", err);
    } finally {
      this.activeFetch = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // § 3  exportLearnedRulesJSON() — download utility
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Serialize all learned patterns as JSON and (in browser environments)
   * trigger an automatic file download.
   *
   * Usage from browser DevTools:
   *   window.__engine.exportLearnedRulesJSON();
   */
  exportLearnedRulesJSON(): string {
    const patterns = Array.from(this.cache.values()).sort(
      (a, b) => b.confidence - a.confidence
    );

    const payload: ExportPayload = {
      meta: {
        exportedAt:    new Date().toISOString(),
        totalPatterns: patterns.length,
        engineVersion: ENGINE_VERSION,
      },
      patterns,
    };

    const json = JSON.stringify(payload, null, 2);

    // Trigger download only in browser context
    if (typeof document !== "undefined") {
      const blob   = new Blob([json], { type: "application/json" });
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href     = url;
      anchor.download = `sinhala_learned_patterns_${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    return json;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // § 4  importLearnedRules() — load a previously exported JSON
  // ─────────────────────────────────────────────────────────────────────────

  importLearnedRules(json: string): { imported: number; skipped: number } {
    let imported = 0;
    let skipped  = 0;

    try {
      const payload = JSON.parse(json) as Partial<ExportPayload>;
      const list    = payload.patterns ?? (payload as unknown as LearnedPattern[]);

      if (!Array.isArray(list)) throw new Error("Invalid format: 'patterns' array missing.");

      for (const p of list) {
        if (!this.isValidPatternRecord(p)) { skipped++; continue; }
        const key = p.singlish.toLowerCase();
        if (this.cache.has(key)) { skipped++; continue; }
        this.cache.set(key, { ...p, source: "import" });
        imported++;
      }

      this.flushToStorage();
      console.info(`[SmartEngine] Import complete: +${imported} new, ${skipped} skipped.`);
    } catch (err) {
      console.error("[SmartEngine] importLearnedRules failed:", err);
    }

    return { imported, skipped };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // § 5  Utility methods
  // ─────────────────────────────────────────────────────────────────────────

  getStats(): LearningStats {
    const values  = Array.from(this.cache.values());
    const stored  = this.safeRead() ?? "";

    return {
      totalLearned: this.cache.size,
      topPatterns:  values
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10)
        .map(({ singlish, sinhala, confidence }) => ({ singlish, sinhala, confidence })),
      lastLearnedAt: values.length
        ? values.sort((a, b) => b.learnedAt.localeCompare(a.learnedAt))[0].learnedAt
        : null,
      storageBytes: new Blob([stored]).size,
    };
  }

  clearLearnedPatterns(): void {
    this.cache.clear();
    try { localStorage.removeItem(this.storageKey); } catch { /* noop */ }
    console.info("[SmartEngine] All learned patterns cleared.");
  }

  /** Look up what the engine would use for a given Singlish word. */
  lookup(singlishWord: string): { source: "learned" | "local"; output: string } {
    const cached = this.cache.get(singlishWord.toLowerCase());
    if (cached) return { source: "learned", output: cached.sinhala };
    return { source: "local", output: this.local.transliterateText(singlishWord) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async fetchAPI(text: string, signal: AbortSignal): Promise<string | null> {
    const body = new URLSearchParams({ data: text });

    const response = await fetch(this.apiEndpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
      signal:  AbortSignal.any
        ? AbortSignal.any([signal, AbortSignal.timeout(this.apiTimeoutMs)])
        : signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from learning API`);
    }

    const text_result = await response.text();
    return text_result.trim() || null;
  }

  private upsertPattern(singlish: string, apiOut: string, localOut: string): void {
    const key      = singlish.toLowerCase();
    const existing = this.cache.get(key);

    if (existing) {
      existing.confidence++;
      existing.lastSeen = new Date().toISOString();
      // Update sinhala only after 2+ confirmations (guards against API noise)
      if (existing.confidence >= 2) existing.sinhala = apiOut;
    } else {
      const pattern: LearnedPattern = {
        id:         `lp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        singlish,
        sinhala:    apiOut,
        localWas:   localOut,
        confidence: 1,
        learnedAt:  new Date().toISOString(),
        lastSeen:   new Date().toISOString(),
        source:     "api",
      };
      this.cache.set(key, pattern);
    }

    // LRU eviction when over capacity
    if (this.cache.size > this.maxPatterns) this.evictLRU(20);
  }

  private evictLRU(count: number): void {
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastSeen.localeCompare(b.lastSeen)
    );
    entries.slice(0, count).forEach(([key]) => this.cache.delete(key));
  }

  private flushToStorage(): void {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(Array.from(this.cache.values()))
      );
    } catch {
      // Storage full → evict 50 oldest entries and retry once
      this.evictLRU(50);
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify(Array.from(this.cache.values()))
        );
      } catch {
        console.warn("[SmartEngine] localStorage quota exceeded. Patterns stored in memory only.");
      }
    }
  }

  private hydrateCache(): Map<string, LearnedPattern> {
    const map = new Map<string, LearnedPattern>();
    try {
      const raw = this.safeRead();
      if (!raw) return map;
      const list = JSON.parse(raw) as unknown[];
      for (const item of list) {
        if (this.isValidPatternRecord(item)) {
          map.set(item.singlish.toLowerCase(), item);
        }
      }
    } catch {
      console.warn("[SmartEngine] Could not hydrate pattern cache. Starting fresh.");
    }
    return map;
  }

  private safeRead(): string | null {
    try { return localStorage.getItem(this.storageKey); }
    catch { return null; }
  }

  private isValidSinhala(text: string): boolean {
    return SINHALA_RE.test(text);
  }

  private isValidPatternRecord(p: unknown): p is LearnedPattern {
    return (
      typeof p === "object" && p !== null &&
      typeof (p as LearnedPattern).singlish   === "string" && (p as LearnedPattern).singlish.length > 0 &&
      typeof (p as LearnedPattern).sinhala    === "string" && (p as LearnedPattern).sinhala.length > 0 &&
      typeof (p as LearnedPattern).confidence === "number"
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton (optional convenience export)
// ─────────────────────────────────────────────────────────────────────────────

export const smartEngine = new SmartLearningEngine();
