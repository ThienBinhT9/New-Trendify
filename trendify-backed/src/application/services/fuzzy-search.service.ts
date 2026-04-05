// ============================================================================
// FUZZY SEARCH SERVICE
// ============================================================================

/**
 * Provides typo tolerance for search queries.
 * No external dependencies — uses Levenshtein distance + trigram matching.
 */
export class FuzzySearchService {
  /**
   * Tính Levenshtein distance giữa 2 strings
   */
  static levenshteinDistance(a: string, b: string): number {
    const la = a.length;
    const lb = b.length;

    // Optimize: nếu 1 string rỗng → distance = length of the other
    if (la === 0) return lb;
    if (lb === 0) return la;

    // DP matrix
    const matrix: number[][] = Array.from({ length: la + 1 }, () =>
      new Array(lb + 1).fill(0),
    );

    for (let i = 0; i <= la; i++) matrix[i][0] = i;
    for (let j = 0; j <= lb; j++) matrix[0][j] = j;

    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return matrix[la][lb];
  }

  /**
   * Tính max edit distance dựa trên độ dài query
   */
  static getMaxEditDistance(query: string): number {
    const len = query.length;
    if (len <= 3) return 1;
    if (len <= 7) return 2;
    return 3;
  }

  /**
   * Check xem candidate có khớp fuzzy với query không
   */
  static isFuzzyMatch(query: string, candidate: string): boolean {
    const q = query.toLowerCase();
    const c = candidate.toLowerCase();

    const maxDist = FuzzySearchService.getMaxEditDistance(q);
    const distance = FuzzySearchService.levenshteinDistance(q, c);

    return distance <= maxDist;
  }

  /**
   * Tạo trigrams từ string
   * "hello" → ["hel", "ell", "llo"]
   */
  static generateTrigrams(text: string): Set<string> {
    const normalized = text.toLowerCase();
    const trigrams = new Set<string>();

    for (let i = 0; i <= normalized.length - 3; i++) {
      trigrams.add(normalized.substring(i, i + 3));
    }

    return trigrams;
  }

  /**
   * Tính trigram similarity (Jaccard index) giữa 2 strings
   * Returns value từ 0 → 1 (1 = identical)
   */
  static trigramSimilarity(a: string, b: string): number {
    const trigramsA = FuzzySearchService.generateTrigrams(a);
    const trigramsB = FuzzySearchService.generateTrigrams(b);

    if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

    let intersection = 0;
    for (const t of trigramsA) {
      if (trigramsB.has(t)) intersection++;
    }

    const union = trigramsA.size + trigramsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Loại bỏ Vietnamese diacritics
   * "nguyễn" → "nguyen"
   */
  static removeDiacritics(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  /**
   * Tạo regex pattern cho fuzzy search
   * Dùng khi text search trả về 0 results
   */
  static buildFuzzyRegex(query: string): RegExp {
    const normalized = FuzzySearchService.removeDiacritics(query.toLowerCase());
    const chars = normalized.split("");

    // Allow 1 optional char between each char (simple fuzzy)
    const pattern = chars.map((c) => {
      // Escape regex special chars
      const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return `${escaped}.?`;
    }).join("");

    return new RegExp(pattern, "i");
  }

  /**
   * Filter candidates bằng fuzzy matching
   * Returns candidates sorted by similarity
   */
  static fuzzyFilter(
    query: string,
    candidates: string[],
    options?: { maxResults?: number; minSimilarity?: number },
  ): Array<{ text: string; similarity: number }> {
    const { maxResults = 10, minSimilarity = 0.3 } = options ?? {};
    const normalizedQuery = FuzzySearchService.removeDiacritics(query.toLowerCase());

    const results = candidates
      .map((candidate) => {
        const normalizedCandidate = FuzzySearchService.removeDiacritics(candidate.toLowerCase());

        // Combined score: Levenshtein + Trigram
        const maxDist = FuzzySearchService.getMaxEditDistance(normalizedQuery);
        const levDist = FuzzySearchService.levenshteinDistance(normalizedQuery, normalizedCandidate);
        const trigramSim = FuzzySearchService.trigramSimilarity(normalizedQuery, normalizedCandidate);

        // Normalize Levenshtein to 0-1 range (1 = perfect match)
        const maxLen = Math.max(normalizedQuery.length, normalizedCandidate.length);
        const levSim = maxLen === 0 ? 1 : 1 - levDist / maxLen;

        // Combined similarity: weighted average
        const similarity = levSim * 0.6 + trigramSim * 0.4;

        return {
          text: candidate,
          similarity,
          withinEditDistance: levDist <= maxDist,
        };
      })
      .filter((r) => r.withinEditDistance || r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);

    return results.map(({ text, similarity }) => ({ text, similarity }));
  }
}
