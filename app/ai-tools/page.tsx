"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import React from "react"
import SharedSidebar from "@/components/shared-sidebar"
import { Menu, X, Sparkles, Tag, Layout, FileText } from "lucide-react"

const AI_TOOLS = [
  {
    id: 'title-generator',
    name: 'AI Title Generator',
    description: 'Generate engaging and SEO-optimized video titles',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'tag-generator',
    name: 'Tag Generator',
    description: 'Generate relevant tags to boost video visibility',
    icon: Tag,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'description-templates',
    name: 'Description Templates',
    description: 'Choose from 5 professional templates and customize descriptions',
    icon: Layout,
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'channel-score',
    name: 'Channel Scoring',
    description: 'Analyze your YouTube channel performance with comprehensive scoring',
    icon: FileText,
    color: 'from-emerald-500 to-teal-500'
  }
]

// Saved History Component (Descriptions, Titles, Tags)
const SavedDescriptionsHistory = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<any[]>([])

  // Load all saved items from localStorage on mount
  useEffect(() => {
    const loadSavedItems = () => {
      const allKeys = Object.keys(localStorage)
      const items: any[] = []

      // Load descriptions
      const descKeys = allKeys.filter(key => key.startsWith('video-description-'))
      descKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          items.push({
            ...data,
            type: 'description',
            key
          })
        } catch {}
      })

      // Load titles
      const titleKeys = allKeys.filter(key => key.startsWith('video-titles-'))
      titleKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          items.push({
            ...data,
            type: 'title',
            key
          })
        } catch {}
      })

      // Load tags
      const tagKeys = allKeys.filter(key => key.startsWith('video-tags-'))
      tagKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          items.push({
            ...data,
            type: 'tag',
            key
          })
        } catch {}
      })

      // Sort by date
      const sorted = items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      setAllItems(sorted)
    }
    loadSavedItems()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const downloadFile = (title: string, content: string, type: string) => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${title.replace(/\s+/g, '-')}-${type}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const deleteItem = (key: string) => {
    localStorage.removeItem(key)
    setAllItems(allItems.filter(item => item.key !== key))
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'description':
        return 'from-emerald-50 to-teal-50 border-emerald-200'
      case 'title':
        return 'from-blue-50 to-cyan-50 border-blue-200'
      case 'tag':
        return 'from-orange-50 to-red-50 border-orange-200'
      default:
        return 'from-gray-50 to-slate-50 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'description':
        return '📝 Description'
      case 'title':
        return '🎯 Title'
      case 'tag':
        return '#️⃣ Tags'
      default:
        return '📌 Item'
    }
  }

  const getItemContent = (item: any) => {
    if (item.type === 'description') {
      return item.description
    } else if (item.type === 'title') {
      return item.titles.join('\n')
    } else if (item.type === 'tag') {
      return item.tags.join(', ')
    }
    return ''
  }

  const getItemName = (item: any) => {
    if (item.type === 'description') {
      return item.title
    } else if (item.type === 'title') {
      return item.name || item.topic
    } else if (item.type === 'tag') {
      return item.title
    }
    return 'Untitled'
  }

  if (allItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Saved Content Yet</h3>
        <p className="text-gray-600 text-sm">
          Generate descriptions, titles, or tags using the AI Tools to see them here
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
          📚 Saved Content History
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm">Your generated descriptions, titles, and tags</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {allItems.map((item, index) => (
          <div key={item.key} className={`bg-gradient-to-br ${getTypeColor(item.type)} border rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setExpandedId(expandedId === item.key ? null : item.key)}
                  className="text-left w-full hover:text-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 bg-white/50 px-2 py-1 rounded whitespace-nowrap">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg break-words line-clamp-2">{getItemName(item)}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(item.savedAt).toLocaleDateString()} at {new Date(item.savedAt).toLocaleTimeString()} • {getItemContent(item).length} chars
                  </p>
                </button>

                {/* Expanded Preview */}
                {expandedId === item.key && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="bg-slate-900 text-white rounded-lg p-2 sm:p-3 text-xs overflow-y-auto max-h-64 font-mono whitespace-pre-wrap leading-relaxed">
                      {getItemContent(item)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => copyToClipboard(getItemContent(item))}
                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
                <button
                  onClick={() => downloadFile(getItemName(item), getItemContent(item), item.type)}
                  className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                  title="Download as text file"
                >
                  Download
                </button>
                <button
                  onClick={() => deleteItem(item.key)}
                  className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// Title Generator Component
const TitleGeneratorTool = () => {
  const [videoTopic, setVideoTopic] = useState('')
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateFormat, setTemplateFormat] = useState('')
  const [savedTemplate, setSavedTemplate] = useState('')

  const generateTitles = async () => {
    if (!videoTopic.trim()) {
      alert('Please enter a video topic')
      return
    }

    setLoading(true)
    try {
      // Use saved template if available, otherwise generate without template
      const prompt = savedTemplate 
        ? `Generate 10 video titles for "${videoTopic}" using this format/style: "${savedTemplate}". Return only the titles, one per line.`
        : `Generate 5 video titles for: "${videoTopic}". Return only the titles, one per line.`
      
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'title'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedTitles(data.result || [])
      } else {
        alert('Failed to generate titles')
      }
    } catch (error) {
      console.error('Error generating titles:', error)
      alert('An error occurred while generating titles')
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = () => {
    if (!templateFormat.trim()) {
      alert('Please enter a template format')
      return
    }
    setSavedTemplate(templateFormat)
    setShowTemplateDialog(false)
    alert('Template saved! Now just enter a topic and click Generate Titles')
  }

  const generateTitlesFromTemplate = async () => {
    if (!videoTopic.trim()) {
      alert('Please enter a video topic')
      return
    }

    if (!templateFormat.trim()) {
      alert('Please enter a template format')
      return
    }

    setLoading(true)
    setShowTemplateDialog(false)
    try {
      const prompt = `Generate 10 video titles for "${videoTopic}" using this format/style: "${templateFormat}". Return only the titles, one per line.`
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'title'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedTitles(data.result || [])
      } else {
        alert('Failed to generate titles')
      }
    } catch (error) {
      console.error('Error generating titles:', error)
      alert('An error occurred while generating titles')
    } finally {
      setLoading(false)
    }
  }

  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title)
    alert('Title copied to clipboard!')
  }

  const clearTemplate = () => {
    setSavedTemplate('')
    setTemplateFormat('')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">AI Title Generator</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate SEO-optimized video titles powered by Google Gemini AI</p>

        {/* Saved Template Display */}
        {savedTemplate && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900">Active Template:</p>
                <p className="text-indigo-800 text-sm mt-1">"{savedTemplate}"</p>
              </div>
              <button
                onClick={clearTemplate}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Video Topic *</label>
            <input
              type="text"
              value={videoTopic}
              onChange={(e) => setVideoTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateTitles()}
              placeholder="e.g., web development, fitness tips, cooking..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateTitles}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                savedTemplate ? `Generate 10 Titles` : 'Generate Titles'
              )}
            </button>
            <button
              onClick={() => setShowTemplateDialog(true)}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              Create Template
            </button>
          </div>
        </div>

        {/* Template Dialog */}
        {showTemplateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Title Template</h3>
              <p className="text-gray-600 text-sm mb-4">Describe the format or style for your titles. Once saved, it will auto-apply when you generate titles.</p>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-gray-700 text-xs font-semibold mb-2">Examples:</p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• "[Topic] - Complete Guide 2025"</li>
                  <li>• "How to [Topic] | Full Tutorial"</li>
                  <li>• "[Topic]: Everything You Need to Know"</li>
                  <li>• "10 Best [Topic] Tips & Tricks"</li>
                  <li>• "[Topic] Explained - Beginner to Advanced"</li>
                </ul>
              </div>
              
              <textarea
                value={templateFormat}
                onChange={(e) => setTemplateFormat(e.target.value)}
                placeholder="e.g., [Topic] - Beginner to Advanced Tutorial"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24 mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateDialog(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!templateFormat.trim()}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {generatedTitles.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Titles ({generatedTitles.length})</h3>
            {generatedTitles.map((title, index) => (
              <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg hover:shadow-md transition-all">
                <span className="text-sm font-semibold text-blue-600 min-w-6">{index + 1}.</span>
                <p className="text-gray-900 font-medium flex-1 ml-3">{title}</p>
                <button
                  onClick={() => copyTitle(title)}
                  className="ml-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Description Generator Component
const DescriptionGeneratorTool = () => {
  const [videoTitle, setVideoTitle] = useState('')
  const [keywords, setKeywords] = useState('')
  const [generatedDescription, setGeneratedDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateFormat, setTemplateFormat] = useState('')
  const [minDescriptionLength, setMinDescriptionLength] = useState(500)
  const [savedTemplate, setSavedTemplate] = useState('')
  const [savedMinLength, setSavedMinLength] = useState(500)
  
  // Language and Country
  const [language, setLanguage] = useState('English')
  const [countries, setCountries] = useState<string[]>([])
  const [countryInput, setCountryInput] = useState('')

  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Korean', 'Hindi', 'Arabic', 'Russian']
  const popularCountries = ['USA', 'UK', 'Canada', 'Australia', 'India', 'Brazil', 'Germany', 'France', 'Japan', 'Mexico', 'Netherlands', 'Sweden', 'Singapore', 'UAE', 'South Africa']

  const addCountry = () => {
    if (countryInput.trim() && !countries.includes(countryInput.trim())) {
      setCountries([...countries, countryInput.trim()])
      setCountryInput('')
    }
  }

  const removeCountry = (country: string) => {
    setCountries(countries.filter(c => c !== country))
  }

  const generateDescription = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a video title')
      return
    }

    setLoading(true)
    try {
      const requiredLength = savedMinLength || minDescriptionLength
      let prompt = `Video title: "${videoTitle}"\nLanguage: ${language}\n${countries.length > 0 ? `Target Countries: ${countries.join(', ')}\n` : ''}${keywords ? `Keywords: ${keywords}` : ''}`
      
      if (savedTemplate) {
        prompt += `\nTemplate/Style: "${savedTemplate}"`
      }
      
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'description',
          minLength: requiredLength
        })
      })

      if (response.ok) {
        const data = await response.json()
        let desc = data.result || ''
        
        // Validate and retry if too short
        let attempts = 0
        while (desc.length < requiredLength && attempts < 3) {
          console.warn(`Description too short: ${desc.length} chars (need ${requiredLength}), retrying...`)
          attempts++
          
          const retryPrompt = `Video title: "${videoTitle}"\nLanguage: ${language}\n${countries.length > 0 ? `Target Countries: ${countries.join(', ')}\n` : ''}${keywords ? `Keywords: ${keywords}` : ''}\n\nWrite a VERY DETAILED, LONG, and COMPREHENSIVE video description that is AT LEAST ${requiredLength} characters. Must include:\n- Multiple paragraphs\n- Engaging introduction\n- Detailed content sections\n- Clear formatting\n- Timestamps if relevant\n- Call-to-action\n- Links section\n\nMake this description EXACTLY ${requiredLength}+ characters, no shorter.`
          
          const retryResponse = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: retryPrompt,
              type: 'description',
              minLength: requiredLength
            })
          })
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            const newDesc = retryData.result || ''
            if (newDesc.length > desc.length) {
              desc = newDesc
            }
          }
        }
        
        if (desc.length < requiredLength) {
          alert(`⚠️ Generated description is ${desc.length} characters (requested ${requiredLength}). Try generating again or increase AI response quality.`)
        }
        
        setGeneratedDescription(desc)
      } else {
        alert('Failed to generate description')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while generating description')
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = () => {
    if (!templateFormat.trim() || minDescriptionLength < 100) {
      alert('Please enter a template format and valid character length (minimum 100)')
      return
    }
    setSavedTemplate(templateFormat)
    setSavedMinLength(minDescriptionLength)
    setShowTemplateDialog(false)
    alert(`Template saved! Will generate descriptions of at least ${minDescriptionLength} characters`)
  }

  const copyDescription = () => {
    navigator.clipboard.writeText(generatedDescription)
    alert('Description copied!')
  }

  const clearTemplate = () => {
    setSavedTemplate('')
    setSavedMinLength(500)
    setTemplateFormat('')
    setMinDescriptionLength(500)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900">Description Generator</h2>
        </div>
        <p className="text-gray-600 mb-6">Create SEO-friendly video descriptions powered by Google Gemini AI</p>

        {/* Saved Template Display */}
        {savedTemplate && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-900">Active Template:</p>
                <p className="text-purple-800 text-sm mt-1">"{savedTemplate}" • Minimum {savedMinLength} characters</p>
              </div>
              <button
                onClick={clearTemplate}
                className="text-purple-600 hover:text-purple-900 text-sm font-semibold underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Language *</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Add Countries</label>
              <div className="flex gap-2">
                <select
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select or type country...</option>
                  {popularCountries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <button
                  onClick={addCountry}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {countries.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              {countries.map((country) => (
                <span key={country} className="inline-flex items-center gap-2 bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-sm font-medium">
                  {country}
                  <button
                    onClick={() => removeCountry(country)}
                    className="text-purple-600 hover:text-purple-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Video Title *</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter your video title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords (optional)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated keywords to include</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Minimum Description Length</label>
              <span className="text-sm font-semibold text-purple-600">{savedMinLength || minDescriptionLength} chars</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={savedMinLength || minDescriptionLength}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!savedTemplate) {
                    setMinDescriptionLength(val)
                  }
                }}
                disabled={!!savedTemplate}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <input
                type="number"
                min="100"
                max="5000"
                value={savedMinLength || minDescriptionLength}
                onChange={(e) => {
                  const val = Math.max(100, Math.min(5000, parseInt(e.target.value) || 500))
                  if (!savedTemplate) {
                    setMinDescriptionLength(val)
                  }
                }}
                disabled={!!savedTemplate}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-purple-500 outline-none text-sm disabled:opacity-50"
              />
            </div>
            {savedTemplate && <p className="text-xs text-purple-600 mt-1">Using template minimum: {savedMinLength} chars</p>}
            {!savedTemplate && <p className="text-xs text-gray-500 mt-1">YouTube allows up to 5000 characters</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateDescription}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                'Generate Description'
              )}
            </button>
            <button
              onClick={() => setShowTemplateDialog(true)}
              disabled={loading}
              className="bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-600 hover:to-purple-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              Create Template
            </button>
          </div>
        </div>

        {/* Template Dialog */}
        {showTemplateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Description Template</h3>
              <p className="text-gray-600 text-sm mb-4">Set the format, style, and minimum character length for your descriptions.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description Style/Format</label>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-gray-700 text-xs font-semibold mb-2">Examples:</p>
                    <ul className="text-gray-600 text-xs space-y-1">
                      <li>• "With timestamps, FAQ, and links"</li>
                      <li>• "Professional with hashtags and CTA"</li>
                      <li>• "Casual with emoji and engagement hooks"</li>
                      <li>• "Technical with chapters and resources"</li>
                      <li>• "Product review format with pros/cons"</li>
                    </ul>
                  </div>
                  
                  <textarea
                    value={templateFormat}
                    onChange={(e) => setTemplateFormat(e.target.value)}
                    placeholder="e.g., With timestamps, 'Check description' link, and FAQ section"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Description Length</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={minDescriptionLength}
                      onChange={(e) => setMinDescriptionLength(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      value={minDescriptionLength}
                      onChange={(e) => setMinDescriptionLength(Math.max(100, Math.min(5000, parseInt(e.target.value) || 500)))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                    <span className="text-xs text-gray-600 font-semibold">chars</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">YouTube allows up to 5000 characters</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateDialog(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!templateFormat.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {generatedDescription && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Description</h3>
              <button
                onClick={copyDescription}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-gray-900 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto font-mono">
              {generatedDescription}
            </div>
            <p className="text-xs text-gray-500 mt-2">Characters: {generatedDescription.length} / 5000</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Tag Generator Component
const TagGeneratorTool = () => {
  const [videoTitle, setVideoTitle] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [generatedTags, setGeneratedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateFormat, setTemplateFormat] = useState('')
  const [tagCount, setTagCount] = useState(10)
  const [savedTemplate, setSavedTemplate] = useState('')
  const [savedTagCount, setSavedTagCount] = useState(10)

  const generateTags = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a video title')
      return
    }

    setLoading(true)
    try {
      const countToGenerate = savedTagCount || 10
      let prompt = `Video title: "${videoTitle}"\n${videoDescription ? `Description: ${videoDescription}` : ''}`
      
      if (savedTemplate) {
        prompt += `\nTemplate/Style: "${savedTemplate}"`
      }
      
      prompt += `\nGenerate ${countToGenerate} relevant YouTube tags.`
      
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'tags'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const tags = (data.result || []).slice(0, countToGenerate)
        setGeneratedTags(tags)
      } else {
        alert('Failed to generate tags')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while generating tags')
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = () => {
    if (!templateFormat.trim() || tagCount < 1) {
      alert('Please enter a template format and valid tag count')
      return
    }
    setSavedTemplate(templateFormat)
    setSavedTagCount(tagCount)
    setShowTemplateDialog(false)
    alert(`Template saved! Will generate ${tagCount} tags using this template`)
  }

  const copyTags = () => {
    const tagString = generatedTags.join(', ')
    navigator.clipboard.writeText(tagString)
    alert('Tags copied!')
  }

  const removeTag = (index: number) => {
    setGeneratedTags(generatedTags.filter((_, i) => i !== index))
  }

  const clearTemplate = () => {
    setSavedTemplate('')
    setSavedTagCount(10)
    setTemplateFormat('')
    setTagCount(10)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Tag className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900">Tag Generator</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate relevant tags powered by Google Gemini AI for better video discovery</p>

        {/* Saved Template Display */}
        {savedTemplate && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-900">Active Template:</p>
                <p className="text-orange-800 text-sm mt-1">"{savedTemplate}" • {savedTagCount} tags</p>
              </div>
              <button
                onClick={clearTemplate}
                className="text-orange-600 hover:text-orange-900 text-sm font-semibold underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Video Title *</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter your video title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
            <textarea
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Paste your video description..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateTags}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                `Generate ${savedTagCount} Tags`
              )}
            </button>
            <button
              onClick={() => setShowTemplateDialog(true)}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              Create Template
            </button>
          </div>
        </div>

        {/* Template Dialog */}
        {showTemplateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create Tag Template</h3>
              <p className="text-gray-600 text-sm mb-4">Set your tag format and how many tags to generate.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tag Style/Format</label>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-gray-700 text-xs font-semibold mb-2">Examples:</p>
                    <ul className="text-gray-600 text-xs space-y-1">
                      <li>• "Gaming related, trending"</li>
                      <li>• "Technical and educational"</li>
                      <li>• "Niche specific tags"</li>
                      <li>• "Mixed popular and long-tail"</li>
                    </ul>
                  </div>
                  
                  <textarea
                    value={templateFormat}
                    onChange={(e) => setTemplateFormat(e.target.value)}
                    placeholder="e.g., Gaming, trending, viral focused"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Tags</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={tagCount}
                      onChange={(e) => setTagCount(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={tagCount}
                      onChange={(e) => setTagCount(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                      className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">YouTube allows max 500 chars of tags</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateDialog(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!templateFormat.trim()}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {generatedTags.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Tags ({generatedTags.length}/500 chars)</h3>
              <button
                onClick={copyTags}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
              >
                Copy All
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {generatedTags.map((tag, index) => (
                <div key={index} className="inline-flex items-center gap-2 bg-orange-100 border border-orange-300 text-orange-900 px-3 py-2 rounded-full text-sm font-medium hover:shadow-md transition-all">
                  <span>{tag}</span>
                  <button
                    onClick={() => removeTag(index)}
                    className="text-orange-600 hover:text-orange-900 font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Total characters: {generatedTags.join(', ').length} / 500 (YouTube limit)</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIToolsPage() {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)

  const handleToolClick = (toolId: string) => {
    if (toolId === 'seo-description-builder') {
      router.push('/ai-tools/seo-description-builder')
    } else if (toolId === 'description-templates') {
      router.push('/ai-tools/description-templates')
    } else if (toolId === 'tag-generator') {
      router.push('/ai-tools/tag-generator')
    } else if (toolId === 'title-generator') {
      router.push('/ai-tools/title-generator')
    } else if (toolId === 'channel-score') {
      router.push('/ai-tools/channel-score')
    } else {
      setSelectedTool(toolId)
    }
  }

  const renderToolContent = () => {
    switch (selectedTool) {
      case 'title-generator':
        return <TitleGeneratorTool />
      case 'description-generator':
        return <DescriptionGeneratorTool />
      case 'tag-generator':
        return <TagGeneratorTool />
      default:
        return <SavedDescriptionsHistory />
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <SharedSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      {/* Main Content */}
      <main className={`flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 mt-4 md:mt-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">AI Tools Hub</h1>
            <p className="text-gray-600 text-base md:text-lg">Powered by Google Gemini 2.5 Flash AI - Real-time content generation</p>
          </div>

          {/* Mobile Tools Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
              className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 font-semibold text-blue-900 hover:bg-blue-100 transition-colors flex items-center justify-between"
            >
              <span>✨ AI Tools</span>
              <span className={`transition-transform ${mobileToolsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>

          {/* Mobile Tools Selector */}
          {mobileToolsOpen && (
            <div className="lg:hidden mb-6 grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {AI_TOOLS.map((tool) => {
                const IconComponent = tool.icon
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      handleToolClick(tool.id)
                      setMobileToolsOpen(false)
                    }}
                    className={`text-left p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer text-sm ${
                      selectedTool === tool.id
                        ? `bg-gradient-to-br ${tool.color} text-white border-transparent shadow-lg`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <IconComponent className={`w-5 h-5 shrink-0 ${selectedTool === tool.id ? 'text-white' : 'text-gray-600'}`} />
                      <div>
                        <h3 className="font-semibold">{tool.name}</h3>
                        <p className={`text-xs mt-1 ${selectedTool === tool.id ? 'text-white/90' : 'text-gray-600'}`}>
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Sidebar - Tools List (Hidden on mobile, visible on lg+) */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-3">
                {AI_TOOLS.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        selectedTool === tool.id
                          ? `bg-gradient-to-br ${tool.color} text-white border-transparent shadow-lg scale-105`
                          : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-6 h-6 flex-shrink-0 ${selectedTool === tool.id ? 'text-white' : 'text-gray-600'}`} />
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base">{tool.name}</h3>
                          <p className={`text-xs mt-1 ${selectedTool === tool.id ? 'text-white/90' : 'text-gray-600'}`}>
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      {selectedTool === tool.id && (
                        <div className="mt-3 text-xs font-semibold text-white/90 flex items-center gap-1">
                          Active
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Quick Tips */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl sticky top-96">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">Pro Tips</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use all 3 tools together</li>
                  <li>• Real-time Gemini AI generation</li>
                  <li>• 1000 requests per day limit</li>
                  <li>• Always customize for your brand</li>
                </ul>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3 w-full col-span-1">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-8 sm:p-12 min-h-96">
                {renderToolContent()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

