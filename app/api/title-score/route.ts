import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

// Interface for API responses
interface SearchResult {
  id: string
  title: string
  description: string
  viewCount: number
  publishedAt: string
  tags?: string[]
}

interface TitleSuggestion {
  title: string
  searchScore: number
  keywordMatchPercentage: number
  contentType: string
  estimatedCTR: number
}

interface ApiResponse {
  success: boolean
  userInput: string
  searchScore: number
  optimizedUserTitle: string
  top20Titles: TitleSuggestion[]
  relatedKeywords: string[]
  trendInsights: {
    topKeywords: string[]
    avgViewsPerVideo: number
    trendingPatterns: string[]
  }
}

// YouTube autocomplete simulation
const generateAutocompleteVariations = (baseKeyword: string): string[] => {
  const variations: string[] = []

  // Language variations
  const languages = ['hindi', 'tamil', 'english', 'telugu', 'marathi']
  languages.forEach(lang => {
    variations.push(`${baseKeyword} ${lang}`)
  })

  // Intent variations
  const intents = ['short', 'comedy', 'kids', 'story', 'song', 'mein', 'wala', 'kaise banaye']
  intents.forEach(intent => {
    variations.push(`${baseKeyword} ${intent}`)
  })

  // Format variations
  const formats = ['shorts', 'full video', 'viral', 'trending', 'latest']
  formats.forEach(format => {
    variations.push(`${baseKeyword} ${format}`)
  })

  // Time-based variations
  const timeVariations = ['new', 'latest', '2024', '2025', 'trending now']
  timeVariations.forEach(time => {
    variations.push(`${baseKeyword} ${time}`)
  })

  return [...new Set(variations)]
}

// Calculate search score based on multiple factors
const calculateSearchScore = (
  searchResults: SearchResult[],
  keyword: string
): number => {
  if (!searchResults.length) return 20

  let score = 50 // Base score

  // 1. Keyword frequency in titles (0-20 points)
  const keywordFrequency = searchResults.filter(r =>
    r.title.toLowerCase().includes(keyword.toLowerCase())
  ).length
  score += Math.min(20, (keywordFrequency / searchResults.length) * 25)

  // 2. Average views score (0-15 points)
  const avgViews = searchResults.reduce((sum, r) => sum + r.viewCount, 0) / searchResults.length
  const viewsScore = Math.min(15, (Math.log10(avgViews) / 8) * 15)
  score += viewsScore

  // 3. Freshness score (0-10 points)
  const recentCount = searchResults.filter(r => {
    const daysSince = (Date.now() - new Date(r.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince < 30
  }).length
  score += Math.min(10, (recentCount / searchResults.length) * 15)

  // 4. Competition analysis (0-5 points)
  const uniqueKeywordVariations = new Set(
    searchResults.flatMap(r => r.title.toLowerCase().split(' '))
  ).size
  const competitionScore = 5 - Math.min(5, uniqueKeywordVariations / 20)
  score += Math.max(0, competitionScore)

  return Math.min(100, Math.round(score))
}

// Generate optimized title
const optimizeTitle = (userTitle: string, searchResults: SearchResult[]): string => {
  let optimized = userTitle.trim()

  // Extract high-performing keywords from top results
  const topKeywords = new Map<string, number>()
  searchResults.slice(0, 5).forEach(result => {
    result.title.split(' ').forEach(word => {
      if (word.length > 3) {
        topKeywords.set(
          word.toLowerCase(),
          (topKeywords.get(word.toLowerCase()) || 0) + result.viewCount
        )
      }
    })
  })

  // Sort keywords by views
  const sortedKeywords = Array.from(topKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word)

  // Add emotional/intent words
  const emotionalWords = ['Amazing', 'Best', 'Incredible', 'Must Watch', 'Never Seen']
  const hasEmotional = emotionalWords.some(word =>
    optimized.toLowerCase().includes(word.toLowerCase())
  )

  if (!hasEmotional && optimized.length < 50) {
    optimized = emotionalWords[Math.floor(Math.random() * emotionalWords.length)] + ' ' + optimized
  }

  // Keep length between 50-60 characters (YouTube sweet spot)
  if (optimized.length > 60) {
    optimized = optimized.substring(0, 57) + '...'
  }

  return optimized
}

// Generate 20 title suggestions
const generateTitleSuggestions = (
  userInput: string,
  searchResults: SearchResult[],
  searchScore: number
): TitleSuggestion[] => {
  const suggestions: TitleSuggestion[] = []

  // Extract keywords from top results
  const keywordSet = new Map<string, number>()
  searchResults.slice(0, 10).forEach(result => {
    const words = result.title.split(' ')
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (clean.length > 3) {
        keywordSet.set(clean, (keywordSet.get(clean) || 0) + 1)
      }
    })
  })

  const topKeywords = Array.from(keywordSet.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  // Template-based title generation
  const templates = [
    `${userInput} | Best Tutorial 2025`,
    `How to ${userInput} - Complete Guide`,
    `${userInput} Explained | Full Tutorial`,
    `Amazing ${userInput} | You Won't Believe`,
    `${userInput} Shorts | Viral Content`,
    `${userInput} Kids Version | Fun & Educational`,
    `${userInput} Comedy | Funniest Videos`,
    `${userInput} Song | Latest Music`,
    `Top 10 ${userInput} Videos`,
    `${userInput} Trending Now 2025`,
    `Ultimate ${userInput} Guide`,
    `${userInput} for Beginners`,
    `${userInput} Hacks & Tips`,
    `${userInput} Challenge`,
    `${userInput} Fails & Wins`,
    `${userInput} DIY Tutorial`,
    `${userInput} Review & Reaction`,
    `${userInput} Stories & Tales`,
    `${userInput} Motivation`,
    `${userInput} Latest Trends`,
  ]

  // Create suggestions from templates
  templates.forEach((template, index) => {
    const baseScore = Math.max(45, searchScore - Math.random() * 15)
    const contentTypes = ['Short', 'Long', 'Kids', 'Comedy', 'Educational', 'Story', 'Tutorial']
    const contentType = contentTypes[index % contentTypes.length]

    suggestions.push({
      title: template,
      searchScore: Math.round(baseScore),
      keywordMatchPercentage: 65 + Math.random() * 30,
      contentType: contentType,
      estimatedCTR: 4 + Math.random() * 5,
    })
  })

  return suggestions
}

// Mock YouTube Search (In production, replace with actual API call)
const fetchYouTubeSearchResults = async (
  keyword: string
): Promise<SearchResult[]> => {
  try {
    // If API key exists, use actual YouTube API
    // search.list disabled by project policy. Use mostPopular as an approximate fallback.
  if (YOUTUBE_API_KEY) {
      try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&chart=mostPopular&maxResults=20&key=${YOUTUBE_API_KEY}`)
        if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
        const data = await response.json()
        return data.items.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          viewCount: parseInt(item.statistics.viewCount || '0'),
          publishedAt: item.snippet.publishedAt,
          tags: item.snippet.tags || [],
        }))
      } catch (err) {
        console.error('YouTube API error (mostPopular fallback):', err)
        return generateMockSearchResults(keyword)
      }
    }

    // Fallback: Mock data for testing without API key
    return generateMockSearchResults(keyword)
  } catch (error) {
    console.error('YouTube API error:', error)
    // Return mock data on error
    return generateMockSearchResults(keyword)
  }
}

// Generate mock search results for testing
const generateMockSearchResults = (keyword: string): SearchResult[] => {
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: `Amazing ${keyword} Tutorial | Complete Guide 2025`,
      description: `Learn everything about ${keyword}`,
      viewCount: 150000 + Math.random() * 500000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [keyword, 'tutorial', 'guide'],
    },
    {
      id: '2',
      title: `${keyword} Explained | Best Methods`,
      description: `Deep dive into ${keyword}`,
      viewCount: 200000 + Math.random() * 400000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [keyword, 'tips', 'tricks'],
    },
    {
      id: '3',
      title: `How to ${keyword} - Beginner's Guide`,
      description: `Start learning ${keyword} today`,
      viewCount: 100000 + Math.random() * 300000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [keyword, 'beginner', 'tutorial'],
    },
    {
      id: '4',
      title: `${keyword} Shorts | Viral Compilation`,
      description: `Best ${keyword} shorts`,
      viewCount: 250000 + Math.random() * 300000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [keyword, 'shorts', 'viral'],
    },
    {
      id: '5',
      title: `${keyword} Comedy | Funniest Moments`,
      description: `Laugh with the best ${keyword} content`,
      viewCount: 180000 + Math.random() * 420000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [keyword, 'comedy', 'funny'],
    },
  ]

  // Add more mock results to simulate realistic data
  for (let i = 5; i < 15; i++) {
    mockResults.push({
      id: String(i),
      title: `${keyword} Video ${i}`,
      description: `Description for ${keyword} video ${i}`,
      viewCount: 100000 + Math.random() * 500000,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [keyword],
    })
  }

  return mockResults
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword } = body

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid keyword provided' },
        { status: 400 }
      )
    }

    const trimmedKeyword = keyword.trim()

    // Fetch YouTube search results
    const searchResults = await fetchYouTubeSearchResults(trimmedKeyword)

    // Calculate search score
    const searchScore = calculateSearchScore(searchResults, trimmedKeyword)

    // Generate optimized title
    const optimizedTitle = optimizeTitle(trimmedKeyword, searchResults)

    // Generate 20 title suggestions
    const suggestions = generateTitleSuggestions(trimmedKeyword, searchResults, searchScore)

    // Generate related keywords (autocomplete variations)
    const autocompleteVariations = generateAutocompleteVariations(trimmedKeyword)
    const relatedKeywords = autocompleteVariations.slice(0, 15)

    // Extract trend insights - use REAL tags from YouTube videos, not made-up keywords
    // Collect all real tags from search results
    const allRealTags = new Map<string, number>()
    searchResults.forEach(result => {
      if (result.tags && Array.isArray(result.tags)) {
        result.tags.forEach(tag => {
          const cleanTag = tag.toLowerCase().trim()
          if (cleanTag.length > 0) {
            allRealTags.set(cleanTag, (allRealTags.get(cleanTag) || 0) + 1)
          }
        })
      }
    })
    
    // Get top real tags used by creators
    const topKeywords = Array.from(allRealTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)
    
    // If no real tags found, fall back to keyword extraction from titles (but limited)
    if (topKeywords.length === 0) {
      const titleKeywords = Array.from(
        new Map(
          searchResults
            .flatMap(r => r.title.split(' '))
            .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(word.toLowerCase()))
            .map(word => [word.toLowerCase(), 1])
        )
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word)
      topKeywords.push(...titleKeywords)
    }

    const avgViews =
      searchResults.reduce((sum, r) => sum + r.viewCount, 0) / searchResults.length

    const trendingPatterns = [
      searchResults.length > 10 ? 'High competition keyword' : 'Niche keyword',
      avgViews > 500000 ? 'High average views' : 'Moderate views',
      'Rising trend in YouTube searches',
    ]

    const response: ApiResponse = {
      success: true,
      userInput: trimmedKeyword,
      searchScore,
      optimizedUserTitle: optimizedTitle,
      top20Titles: suggestions,
      relatedKeywords,
      trendInsights: {
        topKeywords,
        avgViewsPerVideo: Math.round(avgViews),
        trendingPatterns,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Title score API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate title suggestions' },
      { status: 500 }
    )
  }
}
