"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Sparkles, MessageSquare, Video } from 'lucide-react'

export default function AiToolsSection({ className = '' }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const [keywords, setKeywords] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')

  async function generateFromInput() {
    setError(null)
    setKeywords(null)
    if (!inputText.trim()) {
      setError('Paste sample titles/tags/descriptions then try.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, topK: 25 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'LLM request failed')
      setKeywords(Array.isArray(data?.keywords) ? data.keywords.map((k: any) => k.keyword || k) : null)
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function generateFromTrending() {
    setError(null)
    setKeywords(null)
    setLoading(true)
    try {
      // Fetch trending API (server route already in repo) and build a combined text
      const t = await fetch('/api/youtube/trending?maxResults=100')
      const tv = await t.json()
      let combined = ''
      if (Array.isArray(tv.videos)) {
        combined = tv.videos.map((v: any) => [v.title, (v.tags || []).join(' '), v.description || ''].join(' ')).join('\n')
      } else if (Array.isArray(tv.keywords)) {
        combined = tv.keywords.map((k: any) => k.keyword || k).join('\n')
      } else {
        combined = JSON.stringify(tv).slice(0, 10000)
      }

      const res = await fetch('/api/ai/generate-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: combined, topK: 25 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'LLM request failed')
      setKeywords(Array.isArray(data?.keywords) ? data.keywords.map((k: any) => k.keyword || k) : null)
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-linear-to-br from-purple-50 via-pink-50 to-blue-50 border border-purple-200 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-50 animate-pulse"></div>
          <div className="relative p-3 md:p-4 bg-linear-to-br from-purple-500 to-pink-600 rounded-full shadow-lg">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-xl md:text-3xl font-bold text-gray-900">AI-Powered Tools</h3>
          <p className="text-sm md:text-base text-gray-600">Supercharge your content workflow — titles, descriptions, scripts & thumbnails</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Link href="/upload/normal" className="group bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition cursor-pointer flex items-start gap-3 md:gap-4 min-h-[84px] md:min-h-[110px]">
          <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 shadow-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm md:text-lg">Title Generator</h4>
            <p className="text-xs md:text-sm text-gray-600">Create high-CTR titles using AI</p>
          </div>
        </Link>

        <Link href="/upload/normal" className="group bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition cursor-pointer flex items-start gap-3 md:gap-4 min-h-[84px] md:min-h-[110px]">
          <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 shadow-md flex items-center justify-center">
            <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm md:text-lg">Description Writer</h4>
            <p className="text-xs md:text-sm text-gray-600">Get SEO-optimized descriptions</p>
          </div>
        </Link>

        <Link href="/upload/normal" className="group bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition cursor-pointer flex items-start gap-3 md:gap-4 min-h-[84px] md:min-h-[110px]">
          <div className="p-2 md:p-3 rounded-lg bg-linear-to-br from-orange-500 to-red-500 shadow-md flex items-center justify-center">
            <Video className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm md:text-lg">Script Generator</h4>
            <p className="text-xs md:text-sm text-gray-600">Generate AI-written scripts for videos</p>
          </div>
        </Link>
      </div>

      <div className="mt-4 text-sm md:text-sm text-gray-500">Explore tools to save time and improve content performance.</div>

      <div className="mt-6 bg-white border border-gray-100 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Generate Trending Keywords</h4>
        <p className="text-xs text-gray-600 mb-3">Use the provided Gemini model to generate a compact keyword list from sample video titles, tags or trending videos.</p>

        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste titles, tags or descriptions (or leave blank and click 'Use trending videos')" className="w-full p-2 border rounded-md text-sm mb-2" rows={3} />

        <div className="flex gap-2">
          <button onClick={generateFromInput} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">{loading ? 'Generating…' : 'Generate from input'}</button>
          <button onClick={generateFromTrending} disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50">{loading ? 'Generating…' : 'Use trending videos'}</button>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {keywords && (
          <div className="mt-3">
            <h5 className="text-sm font-semibold mb-2">Generated keywords</h5>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k, i) => (
                <div key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">{k}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
