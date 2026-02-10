/**
 * vidIQ-style tag scoring system
 * Calculates tag relevance and viral potential
 */

export interface ScoredTag {
  tag: string
  score: number
  viralScore: number
  color: 'green' | 'yellow' | 'red' | 'emerald' | 'orange' | 'blue' | 'amber' | 'purple' | 'rose' | 'cyan' | 'indigo'
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Calculate a tag's relevance score (0-100)
 * Based on frequency across competitor videos
 */
export function scoreTag(frequency: number, maxFrequency: number): number {
  if (maxFrequency === 0) return 50

  const rawScore = Math.round((frequency / maxFrequency) * 100)
  // Cap at 99 to leave room for manual boosting
  return Math.min(rawScore, 99)
}

/**
 * Assign color based on score (vidIQ-style)
 */
export function getScoreColor(score: number): ScoredTag['color'] {
  if (score >= 75) return 'emerald'      // High relevance - Green
  if (score >= 60) return 'orange'       // Good relevance - Orange
  if (score >= 45) return 'blue'         // Moderate relevance - Blue
  if (score >= 30) return 'amber'        // Lower relevance - Amber
  if (score >= 20) return 'rose'         // Low relevance - Rose
  return 'purple'                        // Minimal relevance - Purple
}

/**
 * Determine confidence level based on score
 */
export function getConfidenceLevel(score: number): ScoredTag['confidence'] {
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Generate viral score (0-100) based on tag characteristics
 * Combines:
 * - Frequency score
 * - Tag length (optimal 1-3 words)
 * - Uniqueness (lower frequency = more niche potential)
 */
export function calculateViralScore(
  tagScore: number,
  wordCount: number,
  totalOccurrences: number,
  maxOccurrences: number
): number {
  // Base: frequency-based score
  let viralScore = tagScore

  // Bonus for optimal length (1-3 words is best)
  if (wordCount >= 1 && wordCount <= 3) {
    viralScore += 10
  } else if (wordCount === 4) {
    viralScore += 5
  } else {
    viralScore -= 5
  }

  // Bonus for niche tags (lower frequency = more untapped potential)
  const trendingRatio = totalOccurrences / maxOccurrences
  if (trendingRatio <= 0.3) {
    viralScore += 15 // Niche/emerging tag
  } else if (trendingRatio <= 0.5) {
    viralScore += 5  // Moderate trending
  }

  return Math.min(Math.max(viralScore, 0), 99)
}

/**
 * Score multiple tags at once
 */
export function scoreMultipleTags(
  tags: Array<{ tag: string; frequency: number }>,
  options?: {
    maxViralScore?: boolean
  }
): ScoredTag[] {
  const maxFreq = Math.max(...tags.map(t => t.frequency), 1)

  return tags.map(({ tag, frequency }) => {
    const score = scoreTag(frequency, maxFreq)
    const wordCount = tag.split(' ').length
    const viralScore = calculateViralScore(score, wordCount, frequency, maxFreq)
    const color = getScoreColor(score)
    const confidence = getConfidenceLevel(score)

    return {
      tag,
      score,
      viralScore,
      color,
      confidence
    }
  })
}

/**
 * Filter and sort tags by score
 */
export function filterTagsByScore(
  tags: ScoredTag[],
  minScore: number = 30,
  maxResults: number = 20
): ScoredTag[] {
  return tags
    .filter(t => t.score >= minScore)
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, maxResults)
}
