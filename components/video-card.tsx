"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Loader2, X, Lock, Youtube, Play, Eye, Heart, MessageCircle, Clock, Sparkles, Zap, Trophy, Star, Shield, Unlock, Globe } from "lucide-react"
import { CREDIT_COSTS } from "@/models/Credit"

// Country list for localized content generation
const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', language: 'English', tone: 'Engaging, energetic, value-focused' },
  { code: 'US', name: 'United States', flag: '🇺🇸', language: 'English', tone: 'Direct, professional, action-oriented' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', language: 'English', tone: 'Formal, sophisticated, informative' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', language: 'Portuguese', tone: 'Warm, personal, community-focused' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', language: 'Spanish', tone: 'Friendly, accessible, cultural' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', language: 'Spanish', tone: 'Passionate, detailed, entertaining' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', language: 'Italian', tone: 'Stylish, sophisticated, artistic' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', language: 'German', tone: 'Precise, technical, comprehensive' },
  { code: 'FR', name: 'France', flag: '🇫🇷', language: 'French', tone: 'Elegant, refined, intellectual' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', language: 'Japanese', tone: 'Polite, detailed, systematic' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', language: 'Korean', tone: 'Modern, trendy, organized' },
  { code: 'CN', name: 'China', flag: '🇨🇳', language: 'Mandarin', tone: 'Dynamic, innovative, community-driven' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', language: 'Russian', tone: 'Intellectual, detailed, professional' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', language: 'Arabic/English', tone: 'Luxury-focused, professional, modern' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', language: 'English', tone: 'Energetic, relatable, community-oriented' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', language: 'English', tone: 'Friendly, authentic, inspiring' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', language: 'English', tone: 'Casual, humorous, adventurous' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', language: 'English', tone: 'Friendly, inclusive, helpful' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', language: 'English', tone: 'Tech-savvy, efficient, multicultural' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', language: 'Indonesian', tone: 'Warm, community-focused, practical' },
]

interface VideoCardProps {
  video: {
    id: string
    title: string
    description: string
    thumbnail: string
    publishedAt: string
    views: string
    likes: string
    comments: string
    duration: string
    privacyStatus?: 'public' | 'unlisted' | 'private'
  }
}

interface SuggestedTag {
  name: string
  score: number
  isLocked: boolean
  searchVolume?: number
  competition?: number
  viralScore?: number
}

export default function VideoCard({ video }: VideoCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'title' | 'description' | 'thumbnail'>('details')
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tagSearchInput, setTagSearchInput] = useState("")
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([])
  const [searchedTags, setSearchedTags] = useState<SuggestedTag[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [searchingTags, setSearchingTags] = useState(false)
  const [isSavingToYoutube, setIsSavingToYoutube] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [unlockedTags, setUnlockedTags] = useState<Set<string>>(new Set())
  
  // Title Scoring and AI Generation States
  const [titleScore, setTitleScore] = useState<number | null>(null)
  const [scoreMetrics, setScoreMetrics] = useState<any>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [aiTitles, setAiTitles] = useState<string[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [selectedAITitle, setSelectedAITitle] = useState<string | null>(null)
  
  // AI Description Generation States
  const [aiDescription, setAiDescription] = useState<string>('')
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null)

  // Country-specific Content Generation States
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[0]>(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearchInput, setCountrySearchInput] = useState("")
  
  const containerRef = useRef<HTMLDivElement | null>(null)

  const formatViews = (views: string) => {
    const num = parseInt(views)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) return `${diffDays}d`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`
    return `${Math.floor(diffDays / 365)}y`
  }

  const formatDuration = (duration: string) => {
    return duration.replace('PT', '').replace('M', ':').replace('S', '')
  }

  // Detect if this is a short (duration under 3 minutes / 180 seconds)
  const isShort = () => {
    if (!video.duration) return false
    try {
      const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return false
      
      const h = parseInt(match[1] || '0')
      const m = parseInt(match[2] || '0')
      const s = parseInt(match[3] || '0')
      const totalSeconds = h * 3600 + m * 60 + s
      
      return totalSeconds < 180
    } catch (e) {
      console.error('Duration parsing error in VideoCard:', e)
      return false
    }
  }

  const isShortVideo = isShort()

  const handleScoreWithBoost = () => {
    setIsAnalyzing(true)
    setShowModal(true)
    // Fetch tags based on current title
    fetchSuggestedTags(title)
    setTimeout(() => setIsAnalyzing(false), 300)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    // Title change - tags will be fetched when modal opens
  }

  const fetchSuggestedTags = async (titleToUse?: string) => {
    const titleForSearch = titleToUse || title
    if (!titleForSearch.trim()) return
    
    setLoadingSuggestions(true)
    try {
      const query = encodeURIComponent(titleForSearch)
      const response = await fetch(`/api/tags/suggest?keyword=${query}`)

      if (response.ok) {
        const data = await response.json()
        // Convert API response to our format and show 25+ tags
        const formattedTags = (data.suggestions || []).map((tag: any, idx: number) => ({
          name: tag.tag,
          score: tag.viralScore || 50,
          searchVolume: tag.searchVolume,
          competition: tag.competition,
          viralScore: tag.viralScore,
          isLocked: idx > 5 // First 6 are free, rest are locked
        }))
        setSuggestedTags(formattedTags)
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
      // Fallback to detailed tags based on title
      const titleWords = titleToUse?.toLowerCase().split(/\s+/).filter(Boolean) || []
      const baseTags = [
        titleToUse || 'tutorial',
        ...titleWords,
        `${titleToUse} tutorial`,
        `${titleToUse} tips`,
        `${titleToUse} guide`,
        `${titleToUse} 2025`,
        `how to ${titleToUse}`,
      ].filter((t, i, arr) => arr.indexOf(t) === i && t.length > 2)

      setSuggestedTags(
        baseTags.slice(0, 25).map((tag, idx) => ({
          name: tag,
          score: 90 - idx * 3,
          searchVolume: Math.round(5000 - idx * 150),
          competition: 40 + idx * 2,
          viralScore: 85 - idx * 2,
          isLocked: idx > 5
        }))
      )
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 30) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleUnlockTag = async (tagName: string) => {
    try {
      // Deduct credits for tag recommendation unlock
      const creditResponse = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: CREDIT_COSTS.TAG_RECOMMENDATION,
          feature: 'TAG_RECOMMENDATION'
        })
      })

      const responseData = await creditResponse.json()

      if (!creditResponse.ok) {
        if (creditResponse.status === 402) {
          alert('Insufficient credits. You need ' + CREDIT_COSTS.TAG_RECOMMENDATION + ' credits to unlock this tag recommendation.')
        } else {
          alert('Error: ' + (responseData.error || 'Failed to process credits'))
        }
        return
      }

      // If credits were deducted, add the tag
      if (responseData.success && !tags.includes(tagName) && tags.length < 30) {
        setTags([...tags, tagName])
        setUnlockedTags(new Set([...unlockedTags, tagName]))
        // Dispatch event to update credits in sidebar
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: responseData.credits } }))
      }
    } catch (error) {
      console.error('Error unlocking tag:', error)
      alert('Failed to unlock tag recommendation')
    }
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleApplyScore = () => {
    // Send data to API
    console.log({ title, description, tags })
    setShowModal(false)
  }

  const handleSaveToYoutube = async () => {
    if (!title.trim() && !description.trim() && tags.length === 0) {
      setSaveMessage("❌ Please add at least title, description, or tags before saving")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }

    setIsSavingToYoutube(true)
    setSaveMessage("")

    try {
      const accessToken = localStorage.getItem('youtube_access_token')
      const refreshToken = localStorage.getItem('youtube_refresh_token')
      
      if (!accessToken && !refreshToken) {
        setSaveMessage("⚠️ Please reconnect YouTube in Settings")
        setIsSavingToYoutube(false)
        setTimeout(() => setSaveMessage(""), 4000)
        return
      }

      // Call comprehensive update API
      const response = await fetch('/api/youtube/update-video-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          videoId: video.id,
          title: title.trim(), // Send actual value, not null
          description: description.trim(), // Send actual value, not null
          tags: tags.length > 0 ? tags : [], // Send array, not null
          refreshToken: refreshToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle permission/authentication errors with user-friendly messages
        if (data.needsReauth || response.status === 403) {
          const message = data.userMessage || "⚠️ Please reconnect your YouTube account from Settings to enable video editing"
          setSaveMessage(message)
          setIsSavingToYoutube(false)
          setTimeout(() => setSaveMessage(""), 6000)
          return
        }

        // If token refresh needed
        if (response.status === 401 && refreshToken && !data.needsReauth) {
          setSaveMessage("🔄 Refreshing session...")
          // Retry after a brief delay
          setTimeout(async () => {
            try {
              const retryResponse = await fetch('/api/youtube/update-video-complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken || ''}`,
                },
                body: JSON.stringify({
                  videoId: video.id,
                  title: title.trim(), // Send actual value, not null
                  description: description.trim(), // Send actual value, not null
                  tags: tags.length > 0 ? tags : [], // Send array, not null
                  refreshToken: refreshToken
                })
              })

              const retryData = await retryResponse.json()

              if (retryResponse.ok) {
                if (retryData.accessToken) {
                  localStorage.setItem('youtube_access_token', retryData.accessToken)
                }
                setSaveMessage("✅ Video updated successfully!")
                setIsSavingToYoutube(false)
                setTimeout(() => {
                  setShowModal(false)
                  setSaveMessage("")
                }, 2000)
              } else {
                // Check if retry also needs reauth
                if (retryData.needsReauth) {
                  setSaveMessage(retryData.userMessage || "⚠️ Please reconnect YouTube from Settings")
                } else {
                  setSaveMessage(retryData.userMessage || "⚠️ Update failed. Please try again.")
                }
                setIsSavingToYoutube(false)
                setTimeout(() => setSaveMessage(""), 5000)
              }
            } catch (retryError) {
              setSaveMessage("⚠️ Session expired. Please reconnect YouTube from Settings.")
              setIsSavingToYoutube(false)
              setTimeout(() => setSaveMessage(""), 5000)
            }
          }, 1500)
        } else {
          // Use user-friendly message from API or fallback
          const message = data.userMessage || data.error || "⚠️ Could not update video. Please try again."
          setSaveMessage(message)
          setIsSavingToYoutube(false)
          setTimeout(() => setSaveMessage(""), 5000)
        }
        return
      }

      // Success
      if (data.accessToken) {
        localStorage.setItem('youtube_access_token', data.accessToken)
      }

      setSaveMessage("✅ Video updated successfully on YouTube!")
      setIsSavingToYoutube(false)
      
      setTimeout(() => {
        setShowModal(false)
        setSaveMessage("")
      }, 2000)

    } catch (error: any) {
      console.error('Save error:', error)
      // Provide user-friendly error message
      const errorMsg = error.message || ''
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        setSaveMessage("⚠️ Network error. Please check your connection and try again.")
      } else {
        setSaveMessage("⚠️ Unable to update video. Please try again or reconnect YouTube from Settings.")
      }
      setIsSavingToYoutube(false)
      setTimeout(() => setSaveMessage(""), 5000)
      setTimeout(() => setSaveMessage(""), 4000)
    }
  }

  const filteredSuggestedTags = suggestedTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchInput.toLowerCase())
  )

  const handleTagSearch = async (searchTerm: string) => {
    setTagSearchInput(searchTerm)
    
    if (!searchTerm.trim()) {
      setSearchedTags([])
      return
    }

    setSearchingTags(true)
    try {
      const query = encodeURIComponent(searchTerm)
      const response = await fetch(`/api/tags/search?keyword=${query}`)

      if (response.ok) {
        const data = await response.json()
        const tags = (data.tags || []).map((tag: any, idx: number) => ({
          name: tag.tag || tag.name,
          searchVolume: tag.searchVolume,
          competition: tag.competition,
          viralScore: tag.viralScore || 50,
          isLocked: idx > 5 // First 6 are free
        }))
        setSearchedTags(tags.length > 0 ? tags : [])
      } else {
        setSearchedTags([])
      }
    } catch (error) {
      console.error('Error searching tags:', error)
      setSearchedTags([])
    } finally {
      setSearchingTags(false)
    }
  }

  // Title Scoring Function using AI
  const scoreTitle = async () => {
    if (!title.trim()) return
    
    setIsScoring(true)
    try {
      // Use the same title scoring system as the dedicated title-score page
      const response = await fetch('/api/title-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: title
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Convert the search score (0-100) to our title score format
        setTitleScore(data.searchScore)
        
        // Create metrics based on the scoring system
        const metrics: any = {
          length: title.length,
          lengthScore: title.length >= 40 && title.length <= 70 ? "Good length ✅" : "Consider adjusting length",
          powerWords: data.optimizedUserTitle !== title ? "Uses power words ✅" : "Could add power words",
          numbers: /\d/.test(title) ? "Includes numbers ✅" : "Consider adding numbers",
          question: /[?¿]/.test(title) || title.toLowerCase().includes('how') ? "Question format ✅" : "Could use question format",
          emotional: /amazing|best|incredible|must|never/i.test(title) ? "Emotional triggers ✅" : "Could add emotional triggers"
        }
        setScoreMetrics(metrics)
      } else {
        // Fallback scoring logic
        const fallbackScore = calculateFallbackScore(title)
        setTitleScore(fallbackScore.score)
        setScoreMetrics(fallbackScore.metrics)
      }
    } catch (error) {
      console.error('Error scoring title:', error)
      // Fallback scoring
      const fallbackScore = calculateFallbackScore(title)
      setTitleScore(fallbackScore.score)
      setScoreMetrics(fallbackScore.metrics)
    } finally {
      setIsScoring(false)
    }
  }

  // Calculate fallback score when API fails
  const calculateFallbackScore = (titleText: string) => {
    let score = 50 // Base score
    const metrics: any = {}

    // Length scoring (ideal: 40-60 chars)
    const length = titleText.length
    metrics.length = length
    if (length >= 40 && length <= 60) {
      score += 20
      metrics.lengthScore = "Perfect length ✅"
    } else if (length >= 30 && length <= 70) {
      score += 10
      metrics.lengthScore = "Good length"
    } else {
      metrics.lengthScore = "Consider adjusting length"
    }

    // Keyword presence
    const keywords = titleText.toLowerCase().split(/\s+/)
    const powerWords = ['how to', 'best', 'easy', 'quick', 'ultimate', 'complete', 'pro', 'tips', 'guide', 'tutorial']
    const hasPowerWords = powerWords.some(word => titleText.toLowerCase().includes(word))
    if (hasPowerWords) {
      score += 15
      metrics.powerWords = "Contains engaging keywords ✅"
    } else {
      metrics.powerWords = "Could add power words"
    }

    // Numbers and lists
    const hasNumbers = /\d+/.test(titleText)
    if (hasNumbers) {
      score += 10
      metrics.numbers = "Includes numbers ✅"
    } else {
      metrics.numbers = "Consider adding numbers"
    }

    // Question format
    const isQuestion = /[?¿]/.test(titleText) || titleText.toLowerCase().startsWith('how') || titleText.toLowerCase().startsWith('what')
    if (isQuestion) {
      score += 10
      metrics.question = "Question format ✅"
    } else {
      metrics.question = "Could use question format"
    }

    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, Math.round(score)))
    
    return { score, metrics }
  }

  // AI Title Generation Function with Country Context
  const generateAITitles = async () => {
    if (!title.trim()) return
    
    setIsGeneratingAI(true)
    setAiTitles([])
    setSelectedAITitle(null)
    
    try {
      const countryContext = `Country: ${selectedCountry.name} (${selectedCountry.language}). 
Audience Tone: ${selectedCountry.tone}. 
Create titles that resonate with ${selectedCountry.name} audience preferences and cultural context.`

      // Use the same API as AI tools page - gemini-2.5-flash-lite
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate 5 engaging and SEO-optimized YouTube video titles based on this original title: "${title}". 

${countryContext}

Make them catchy, clickable, culturally relevant, and include relevant keywords that perform well in ${selectedCountry.name}. 
Return only the titles, one per line. Do not include numbers or explanations.`,
          type: 'title'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiTitles(data.result || [])
      } else {
        // Fallback title generation
        const fallbackTitles = generateFallbackTitles(title)
        setAiTitles(fallbackTitles)
      }
    } catch (error) {
      console.error('Error generating AI titles:', error)
      // Fallback title generation
      const fallbackTitles = generateFallbackTitles(title)
      setAiTitles(fallbackTitles)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Fallback title generation
  const generateFallbackTitles = (originalTitle: string) => {
    const baseTitle = originalTitle.replace(/^(how to|best|easy|quick|ultimate)/i, '').trim()
    const prefixes = ['How to', 'Best', 'Easy', 'Quick', 'Ultimate']
    const suffixes = ['Tips', 'Guide', 'Tutorial', 'Explained', 'Step by Step']
    
    const titles = []
    for (let i = 0; i < 5; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
      titles.push(`${prefix} ${baseTitle} ${suffix}`)
    }
    return titles
  }

  // Apply AI generated title
  const applyAITitle = (newTitle: string) => {
    setTitle(newTitle)
    setSelectedAITitle(newTitle)
    // Auto-score the new title
    setTimeout(() => scoreTitle(), 300)
    setSaveMessage('✅ Title updated and scored!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // Generate AI description using the same model as AI tools page with Country Context
  const generateAIDescription = async () => {
    if (!title.trim()) return
    
    setIsGeneratingDescription(true)
    setAiDescription('')
    setSelectedDescription(null)
    
    try {
      const countryContext = `Target Country: ${selectedCountry.name} (${selectedCountry.language})
Audience Tone: ${selectedCountry.tone}
Create a description that resonates with ${selectedCountry.name} audience and follows their cultural preferences.`

      // Use the same API as AI tools page - gemini-2.5-flash-lite
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a professional YouTube video description for: "${title}" 
${video.description ? `Current description reference: "${video.description.substring(0, 200)}..."` : ''}

${countryContext}

Requirements:
1. Write in clean, professional format for ${selectedCountry.name} audience (no markdown symbols like * or #)
2. Include 10-20 relevant SEO keywords naturally in ${selectedCountry.language} context
3. Make it engaging and culturally appropriate for ${selectedCountry.name}
4. Encourage viewers to watch with culturally relevant CTAs
5. Add clear structure with sections using bullet points (• symbol only for bullets)
6. Length: 250-400 words
7. Use proper paragraphs and bullet points with • symbol

Format example:
[Engaging opening paragraph about the video topic]

What you'll learn:
• Key benefit 1
• Key benefit 2
• Key benefit 3

Why watch this video:
• Reason 1
• Reason 2
• Reason 3

[Concluding paragraph with culturally-appropriate CTA]

Geographic/Cultural relevance for ${selectedCountry.name}: [Include 2-3 context-specific insights]

Return only the description content in clean text format without any markdown.`,
          type: 'description',
          minLength: 250
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiDescription(data.result || '')
      } else {
        // Fallback description generation
        const fallbackDescription = generateFallbackDescription(title)
        setAiDescription(fallbackDescription)
      }
    } catch (error) {
      console.error('Error generating AI description:', error)
      // Fallback to simulated description
      const fallbackDescription = generateFallbackDescription(title)
      setAiDescription(fallbackDescription)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  // Apply AI-generated description
  const applyAIDescription = (descriptionText: string) => {
    setDescription(descriptionText)
    setSelectedDescription(descriptionText)
    setSaveMessage('✅ Description updated successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // Fallback description generation
  const generateFallbackDescription = (videoTitle: string) => {
    const keywords = [
      videoTitle.replace(/\s+/g, '').toLowerCase(),
      'tutorial', 'guide', 'how to', 'tips', 'tricks', 'learn', 'beginner',
      'step by step', 'easy', 'simple', 'best practices', 'pro tips'
    ].join(', ')
    
    return `Learn everything about ${videoTitle.toLowerCase()} in this comprehensive tutorial.

What you'll learn:
• Step-by-step instructions for beginners
• Expert tips and professional techniques
• Common mistakes and how to avoid them
• Best practices for optimal results

Why watch this video:
• Clear and easy-to-follow guidance
• Practical examples and real demonstrations
• Time-saving shortcuts and pro methods
• Actionable advice you can implement immediately

Whether you're just starting out or looking to improve your skills, this video provides valuable insights that will help you master ${videoTitle.toLowerCase()}. 

Don't forget to like, comment, and subscribe for more helpful tutorials like this!

SEO keywords: ${keywords}`
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // noop
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <>
      {isShortVideo ? (
        // SHORTS CARD - Enhanced Vertical Layout
        <div ref={containerRef} className="relative bg-white rounded-xl shadow-sm hover:shadow-md transform transition-all duration-300 overflow-hidden border border-gray-100">
          {/* Thumbnail Container - Enhanced */}
          <div className="relative w-full aspect-[9/16] bg-gray-100 overflow-hidden">
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={180}
              height={320}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {/* Shorts Badge */}
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <span>SHORTS</span>
            </div>
            {/* Play Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" />
              </div>
            </div>
          </div>

          {/* Video Info - Enhanced */}
          <div className="p-3 bg-white">
            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
              {video.title}
            </h3>

            {/* Statistics Row */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatViews(video.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{formatViews(video.likes)}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <Clock className="w-3 h-3" />
              <span>{formatDate(video.publishedAt)}</span>
            </div>

            {/* Action Button - Enhanced */}
            <button
              onClick={handleScoreWithBoost}
              disabled={isAnalyzing}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Score Title</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // VIDEOS CARD - Enhanced Horizontal Layout - Mobile Responsive
        <div ref={containerRef} className="relative bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transform transition-all duration-300 overflow-hidden border border-gray-100">
          {/* Thumbnail Container */}
          <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
            <Image
              src={video.thumbnail}
              alt={video.title}
              width={280}
              height={158}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {/* Duration Badge */}
            <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/80 text-white text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="text-xs">{formatDuration(video.duration)}</span>
            </div>
            {/* Play Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5 sm:ml-1" />
              </div>
            </div>
          </div>

          {/* Video Info - Enhanced - Mobile Responsive */}
          <div className="p-2 sm:p-3 bg-white">
            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2 mb-1.5 sm:mb-2">
              {video.title}
            </h3>

            {/* Statistics Row - Mobile Compact */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 mb-2 sm:mb-3 overflow-x-auto">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{formatViews(video.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{formatViews(video.likes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>{formatViews(video.comments)}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <Clock className="w-3 h-3" />
              <span>{formatDate(video.publishedAt)}</span>
            </div>

            {/* Action Button - Enhanced */}
            <button
              onClick={handleScoreWithBoost}
              disabled={isAnalyzing}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Score Title</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal - Enhanced YouTube Studio Style - Mobile Responsive */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-2xl sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header - Mobile Optimized */}
            <div className="flex items-center justify-between px-3 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-slate-700 bg-slate-800">
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-xs sm:text-sm line-clamp-2">{video.title}</h2>
                <p className="text-gray-400 text-xs mt-1">Public</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </button>
            </div>

            {/* Tabs - Mobile Responsive - VISIBLE */}
            <div className="flex gap-1 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-8 border-b-2 border-slate-700 bg-slate-800">
              <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 sm:py-4 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  activeTab === 'details' 
                    ? 'text-blue-400 border-b-2 border-blue-500' 
                    : 'text-gray-300 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Details
              </button>
              <button 
                onClick={() => setActiveTab('title')}
                className={`py-3 sm:py-4 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  activeTab === 'title' 
                    ? 'text-blue-400 border-b-2 border-blue-500' 
                    : 'text-gray-300 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Title
              </button>
              <button 
                onClick={() => setActiveTab('description')}
                className={`py-3 sm:py-4 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
                  activeTab === 'description' 
                    ? 'text-blue-400 border-b-2 border-blue-500' 
                    : 'text-gray-300 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Preview
              </button>
            </div>

            {/* Content - No Scrollbar - Mobile Optimized */}
            <div className="overflow-y-auto flex-1 px-3 sm:px-6 md:px-8 py-4 sm:py-8 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {/* DETAILS TAB */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Country Selector for Localized Content - Mobile Optimized */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-2">
                      <h3 className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        Target Country
                      </h3>
                      <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded">
                        {selectedCountry.flag} {selectedCountry.name}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-2 sm:mb-3">
                      Select target country for culturally-relevant titles & descriptions
                    </p>
                    
                    {/* Country Dropdown - Mobile Optimized */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm text-left hover:bg-slate-700 transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="truncate">{selectedCountry.name}</span>
                          <span className="text-xs text-gray-400 hidden sm:inline">({selectedCountry.code})</span>
                        </span>
                        <span className="text-xs flex-shrink-0 ml-1">▼</span>
                      </button>
                      
                      {/* Country List Dropdown - Mobile Optimized */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-40 max-h-64 overflow-y-auto">
                          {/* Search Input */}
                          <div className="sticky top-0 p-2 bg-slate-800 border-b border-slate-700">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={countrySearchInput}
                              onChange={(e) => setCountrySearchInput(e.target.value.toLowerCase())}
                              className="w-full px-2 sm:px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                            />
                          </div>
                          
                          {/* Country Options */}
                          <div className="p-2">
                            {COUNTRIES.filter(country => 
                              country.name.toLowerCase().includes(countrySearchInput) || 
                              country.code.toLowerCase().includes(countrySearchInput)
                            ).map((country) => (
                              <button
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country)
                                  setShowCountryDropdown(false)
                                  setCountrySearchInput("")
                                }}
                                className={`w-full text-left px-2 sm:px-3 py-2 rounded text-xs sm:text-sm transition-colors flex items-center gap-2 ${
                                  selectedCountry.code === country.code
                                    ? 'bg-blue-600/50 text-white border border-blue-500'
                                    : 'text-gray-300 hover:bg-slate-700 border border-transparent'
                                }`}
                              >
                                <span className="text-lg flex-shrink-0">{country.flag}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{country.name}</div>
                                  <div className="text-xs text-gray-400 truncate">{country.language}</div>
                                </div>
                                {selectedCountry.code === country.code && (
                                  <span className="text-blue-400 flex-shrink-0">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title Display at Top - Mobile Optimized */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                      <p className="text-xs text-gray-400">Current Title</p>
                      <button
                        onClick={generateAITitles}
                        disabled={isGeneratingAI || !title.trim()}
                        className="flex items-center gap-1 px-2 sm:px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded transition-all"
                      >
                        {isGeneratingAI ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">AI Titles for {selectedCountry.name}</span>
                            <span className="sm:hidden">AI Titles</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-white font-semibold text-xs sm:text-sm break-words mb-2 sm:mb-3 line-clamp-2">{title || 'No title'}</p>
                    
                    {/* AI Generated Titles in Details */}
                    {aiTitles.length > 0 && (
                      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700">
                        <h4 className="text-white font-medium text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                          <span className="hidden sm:inline">AI Title Suggestions for {selectedCountry.name}</span>
                          <span className="sm:hidden">AI Suggestions</span>
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {aiTitles.map((aiTitle, index) => (
                            <div 
                              key={index}
                              className={`p-2 rounded border text-xs transition-all cursor-pointer ${
                                selectedAITitle === aiTitle 
                                  ? 'bg-green-900/30 border-green-700 text-green-300' 
                                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:bg-slate-700'
                              }`}
                              onClick={() => applyAITitle(aiTitle)}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium break-words">{aiTitle}</div>
                                  <div className="text-xs opacity-70 mt-1">
                                    {aiTitle.length} chars • {aiTitle.length <= 60 ? '✓ Good' : '⚠ Long'}
                                  </div>
                                </div>
                                {selectedAITitle === aiTitle && (
                                  <div className="flex items-center gap-1 text-green-400 flex-shrink-0">
                                    <Shield className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {aiTitles.length > 0 && !isGeneratingAI && (
                          <div className="text-center py-2 text-gray-500 text-xs mt-2">
                            Click on any title above to apply it
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description Section - Mobile Optimized */}
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-4 gap-2 flex-wrap">
                      <h3 className="text-white font-semibold text-xs sm:text-base">Description for {selectedCountry.name}</h3>
                      <button
                        onClick={generateAIDescription}
                        disabled={isGeneratingDescription || !title.trim()}
                        className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-lg transition-all"
                      >
                        {isGeneratingDescription ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">Generate AI Description</span>
                            <span className="sm:hidden">AI Desc</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Manual Description Input */}
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 mb-2 sm:mb-3"
                      rows={3}
                      placeholder="Tell viewers about your video"
                    />
                    <div className="text-left text-xs text-gray-400 mb-3 sm:mb-4">
                      {description.length} of 5000
                    </div>
                    
                    {/* AI Generated Descriptions */}
                    {aiDescription && (
                      <div className="mt-3 sm:mt-4">
                        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2 flex-wrap">
                          <h4 className="text-white font-medium text-xs sm:text-sm">AI Description for {selectedCountry.name}</h4>
                          {selectedDescription === aiDescription && (
                            <div className="flex items-center gap-1 text-green-400 text-xs">
                              <Shield className="w-3 h-3" />
                              <span>Applied</span>
                            </div>
                          )}
                        </div>
                        <div 
                          className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer max-h-64 overflow-y-auto ${
                            selectedDescription === aiDescription 
                              ? 'bg-green-900/30 border-green-700' 
                              : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                          }`}
                          onClick={() => applyAIDescription(aiDescription)}
                        >
                          <div className="text-white text-xs sm:text-sm whitespace-pre-wrap mb-2 sm:mb-3">
                            {aiDescription}
                          </div>
                          <div className="text-xs text-gray-400 sticky bottom-0 bg-slate-700/50 -mx-3 sm:-mx-4 -mb-3 sm:-mb-4 px-3 sm:px-4 py-2 sm:py-3">
                            {aiDescription.length} chars • {aiDescription.length >= 200 && aiDescription.length <= 500 ? '✓ Perfect' : '⚠ Adjust'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {aiDescription && !isGeneratingDescription && (
                      <div className="text-center py-3 sm:py-4 text-gray-500 text-xs">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-gray-600" />
                        <p>Click above to apply description</p>
                      </div>
                    )}
                  </div>

                  {/* Tags Section */}
                  <div>
                    <h3 className="text-white font-semibold text-base mb-4">Tags</h3>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      {/* Tags Display */}
                      <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                        {tags.length === 0 ? (
                          <span className="text-gray-400 text-sm">No tags added yet</span>
                        ) : (
                          tags.map((tag, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 text-green-400 rounded text-sm font-medium"
                            >
                              <span>{tag}</span>
                              <button
                                onClick={() => handleRemoveTag(idx)}
                                className="hover:text-green-300 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Tags Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                          placeholder="Add tags manually"
                        />
                        <button
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || tags.length >= 500}
                          className="px-4 py-2 bg-slate-700 text-gray-300 font-medium rounded hover:bg-slate-600 disabled:opacity-50 text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="text-sm text-gray-400 mt-3">
                        {tags.length} of 500 tags
                      </div>
                    </div>
                  </div>

                  {/* Recommended Tags */}
                  <div>
                    <h3 className="text-white font-semibold text-base mb-4">Recommended Tags</h3>
                    
                    {/* Find Tags Search */}
                    <div className="mb-4">
                      <input
                        type="text"
                        value={tagSearchInput}
                        onChange={(e) => handleTagSearch(e.target.value)}
                        placeholder="Find tags by keyword..."
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                      />
                      {tagSearchInput && (
                        <button
                          onClick={() => handleTagSearch("")}
                          className="text-xs text-gray-400 hover:text-white mt-1"
                        >
                          Clear search
                        </button>
                      )}
                    </div>

                    {/* Search Results or Recommended Tags */}
                    {tagSearchInput ? (
                      // Search Results from API
                      <>
                        {searchingTags ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            <span className="text-gray-400 text-sm ml-2">Searching tags...</span>
                          </div>
                        ) : searchedTags.length === 0 ? (
                          <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-gray-400 text-sm">❌ Not available</p>
                            <p className="text-gray-500 text-xs mt-1">No tags found for "{tagSearchInput}"</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {searchedTags.map((tag, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (!tag.isLocked && !tags.includes(tag.name)) {
                                    setTags([...tags, tag.name])
                                  }
                                }}
                                disabled={tag.isLocked}
                                title={tag.isLocked ? 'Unlock with boost to use' : tag.name}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded transition-all ${
                                  tag.isLocked
                                    ? 'bg-slate-800/50 cursor-not-allowed border border-slate-700'
                                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 text-left">
                                  {tag.isLocked ? (
                                    <div className="flex items-center justify-center w-full">
                                      <Lock className="w-5 h-5 text-red-500" />
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-sm text-white">{tag.name}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  {!tag.isLocked && (
                                    <>
                                      {tag.searchVolume && (
                                        <span className="text-green-400">Vol: {tag.searchVolume}</span>
                                      )}
                                      {tag.competition && (
                                        <span className={tag.competition > 70 ? 'text-red-400' : 'text-yellow-400'}>
                                          Comp: {tag.competition}
                                        </span>
                                      )}
                                      {tag.viralScore && (
                                        <span className="text-blue-400 font-semibold">📈 {tag.viralScore}</span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Original Recommended Tags
                      <>
                        {loadingSuggestions ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            <span className="text-gray-400 text-sm ml-2">Fetching tag suggestions...</span>
                          </div>
                        ) : suggestedTags.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-400 text-sm">No suggestions available</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {suggestedTags.map((tag, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (tag.isLocked) {
                                    handleUnlockTag(tag.name)
                                  } else if (!tags.includes(tag.name)) {
                                    setTags([...tags, tag.name])
                                  }
                                }}
                                disabled={tag.isLocked}
                                title={tag.isLocked ? 'Click to unlock with credits' : tag.name}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded transition-all ${
                                  tag.isLocked
                                    ? 'bg-slate-800/50 cursor-not-allowed border border-slate-700 hover:bg-slate-700'
                                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 text-left">
                                  {tag.isLocked ? (
                                    <div className="flex items-center justify-center w-full">
                                      <Lock className="w-5 h-5 text-red-500" />
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-sm text-white">{tag.name}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  {!tag.isLocked && (
                                    <>
                                      {tag.searchVolume && (
                                        <span className="text-green-400">Vol: {tag.searchVolume}</span>
                                      )}
                                      {tag.competition && (
                                        <span className={tag.competition > 70 ? 'text-red-400' : 'text-yellow-400'}>
                                          Comp: {tag.competition}
                                        </span>
                                      )}
                                      {tag.viralScore && (
                                        <span className="text-blue-400 font-semibold">📈 {tag.viralScore}</span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TITLE TAB - Enhanced with Scoring and AI */}
              {activeTab === 'title' && (
                <div className="space-y-6">
                  {/* Current Title Section */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        Current Title
                      </h3>
                      <button
                        onClick={scoreTitle}
                        disabled={isScoring || !title.trim()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                      >
                        {isScoring ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Scoring...</span>
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4" />
                            <span>Score Title</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value.slice(0, 100))
                        // Reset score when title changes
                        if (titleScore !== null) {
                          setTitleScore(null)
                          setScoreMetrics(null)
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Enter your video title (max 100 characters)"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-400">
                        {title.length} of 100 characters
                        {title.length > 0 && (
                          <span className={`ml-2 ${title.length <= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {title.length <= 60 ? '✓ Good length' : '⚠ Consider shortening'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title Score Display */}
                  {titleScore !== null && (
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          Title Score
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                          titleScore >= 80 ? 'bg-green-900/50 text-green-400' :
                          titleScore >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {titleScore}/100
                        </div>
                      </div>
                      
                      {/* Score Metrics */}
                      {scoreMetrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-slate-800/50 rounded p-3">
                            <div className="text-xs text-gray-400 mb-1">Length</div>
                            <div className="text-sm text-white">{scoreMetrics.length} characters</div>
                            <div className="text-xs text-green-400">{scoreMetrics.lengthScore}</div>
                          </div>
                          
                          <div className="bg-slate-800/50 rounded p-3">
                            <div className="text-xs text-gray-400 mb-1">Engagement Keywords</div>
                            <div className="text-sm text-white">Detected</div>
                            <div className="text-xs text-green-400">{scoreMetrics.powerWords}</div>
                          </div>
                          
                          <div className="bg-slate-800/50 rounded p-3">
                            <div className="text-xs text-gray-400 mb-1">Numbers/List Format</div>
                            <div className="text-sm text-white">{scoreMetrics.numbers?.includes('✅') ? 'Yes' : 'No'}</div>
                            <div className="text-xs text-green-400">{scoreMetrics.numbers}</div>
                          </div>
                          
                          <div className="bg-slate-800/50 rounded p-3">
                            <div className="text-xs text-gray-400 mb-1">Question Format</div>
                            <div className="text-sm text-white">{scoreMetrics.question?.includes('✅') ? 'Yes' : 'No'}</div>
                            <div className="text-xs text-green-400">{scoreMetrics.question}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Title Generation Section */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        AI Title Generator - {selectedCountry.name}
                      </h3>
                      <button
                        onClick={generateAITitles}
                        disabled={isGeneratingAI || !title.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-all"
                      >
                        {isGeneratingAI ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate AI Titles</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Country Tone Info */}
                    <div className="mb-4 p-2 bg-slate-700/50 rounded border border-slate-600 text-xs text-gray-300">
                      <span className="text-blue-400 font-medium">{selectedCountry.flag} {selectedCountry.name}:</span> {selectedCountry.tone}
                    </div>

                    {/* AI Generated Titles */}
                    {isGeneratingAI && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
                          <p className="text-gray-400">Generating titles optimized for {selectedCountry.name}...</p>
                        </div>
                      </div>
                    )}

                    {aiTitles.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-400 mb-2">
                          {aiTitles.length} AI-generated titles for {selectedCountry.name}:
                        </div>
                        {aiTitles.map((aiTitle, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              selectedAITitle === aiTitle 
                                ? 'bg-green-900/30 border-green-700' 
                                : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                            }`}
                            onClick={() => applyAITitle(aiTitle)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-white font-medium text-sm mb-1">{aiTitle}</div>
                                <div className="text-xs text-gray-400">
                                  {aiTitle.length} characters • {aiTitle.length <= 60 ? '✓ Good length' : '⚠ Long title'}
                                </div>
                              </div>
                              {selectedAITitle === aiTitle && (
                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                  <Shield className="w-3 h-3" />
                                  <span>Applied</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {aiTitles.length === 0 && !isGeneratingAI && (
                      <div className="text-center py-6 text-gray-500">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm">Click "Generate AI Titles" to get smart title suggestions for {selectedCountry.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PREVIEW TAB */}
              {activeTab === 'description' && (
                <div>
                  <h3 className="text-white font-semibold text-base mb-4">Preview</h3>
                  <div className="relative w-full aspect-video bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      width={600}
                      height={337}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Button - Mobile Responsive */}
            <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 border-t border-slate-700 bg-slate-800">
              {/* Save Summary */}
              {(title !== video.title || description !== video.description || tags.length > 0) && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-slate-700/50 rounded text-xs text-gray-300 space-y-1">
                  <div className="font-semibold text-gray-200">Ready to save:</div>
                  {title !== video.title && <div>✓ Title updated</div>}
                  {description !== video.description && <div>✓ Description updated</div>}
                  {tags.length > 0 && <div>✓ {tags.length} {tags.length === 1 ? 'tag' : 'tags'} added</div>}
                </div>
              )}

              {/* Status Message */}
              {saveMessage && (
                <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold text-center mb-3 sm:mb-4 ${
                  saveMessage.includes('✅') 
                    ? 'bg-green-900/30 text-green-400' 
                    : saveMessage.includes('🔄') || saveMessage.includes('⚠️')
                    ? 'bg-yellow-900/30 text-yellow-400'
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {saveMessage}
                </div>
              )}
                          
              {/* Buttons - Responsive Layout (Stack on mobile, side by side on desktop) */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleApplyScore}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveToYoutube}
                  disabled={isSavingToYoutube || (!title.trim() && !description.trim() && tags.length === 0)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:opacity-70 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm order-1 sm:order-2"
                  title={(!title.trim() && !description.trim() && tags.length === 0) ? "Add title, description, or tags to save" : "Save to YouTube"}
                >
                  {isSavingToYoutube ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span className="hidden sm:inline">Uploading...</span>
                      <span className="sm:hidden">Upload</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Save to YouTube</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
