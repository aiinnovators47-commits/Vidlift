import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  calculateTitleScore,
  extractKeywords,
  expandKeywordQueries,
  estimateSearchDemand,
  estimateCompetition,
  estimateTrend,
  generateTitleSuggestions,
} from '@/lib/youtubeAnalyzer';

export async function POST(request: NextRequest) {
  // Helper: fetch with timeout
  const fetchWithTimeout = async (url: string, opts: any = {}, timeoutMs = 8000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal })
      clearTimeout(id)
      return res
    } catch (err) {
      clearTimeout(id)
      throw err
    }
  }

  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    const warnings: string[] = []

    // Step 1: Calculate base title score
    const titleAnalysis = calculateTitleScore(title);

    // Step 2: Extract keywords
    const keywords = extractKeywords(title);

    if (keywords.length === 0) {
      // Do not fail - proceed with partial data and warn the client
      warnings.push('Could not extract meaningful keywords from title')
    }

    // Step 3: Get real YouTube search queries
    const primaryKeyword = keywords.slice(0, 3).join(' ');
    let searchQueries: string[] = []
    try {
      if (primaryKeyword) {
        searchQueries = await expandKeywordQueries(primaryKeyword)
      } else {
        searchQueries = []
      }
    } catch (err: any) {
      console.error('Failed to expand keyword queries:', err)
      warnings.push('Failed to fetch autocomplete suggestions')
      searchQueries = []
    }

    // Step 4: Calculate keyword match score
    const keywordMatchScore = calculateKeywordMatchScore(title, searchQueries);
    titleAnalysis.breakdown.keywordScore = keywordMatchScore;

    // Step 5: Fetch search results count for competition analysis
    const apiKey = process.env.YOUTUBE_API_KEY;
    let resultsCount = 0;
    
    if (apiKey && primaryKeyword) {
      // search.list disabled by project policy — we cannot fetch totalResults. Set to 0 and warn.
      console.warn('search.list disabled — skipping search result count')
      warnings.push('Search API disabled on this deployment; competition estimates are approximate')
      resultsCount = 0
    }

    // Step 6: Calculate competition score
    const competition = estimateCompetition(resultsCount);
    const competitionScore = competition === 'LOW' ? 15 : competition === 'MEDIUM' ? 10 : 5;
    titleAnalysis.breakdown.competitionScore = competitionScore;

    // Step 7: Calculate final score
    const finalScore = Math.min(
      Math.round(
        titleAnalysis.breakdown.lengthScore +
        titleAnalysis.breakdown.keywordScore +
        titleAnalysis.breakdown.powerWordsScore +
        titleAnalysis.breakdown.freshnessScore +
        titleAnalysis.breakdown.clarityScore +
        titleAnalysis.breakdown.competitionScore
      ),
      100
    );

    // Step 8: Estimate metrics
    const searchDemand = estimateSearchDemand(searchQueries.length, resultsCount);
    const trend = estimateTrend(title);

    // Step 9: Generate improved titles locally
    const suggestedTitles = generateTitleSuggestions(title, keywords);

    // Step 10: Return comprehensive analysis with warnings if any
    return NextResponse.json({
      titleScore: finalScore,
      status: getScoreStatus(finalScore),
      breakdown: titleAnalysis.breakdown,
      recommendations: titleAnalysis.recommendations,
      searchQueries: searchQueries.slice(0, 10), // Return top 10 queries
      totalSearchQueries: searchQueries.length,
      searchDemand,
      competition,
      trend,
      suggestedTitles,
      keywords,
      disclaimer: 'Keyword insights are estimated using public YouTube autocomplete and video performance signals. YouTube does not provide exact search volume.',
      warnings,
    });

  } catch (error: any) {
    console.error('Error analyzing video title:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate how well the title matches popular search queries
 */
function calculateKeywordMatchScore(title: string, searchQueries: string[]): number {
  const lowerTitle = title.toLowerCase();
  
  let matchCount = 0;
  for (const query of searchQueries.slice(0, 20)) {
    const queryWords = query.toLowerCase().split(' ');
    const matchedWords = queryWords.filter(word => lowerTitle.includes(word));
    
    if (matchedWords.length >= queryWords.length * 0.6) {
      matchCount++;
    }
  }
  
  // Score out of 25
  const score = Math.min(Math.round((matchCount / 20) * 25), 25);
  return score;
}

/**
 * Get score status label
 */
function getScoreStatus(score: number): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'AVERAGE';
  return 'POOR';
}
