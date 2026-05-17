/**
 * SmartLearningEngine - AI-powered Sinhala Text Conversion & Learning System
 * 
 * Features:
 * - Local Singlish → Sinhala conversion (instant, offline-safe)
 * - Cloud-based learning from user input patterns
 * - Spell checking and suggestions
 * - Adaptive dictionary that improves over time
 */

interface ConversionMapping {
  [key: string]: string;
}

interface LearnedPattern {
  input: string;
  output: string;
  frequency: number;
  timestamp: number;
}

interface ApiResponse {
  success: boolean;
  converted?: string;
  suggestion?: string;
  error?: string;
}

export class SmartLearningEngine {
  private readonly CACHE_KEY = "sinhala_learned_patterns";
  private readonly API_ENDPOINT = "/api/sinhala/learn"; // ඔයාගේ backend endpoint එක
  private readonly API_TIMEOUT = 5000; // 5 seconds
  
  // Local Singlish → Sinhala mapping (Base dictionary)
  private baseConversionMap: ConversionMapping = {
    // Vowels / ස්වර
    "aa": "ා",
    "ae": "ේ",
    "ai": "ෙ",
    "au": "ෞ",
    "a": "ැ",
    
    // Consonants / ව්‍යञ්ජන
    "ka": "ක",
    "kha": "ඛ",
    "ga": "ග",
    "gha": "ඝ",
    "nga": "ඞ",
    
    "cha": "ච",
    "chha": "ඡ",
    "ja": "ජ",
    "jha": "ඣ",
    "nya": "ඤ",
    
    "ta": "ට",
    "tha": "ඨ",
    "da": "ඩ",
    "dha": "ධ",
    "na": "ණ",
    
    "tta": "ත",
    "ttha": "ථ",
    "dda": "ද",
    "ddha": "ධ",
    "nna": "න",
    
    "pa": "ප",
    "pha": "ෆ",
    "ba": "බ",
    "bha": "භ",
    "ma": "ම",
    
    "ya": "ය",
    "ra": "ර",
    "la": "ල",
    "wa": "ව",
    "sha": "ශ",
    "ssha": "ෂ",
    "sa": "ස",
    "ha": "හ",
    
    // Common words
    "ammaa": "අම්මා",
    "appaa": "අප්පා",
    "mama": "මාමා",
    "gedara": "ගෙදර",
    "yanavaa": "යනවා",
    "karala": "කරලා",
  };

  // Learned patterns (loaded from localStorage)
  private learnedPatterns: Map<string, LearnedPattern> = new Map();

  constructor() {
    this.loadLearnedPatterns();
  }

  /**
   * ප්‍රධාන Conversion Function එක
   * Singlish text එක සිංහල වලට උඩකම් කරනවා
   */
  public convert(singlishText: string): string {
    if (!singlishText || singlishText.trim().length === 0) {
      return "";
    }

    let result = singlishText;
    const words = singlishText.split(/\s+/);

    // Word-by-word conversion
    const convertedWords = words.map((word) => {
      // 1. Check learned patterns first (ඉගෙන ගත් පෝරුවේ)
      const learnedPattern = this.learnedPatterns.get(word.toLowerCase());
      if (learnedPattern) {
        return learnedPattern.output;
      }

      // 2. Use base conversion map
      return this.convertWord(word);
    });

    result = convertedWords.join(" ");
    return result;
  }

  /**
   * තනි වචන එක convert කරනවා
   * Character-by-character mapping එක භාවිතා කරල
   */
  private convertWord(word: string): string {
    let converted = word;
    const lowerWord = word.toLowerCase();

    // Exact match check
    if (this.baseConversionMap[lowerWord]) {
      return this.baseConversionMap[lowerWord];
    }

    // Character sequence matching (longest first)
    const keys = Object.keys(this.baseConversionMap).sort(
      (a, b) => b.length - a.length
    );

    for (const key of keys) {
      if (lowerWord.includes(key)) {
        converted = lowerWord.replaceAll(key, this.baseConversionMap[key]);
      }
    }

    return converted;
  }

  /**
   * API එකෙන් සිංහල පුස්තකාලය ඉගෙන ගන්නවා
   * Debounced function එකේ සිට හඩුවනවා (500ms delay එකින්)
   * 
   * @param singlishText - User typed text
   */
  public async learnFromAPI(singlishText: string): Promise<void> {
    if (!singlishText || singlishText.trim().length === 0) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: singlishText,
          timestamp: Date.now(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`API learning failed: ${response.statusText}`);
        return;
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.converted) {
        // Pattern එක මතක කරගන්න (Local storage එකට save කරනවා)
        this.addLearnedPattern(singlishText, data.converted);

        console.log(`✅ Learned: "${singlishText}" → "${data.converted}"`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("API learning timeout - offline mode activated");
      } else {
        console.error("Learning API error:", error);
      }
      // Graceful failure - offline සිට ගිහින්
    }
  }

  /**
   * Learned pattern එක memory එකට එකතු කරනවා
   */
  private addLearnedPattern(input: string, output: string): void {
    const key = input.toLowerCase();
    const existing = this.learnedPatterns.get(key);

    if (existing) {
      // Frequency එක වැඩි කරනවා
      existing.frequency += 1;
      existing.timestamp = Date.now();
    } else {
      // නව pattern එක එකතු කරනවා
      this.learnedPatterns.set(key, {
        input,
        output,
        frequency: 1,
        timestamp: Date.now(),
      });
    }

    // localStorage එකට save කරනවා
    this.saveLearnedPatterns();
  }

  /**
   * localStorage එකෙන් learned patterns එක load කරනවා
   */
  private loadLearnedPatterns(): void {
    try {
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const patterns = JSON.parse(stored);
        this.learnedPatterns = new Map(patterns);
        console.log(`📚 Loaded ${patterns.length} learned patterns`);
      }
    } catch (error) {
      console.error("Failed to load learned patterns:", error);
    }
  }

  /**
   * localStorage එකට learned patterns එක save කරනවා
   */
  private saveLearnedPatterns(): void {
    try {
      if (typeof window === "undefined") return;

      const patterns = Array.from(this.learnedPatterns.entries());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(patterns));
    } catch (error) {
      console.error("Failed to save learned patterns:", error);
    }
  }

  /**
   * Spell checking එක (සිංහල වචන සඳහා)
   * Learned patterns එකේ සිට suggestions එක provide කරනවා
   */
  public getSuggestion(word: string): string | null {
    const lowerWord = word.toLowerCase();
    const pattern = this.learnedPatterns.get(lowerWord);

    if (pattern) {
      return pattern.output;
    }

    // Fuzzy matching - සමාන words එක සොයනවා
    for (const [key, value] of this.learnedPatterns) {
      if (this.isSimilar(lowerWord, key)) {
        return value.output;
      }
    }

    return null;
  }

  /**
   * දෙයින් වචන සමාන ද නැත්තේ ද බැලුවා (Levenshtein distance එක)
   */
  private isSimilar(a: string, b: string): boolean {
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return distance <= Math.ceil(maxLength * 0.3); // 30% දෝෂය සහ්‍ය කරනවා
  }

  /**
   * Levenshtein distance එක (String similarity)
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * සංගතිකතා clear කරනවා (Cache reset)
   */
  public clearCache(): void {
    this.learnedPatterns.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.CACHE_KEY);
    }
    console.log("✨ Cache cleared");
  }

  /**
   * Stats එක get කරනවා (Debugging සඳහා)
   */
  public getStats(): {
    totalLearned: number;
    topPatterns: LearnedPattern[];
  } {
    const sorted = Array.from(this.learnedPatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      totalLearned: this.learnedPatterns.size,
      topPatterns: sorted,
    };
  }
}
