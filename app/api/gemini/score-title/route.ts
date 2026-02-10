import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, videoId, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Simulate AI scoring with realistic logic
    // In production, this would call Gemini Flash 2.5 Lite API
    const scoreResult = await simulateAIScoring(title, description)
    
    return NextResponse.json(scoreResult)
  } catch (error) {
    console.error('Error scoring title:', error)
    return NextResponse.json({ error: 'Failed to score title' }, { status: 500 })
  }
}

async function simulateAIScoring(title: string, description: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))

  let score = 50 // Base score
  const metrics: any = {}

  // Length analysis
  const length = title.length
  metrics.length = length
  if (length >= 40 && length <= 60) {
    score += 25
    metrics.lengthScore = "Perfect length for YouTube SEO ✅"
  } else if (length >= 30 && length <= 70) {
    score += 15
    metrics.lengthScore = "Good length for engagement"
  } else if (length < 30) {
    metrics.lengthScore = "Too short - consider adding more context"
  } else {
    metrics.lengthScore = "Too long - may get cut off in search results"
  }

  // Power word detection
  const powerWords = ['how to', 'best', 'easy', 'quick', 'ultimate', 'complete', 'pro', 'tips', 'guide', 'tutorial', 'secret', 'simple', 'effective']
  const titleLower = title.toLowerCase()
  const foundPowerWords = powerWords.filter(word => titleLower.includes(word))
  
  if (foundPowerWords.length >= 2) {
    score += 20
    metrics.powerWords = `Strong engagement keywords detected: ${foundPowerWords.join(', ')} ✅`
  } else if (foundPowerWords.length === 1) {
    score += 10
    metrics.powerWords = `Found engagement keyword: ${foundPowerWords[0]}`
  } else {
    metrics.powerWords = "Consider adding power words like 'How to', 'Best', 'Easy'"
  }

  // Number detection
  const hasNumbers = /\d+/.test(title)
  if (hasNumbers) {
    score += 15
    metrics.numbers = "Includes numbers - great for listicles and tutorials ✅"
  } else {
    metrics.numbers = "Consider adding numbers for better click-through rates"
  }

  // Question format
  const isQuestion = /[?¿]/.test(title) || titleLower.startsWith('how') || titleLower.startsWith('what') || titleLower.startsWith('why')
  if (isQuestion) {
    score += 10
    metrics.question = "Question format - excellent for curiosity-driven clicks ✅"
  } else {
    metrics.question = "Could use question format to increase engagement"
  }

  // Emotional trigger words
  const emotionalWords = ['amazing', 'shocking', 'mind blowing', 'unbelievable', 'insane', 'crazy', 'epic', 'life changing']
  const hasEmotionalWords = emotionalWords.some(word => titleLower.includes(word))
  if (hasEmotionalWords) {
    score += 10
    metrics.emotional = "Contains emotional triggers - boosts engagement ✅"
  } else {
    metrics.emotional = "Consider adding emotional triggers for higher CTR"
  }

  // Clamp final score
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Generate improvement suggestions
  const suggestions = []
  if (length < 40) suggestions.push("Make title more descriptive")
  if (length > 70) suggestions.push("Shorten title for better visibility")
  if (foundPowerWords.length === 0) suggestions.push("Add power words like 'How to' or 'Best'")
  if (!hasNumbers) suggestions.push("Include numbers for list-style content")
  if (!isQuestion && !hasEmotionalWords) suggestions.push("Add curiosity or emotional elements")

  return {
    score,
    metrics,
    suggestions: suggestions.length > 0 ? suggestions : ["Title looks great! Ready for upload."],
    analysis: `This title scores ${score}/100. ${score >= 80 ? 'Excellent optimization!' : score >= 60 ? 'Good potential with minor improvements.' : 'Needs optimization for better performance.'}`
  }
}