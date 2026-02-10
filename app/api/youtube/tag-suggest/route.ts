import { NextResponse } from 'next/server'
import { extractTags, deduplicateTags } from '@/lib/extractTags'
import { scoreMultipleTags, filterTagsByScore } from '@/lib/scoreTag'

/**
 * POST /api/youtube/tag-suggest
 * 
 * Analyzes video titles and returns scored tags (vidIQ-style)
 * 
 * Request body:
 * {
 *   titles: string[]  // Array of video titles to analyze
 *   minScore?: number // Minimum tag score (default: 30)
 *   maxResults?: number // Max tags to return (default: 20)
 * }
 * 
 * Response:
 * {
 *   tags: Array<{
 *     tag: string
 *     score: number (0-100)
 *     viralScore: number (0-100)
 *     color: string (tailwind color)
 *     confidence: 'high' | 'medium' | 'low'
 *   }>
 *   analysis: {
 *     titlesAnalyzed: number
 *     uniqueTagsFound: number
 *     avgScore: number
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      titles = [],
      minScore = 30,
      maxResults = 20
    } = body

    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({
        error: 'titles array required and must not be empty',
        tags: []
      }, { status: 400 })
    }

    // Extract tags from titles using frequency analysis
    const extractedTags = extractTags(titles)

    if (extractedTags.length === 0) {
      return NextResponse.json({
        tags: [],
        analysis: {
          titlesAnalyzed: titles.length,
          uniqueTagsFound: 0,
          avgScore: 0,
          message: 'No tags extracted from titles'
        }
      })
    }

    // Score all extracted tags
    const scoredTags = scoreMultipleTags(extractedTags)

    // Filter by minimum score and get top results
    const filteredTags = filterTagsByScore(scoredTags, minScore, maxResults)

    // Calculate statistics
    const avgScore = filteredTags.length > 0
      ? Math.round(filteredTags.reduce((sum, t) => sum + t.score, 0) / filteredTags.length)
      : 0

    return NextResponse.json({
      tags: filteredTags,
      analysis: {
        titlesAnalyzed: titles.length,
        uniqueTagsFound: extractedTags.length,
        filteredTagsCount: filteredTags.length,
        avgScore,
        minScoreUsed: minScore,
        totalExtracted: extractedTags.length
      },
      success: true
    })
  } catch (error) {
    console.error('[API] /youtube/tag-suggest error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to suggest tags',
      tags: [],
      success: false
    }, { status: 500 })
  }
}

/**
 * GET /api/youtube/tag-suggest
 * Get tag suggestions based on a single keyword/title
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const title = url.searchParams.get('title')
    const minScore = parseInt(url.searchParams.get('minScore') || '30')
    const maxResults = parseInt(url.searchParams.get('maxResults') || '20')

    if (!title || !title.trim()) {
      return NextResponse.json({
        error: 'title parameter required',
        tags: []
      }, { status: 400 })
    }

    const extractedTags = extractTags([title])

    if (extractedTags.length === 0) {
      return NextResponse.json({
        tags: [],
        analysis: {
          titlesAnalyzed: 1,
          uniqueTagsFound: 0,
          avgScore: 0,
          message: 'No tags extracted'
        }
      })
    }

    const scoredTags = scoreMultipleTags(extractedTags)
    const filteredTags = filterTagsByScore(scoredTags, minScore, maxResults)

    const avgScore = filteredTags.length > 0
      ? Math.round(filteredTags.reduce((sum, t) => sum + t.score, 0) / filteredTags.length)
      : 0

    return NextResponse.json({
      tags: filteredTags,
      analysis: {
        titlesAnalyzed: 1,
        uniqueTagsFound: extractedTags.length,
        filteredTagsCount: filteredTags.length,
        avgScore,
        minScoreUsed: minScore
      },
      success: true
    })
  } catch (error) {
    console.error('[API] GET /youtube/tag-suggest error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to suggest tags',
      tags: [],
      success: false
    }, { status: 500 })
  }
}
