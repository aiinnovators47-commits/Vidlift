/**
 * Extract relevant tags from video titles using frequency analysis
 * Mimics vidIQ competitor analysis approach
 */

export interface ExtractedTag {
  tag: string
  frequency: number
}

export function extractTags(titles: string[]): ExtractedTag[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
    'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'if', 'else', 'not', 'no', 'yes',
    'shorts', 'video', 'youtube', 'channel', 'subscribe', 'like', 'comment',
    'hd', 'full', 'new', 'best', 'top', 'vs', 'vs.', 'part', 'episode'
  ])

  const frequency: Record<string, number> = {}

  // Process each title
  titles.forEach(title => {
    if (!title) return

    // Normalize: lowercase, remove special chars, split by spaces/punctuation
    const normalized = title
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '') // Keep hyphens for multi-word tags
      .split(/[\s\-]+/)
      .filter(Boolean)

    normalized.forEach(word => {
      // Skip short words and stopwords
      if (word.length < 2 || stopWords.has(word)) {
        return
      }

      frequency[word] = (frequency[word] || 0) + 1
    })

    // Also extract 2-word phrases (bigrams) for better context
    for (let i = 0; i < normalized.length - 1; i++) {
      const word1 = normalized[i]
      const word2 = normalized[i + 1]

      // Only if both words are meaningful
      if (
        word1.length >= 2 && word2.length >= 2 &&
        !stopWords.has(word1) && !stopWords.has(word2)
      ) {
        const bigram = `${word1} ${word2}`
        frequency[bigram] = (frequency[bigram] || 0) + 1
      }
    }
  })

  // Sort by frequency and return
  return Object.entries(frequency)
    .map(([tag, freq]) => ({ tag, frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 30) // Return top 30 candidates for scoring
}

/**
 * Clean and deduplicate tags
 */
export function deduplicateTags(tags: string[]): string[] {
  const seen = new Set<string>()
  return tags.filter(tag => {
    const normalized = tag.toLowerCase().trim()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
