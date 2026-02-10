"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import UpgradeCard from "@/components/upgrade-card"
import { CREDIT_COSTS } from "@/models/Credit"

export default function DescriptionGeneratorPage() {
  const [videoTitle, setVideoTitle] = useState('')
  const [keywords, setKeywords] = useState('')
  const [generatedDescription, setGeneratedDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [insufficientCredits, setInsufficientCredits] = useState(false)
  const [showUpgradeCard, setShowUpgradeCard] = useState(false)

  // Check if user has enough credits before generating
  const checkCreditsBeforeGenerate = async (): Promise<boolean> => {
    try {
      const creditsRes = await fetch('/api/credits');
      if (!creditsRes.ok) {
        alert('Failed to check credits');
        return false;
      }
      
      const creditsData = await creditsRes.json();
      if (creditsData.credits < CREDIT_COSTS.DESCRIPTION_GENERATOR) {
        setShowUpgradeCard(true);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking credits:', err);
      alert('Failed to verify credits');
      return false;
    }
  };

  // Deduct credits after successful generation
  const deductCredits = async () => {
    try {
      const deductRes = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: CREDIT_COSTS.DESCRIPTION_GENERATOR, feature: 'description_generator' })
      });
      
      const result = await deductRes.json();
      
      if (!deductRes.ok) {
        if (result.insufficient) {
          setShowUpgradeCard(true);
        }
        return false;
      }
      
      if (result.success) {
        // Dispatch event to update credits in sidebar
        window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: { credits: result.credits } }));
      }
      return true;
    } catch (err) {
      console.error('Error deducting credits:', err);
      return false;
    }
  };

  const generateDescription = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a video title')
      return
    }

    // Check credits before generating
    const hasCredits = await checkCreditsBeforeGenerate();
    if (!hasCredits) return;

    setLoading(true)
    setInsufficientCredits(false)
    try {
      const response = await fetch('/api/youtube/description-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedDescription(data.description || '')
        
        // Deduct credits after successful generation
        await deductCredits()
      } else {
        alert('Failed to generate description')
      }
    } catch (error) {
      console.error('Error generating description:', error)
      alert('An error occurred while generating description')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDescription)
    alert('Description copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/ai-tools"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-8 transition-colors"
        >
          ← Back to AI Tools
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 sm:p-10">
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">📝 Description Generator</h1>
                <p className="text-gray-600">Generate compelling video descriptions with SEO optimization</p>
              </div>

              {/* Input Section */}
              <div className="space-y-6">
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
                  <p className="text-xs text-gray-500 mt-1">Comma-separated keywords to include in description</p>
                </div>

                <button
                  onClick={generateDescription}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200"
                >
                  {loading ? 'Generating...' : '✨ Generate Description'}
                </button>
              </div>

              {/* Output Section */}
              {generatedDescription && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Generated Description</h3>
                    <button
                      onClick={copyToClipboard}
                      className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md font-semibold transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-gray-900 whitespace-pre-wrap text-sm leading-relaxed max-h-96 overflow-y-auto">
                    {generatedDescription}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                💡 Pro Tips
              </h4>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>✓ Include relevant keywords naturally</li>
                <li>✓ Keep first 2 lines engaging</li>
                <li>✓ Add timestamps for longer videos</li>
                <li>✓ Include channel links and playlists</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-bold text-blue-900 mb-3">📊 Best Practices</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Use 150-300 words</li>
                <li>• Add call-to-action</li>
                <li>• Include video chapters</li>
                <li>• Link to related content</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        {showUpgradeCard && <UpgradeCard />}
      </main>
    </div>
  )
}
