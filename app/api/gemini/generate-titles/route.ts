import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, videoId, description, videoStats } = await request.json()

    if (!originalTitle) {
      return NextResponse.json({ error: 'Original title is required' }, { status: 400 })
    }

    // Simulate AI title generation with realistic logic
    // In production, this would call Gemini Flash 2.5 Lite API
    const generatedTitles = await simulateAITitleGeneration(originalTitle, description, videoStats)
    
    return NextResponse.json({ titles: generatedTitles })
  } catch (error) {
    console.error('Error generating AI titles:', error)
    return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 })
  }
}

async function simulateAITitleGeneration(originalTitle: string, description: string, videoStats: any) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200))

  const baseTitle = originalTitle.replace(/^(how to|best|easy|quick|ultimate|simple|complete)/i, '').trim()
  const titleWords = baseTitle.split(/\s+/).filter(word => word.length > 3)
  
  // Extract key topics from description if available
  let keyTopics = []
  if (description) {
    const descWords = description.toLowerCase().split(/\s+/)
    const topicKeywords = ['tutorial', 'guide', 'tips', 'tricks', 'secrets', 'beginner', 'advanced', 'pro', 'expert', 'learn']
    keyTopics = topicKeywords.filter(keyword => descWords.some(word => word.includes(keyword)))
  }

  const prefixes = [
    'How to', 'Best', 'Easy', 'Quick', 'Ultimate', 'Simple', 'Complete',
    'Master', 'Proven', 'Effective', 'Amazing', 'Shocking', 'Mind Blowing'
  ]
  
  const suffixes = [
    'Tips', 'Guide', 'Tutorial', 'Explained', 'Step by Step', 'For Beginners',
    'Secrets', 'Tricks', 'Hacks', 'That Work', 'You Need to Know', '2025'
  ]

  const generatedTitles = []

  // Generate 6 diverse titles
  for (let i = 0; i < 6; i++) {
    let newTitle = ''
    
    // Strategy 1: Prefix + Base + Suffix
    if (i < 2) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      newTitle = `${prefix} ${baseTitle} ${suffix}`
    }
    // Strategy 2: Question format
    else if (i < 4) {
      const questions = [
        `What ${baseTitle}?`,
        `How to Master ${baseTitle}`,
        `Why ${baseTitle} Matters`,
        `The Ultimate Guide to ${baseTitle}`
      ]
      newTitle = questions[i - 2]
    }
    // Strategy 3: List format with numbers
    else {
      const numbers = [5, 7, 10, 3]
      const number = numbers[i - 4]
      newTitle = `${number} ${baseTitle} Tips That Actually Work`
    }

    // Ensure title is within YouTube limits and optimize
    if (newTitle.length > 100) {
      newTitle = newTitle.substring(0, 97) + '...'
    }

    generatedTitles.push(newTitle)
  }

  // Add performance-based optimizations if stats are provided
  if (videoStats) {
    const views = parseInt(videoStats.views) || 0
    const likes = parseInt(videoStats.likes) || 0
    const engagementRate = views > 0 ? (likes / views) * 100 : 0

    if (engagementRate > 5) {
      // High engagement - emphasize proven results
      generatedTitles.unshift(`Proven ${baseTitle} Methods That Boost Engagement`)
    }
    
    if (views > 10000) {
      // Popular content - emphasize authority
      generatedTitles.unshift(`Expert ${baseTitle} Techniques Used by Top Creators`)
    }
  }

  // Remove duplicates and limit to 8 titles
  const uniqueTitles = [...new Set(generatedTitles)].slice(0, 8)
  
  return uniqueTitles
}