/**
 * YouTube Title Analyzer Utility
 * Provides scoring and analysis functions for YouTube video titles
 */

interface TitleAnalysis {
  titleScore: number;
  breakdown: {
    lengthScore: number;
    keywordScore: number;
    powerWordsScore: number;
    freshnessScore: number;
    clarityScore: number;
    competitionScore: number;
  };
  recommendations: string[];
}

// Power words that perform well in YouTube titles
const POWER_WORDS = [
  'ultimate', 'complete', 'guide', 'secret', 'proven', 'best', 'top',
  'amazing', 'easy', 'simple', 'quick', 'fast', 'step-by-step',
  'how to', 'tutorial', 'tips', 'tricks', 'hacks', 'master',
  'beginner', 'advanced', 'pro', 'expert', 'free', 'new'
];

// Stop words to extract meaningful keywords
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
]);

/**
 * Calculate title score based on multiple factors
 */
export function calculateTitleScore(title: string): TitleAnalysis {
  const breakdown = {
    lengthScore: calculateLengthScore(title),
    keywordScore: 0, // Will be set based on search queries
    powerWordsScore: calculatePowerWordsScore(title),
    freshnessScore: calculateFreshnessScore(title),
    clarityScore: calculateClarityScore(title),
    competitionScore: 0, // Will be set based on competition analysis
  };

  const totalScore = Math.round(
    breakdown.lengthScore +
    breakdown.powerWordsScore +
    breakdown.freshnessScore +
    breakdown.clarityScore
  );

  const recommendations = generateRecommendations(title, breakdown);

  return {
    titleScore: totalScore,
    breakdown,
    recommendations,
  };
}

/**
 * Length optimization (20 points max)
 * Optimal: 50-70 characters
 */
function calculateLengthScore(title: string): number {
  const length = title.length;
  
  if (length >= 50 && length <= 70) {
    return 20;
  } else if (length >= 40 && length < 50) {
    return 15;
  } else if (length > 70 && length <= 80) {
    return 15;
  } else if (length >= 30 && length < 40) {
    return 10;
  } else if (length > 80 && length <= 100) {
    return 10;
  } else {
    return 5;
  }
}

/**
 * Power words detection (15 points max)
 */
function calculatePowerWordsScore(title: string): number {
  const lowerTitle = title.toLowerCase();
  const foundPowerWords = POWER_WORDS.filter(word => 
    lowerTitle.includes(word)
  );
  
  const count = foundPowerWords.length;
  if (count >= 3) return 15;
  if (count === 2) return 12;
  if (count === 1) return 8;
  return 0;
}

/**
 * Freshness/Year detection (10 points max)
 */
function calculateFreshnessScore(title: string): number {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  if (title.includes(currentYear.toString())) return 10;
  if (title.includes(nextYear.toString())) return 10;
  if (title.toLowerCase().includes('new') || 
      title.toLowerCase().includes('latest') ||
      title.toLowerCase().includes('updated')) return 7;
  
  return 0;
}

/**
 * Clarity score (15 points max)
 * Based on readability and structure
 */
function calculateClarityScore(title: string): number {
  let score = 0;
  
  // Has numbers (engaging)
  if (/\d+/.test(title)) score += 5;
  
  // Starts with question word or "how to"
  if (/^(how|what|why|when|where|who)/i.test(title)) score += 5;
  
  // Has brackets/parentheses (additional context)
  if (/[\(\)\[\]]/.test(title)) score += 3;
  
  // Not too many special characters
  const specialChars = (title.match(/[!?|:]/g) || []).length;
  if (specialChars <= 2) score += 2;
  
  return Math.min(score, 15);
}

/**
 * Extract meaningful keywords from title
 */
export function extractKeywords(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  return [...new Set(words)];
}

/**
 * Generate title improvement recommendations
 */
function generateRecommendations(title: string, breakdown: any): string[] {
  const recommendations: string[] = [];
  
  if (breakdown.lengthScore < 15) {
    if (title.length < 40) {
      recommendations.push('Consider making your title longer (50-70 characters is optimal)');
    } else {
      recommendations.push('Your title is too long - try to keep it under 70 characters');
    }
  }
  
  if (breakdown.powerWordsScore < 8) {
    recommendations.push('Add power words like "Ultimate", "Complete", "Best", or "Easy"');
  }
  
  if (breakdown.freshnessScore === 0) {
    recommendations.push(`Add the current year (${new Date().getFullYear()}) to show freshness`);
  }
  
  if (breakdown.clarityScore < 10) {
    recommendations.push('Make your title more specific - add numbers, brackets, or clear benefits');
  }
  
  if (!title.toLowerCase().includes('how to') && 
      !/^(what|why|when|where)/i.test(title)) {
    recommendations.push('Consider starting with "How to" for instructional content');
  }
  
  return recommendations;
}

/**
 * Fetch YouTube autocomplete suggestions
 */
export async function fetchYouTubeAutocomplete(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data[1] || [];
  } catch (error) {
    console.error('Autocomplete fetch error:', error);
    return [];
  }
}

/**
 * Expand keywords using alphabet soup method
 */
export async function expandKeywordQueries(baseKeyword: string): Promise<string[]> {
  const allQueries = new Set<string>();
  
  // Base query
  const baseResults = await fetchYouTubeAutocomplete(baseKeyword);
  baseResults.forEach(q => allQueries.add(q));
  
  // Alphabet expansion (a-z)
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  
  // Limit to first 10 letters to avoid rate limits
  const limitedAlphabet = alphabet.slice(0, 10);
  
  for (const letter of limitedAlphabet) {
    const query = `${baseKeyword} ${letter}`;
    const results = await fetchYouTubeAutocomplete(query);
    results.forEach(q => allQueries.add(q));
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return Array.from(allQueries);
}

/**
 * Estimate search demand level
 */
export function estimateSearchDemand(queriesCount: number, avgResults: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  // More autocomplete suggestions = higher search demand
  if (queriesCount > 30) return 'HIGH';
  if (queriesCount > 15) return 'MEDIUM';
  return 'LOW';
}

/**
 * Estimate competition level
 */
export function estimateCompetition(resultsCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  // More search results = higher competition
  if (resultsCount > 500000) return 'HIGH';
  if (resultsCount > 100000) return 'MEDIUM';
  return 'LOW';
}

/**
 * Determine trend direction
 */
export function estimateTrend(title: string): 'RISING' | 'STABLE' | 'DECLINING' {
  const currentYear = new Date().getFullYear();
  const lowerTitle = title.toLowerCase();
  
  // Has current year or trending terms
  if (lowerTitle.includes(currentYear.toString()) || 
      lowerTitle.includes('new') || 
      lowerTitle.includes('latest') ||
      lowerTitle.includes('2026')) {
    return 'RISING';
  }
  
  // Has old year
  if (lowerTitle.includes('2024') || lowerTitle.includes('2023')) {
    return 'DECLINING';
  }
  
  return 'STABLE';
}

/**
 * Generate improved title suggestions
 */
export function generateTitleSuggestions(
  originalTitle: string,
  keywords: string[],
  powerWords: string[] = ['Ultimate', 'Complete', 'Easy', 'Fast']
): string[] {
  const currentYear = new Date().getFullYear();
  const suggestions: string[] = [];
  
  // Extract main topic
  const mainKeywords = keywords.slice(0, 3).join(' ');
  
  // Template 1: How-to format
  suggestions.push(
    `How to ${mainKeywords} in ${currentYear} (Step-by-Step Guide)`
  );
  
  // Template 2: Ultimate guide
  suggestions.push(
    `The Ultimate Guide to ${mainKeywords} for Beginners`
  );
  
  // Template 3: Number-based
  suggestions.push(
    `7 Proven Ways to ${mainKeywords} Fast in ${currentYear}`
  );
  
  // Template 4: Transformation
  suggestions.push(
    `${mainKeywords}: Complete ${currentYear} Tutorial`
  );
  
  // Template 5: Problem-solution
  if (keywords.length > 0) {
    suggestions.push(
      `${capitalizeFirst(keywords[0])} Made Easy: ${currentYear} Method`
    );
  }
  
  return suggestions;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
