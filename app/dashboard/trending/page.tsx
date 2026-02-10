"use client"

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Hash, ChevronLeft, Home, User, Video, BarChart3, Sparkles, Settings, LogOut, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TrendingPage() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [rawKeywords, setRawKeywords] = useState<any[]>([])
  const [originalRawKeywords, setOriginalRawKeywords] = useState<any[] | null>(null)
  const [popularKeywords, setPopularKeywords] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [serverSearching, setServerSearching] = useState(false)
  const [sortByFreq, setSortByFreq] = useState(true)
  const [selected, setSelected] = useState<any | null>(null)
  const [panelPos, setPanelPos] = useState<{left: number; top: number}>({ left: 0, top: 0 })
  const [isMobilePanel, setIsMobilePanel] = useState(false)
  const [maxFrequency, setMaxFrequency] = useState<number>(1)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  // lock scroll when mobile sidebar open
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sidebarOpen) {
      const y = window.scrollY || window.pageYOffset || 0
      document.body.style.position = 'fixed'
      document.body.style.top = `-${y}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      return () => {}
    } else {
      const top = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      if (top) {
        const scrollY = parseInt(top || '0') || 0
        window.scrollTo(0, Math.abs(scrollY))
      }
    }
  }, [sidebarOpen])

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/youtube/trending?maxResults=1000')
        const data = await res.json()
        const items = data?.keywords || data || []
        const raw = items.map((k: any) => (typeof k === 'string' ? { keyword: k, frequency: 0 } : k))
        setRawKeywords(raw)
        // store original snapshot for restoring after search
        if (!originalRawKeywords) setOriginalRawKeywords(raw)
        setKeywords(raw.map((r: any) => r.keyword))
        setTotalCount(raw.length)

        // determine max frequency for scoring
        const freqs = raw.map((r: any) => parseInt(r.frequency || r.count || 0) || 0)
        const maxF = freqs.length ? Math.max(...freqs) : 1
        setMaxFrequency(maxF || 1)

        if (data.popularKeywords && Array.isArray(data.popularKeywords)) {
          setPopularKeywords(data.popularKeywords.map((k: any) => (typeof k === 'string' ? { keyword: k } : k)))
        } else {
          setPopularKeywords([])
        }
      } catch (err) {
        console.error('Failed to fetch trending keywords', err)
        setKeywords([])
        setRawKeywords([])
        setMaxFrequency(1)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  // compute an estimated viral percent for a keyword
  const computePercent = (item: any) => {
    if (!item) return 0
    const freq = parseInt(item.frequency || item.count || 0) || 0
    if (freq > 0 && maxFrequency > 0) {
      return Math.min(100, Math.round((freq / Math.max(1, maxFrequency)) * 100))
    }

    // deterministic fallback based on keyword text so results are stable
    const s = String(item.keyword || '')
    let sum = 0
    for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i)
    // map into 20..85
    return 20 + (sum % 66)
  }

  function ViralRing({ percent, size = 64 }: { percent: number; size?: number }) {
    const stroke = 8
    const radius = (size - stroke) / 2
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="block">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={radius} stroke="#eef2ff" strokeWidth={stroke} fill="none" />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="url(#g1)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 700ms ease' }}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-sm font-semibold text-gray-900">{percent}%</div>
        </div>
      </div>
    )
  }

  // close panel when clicking outside
  useEffect(() => {
    if (!selected) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      // if clicked inside panel, keep open
      if (panelRef.current && panelRef.current.contains(target)) return
      // if clicked on a keyword button, keep open (handler will update selected)
      if ((e.target as Element).closest('.keyword-button')) return
      setSelected(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [selected])

  // server-side search: debounce query and call API when query is present
  useEffect(() => {
    const controller = new AbortController()
    const q = query.trim()
    if (!q) {
      // reset to client-side view: restore original fetched keywords
      setServerSearching(false)
      setPage(1)
      if (originalRawKeywords) {
        setRawKeywords(originalRawKeywords)
        setKeywords(originalRawKeywords.map((r: any) => r.keyword))
        setTotalCount(originalRawKeywords.length)
      } else {
        setTotalCount(rawKeywords.length)
      }
      return () => controller.abort()
    }

    const id = setTimeout(async () => {
      try {
        setServerSearching(true)
        setLoading(true)
        const res = await fetch(`/api/youtube/trending?maxResults=1000&query=${encodeURIComponent(q)}`, { signal: controller.signal })
        const data = await res.json()
        const items = data?.keywords || []
        const raw = items.map((k: any) => (typeof k === 'string' ? { keyword: k, frequency: 0 } : k))
        setRawKeywords(raw)
        setKeywords(raw.map((r: any) => r.keyword))
        setTotalCount(raw.length)
        setPage(1)
      } catch (e) {
        if ((e as any).name === 'AbortError') return
        console.error('Search failed', e)
      } finally {
        setLoading(false)
        setServerSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(id)
      controller.abort()
    }
  }, [query])

  // client-side filter when not searching server-side; server-side search will replace rawKeywords/keywords
  const filtered = keywords.filter(k => k.toLowerCase().includes(query.toLowerCase()))
  // pagination: compute displayed list
  const start = 0
  const displayed = (() => {
    const list = filtered.slice() // clone
    if (sortByFreq) {
      list.sort((a, b) => {
        const ra = rawKeywords.find((r: any) => r.keyword === a) || { frequency: 0 }
        const rb = rawKeywords.find((r: any) => r.keyword === b) || { frequency: 0 }
        return (parseInt(rb.frequency || rb.count || 0) || 0) - (parseInt(ra.frequency || ra.count || 0) || 0)
      })
    }
    return list.slice(0, page * pageSize)
  })()

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 pt-2 pb-2 px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-purple-600 shadow-md">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">YouTubeAI</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 p-2 rounded-md hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30 top-16" onClick={() => setSidebarOpen(false)}></div>}

      {/* Mobile Sidebar - slide-in */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 md:hidden z-40 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' as any }}
      >
        <nav className="p-4 space-y-2">
          <button onClick={() => { router.push('/dashboard'); setSidebarOpen(false) }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50">
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => { router.push('/profile'); setSidebarOpen(false) }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button onClick={() => { router.push('/videos'); setSidebarOpen(false) }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50">
            <Video className="w-5 h-5" />
            <span>Videos</span>
          </button>
          <button onClick={() => { router.push('/analytics'); setSidebarOpen(false) }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50">
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
          <button onClick={() => { router.push('/upload/normal'); setSidebarOpen(false) }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50">
            <Sparkles className="w-5 h-5" />
            <span>AI Tools</span>
          </button>
          <button onClick={() => { router.push('/settings'); setSidebarOpen(false) }} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button onClick={() => { setSidebarOpen(false); router.push('/signout') }} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 p-3 rounded-lg bg-transparent border border-red-200 text-sm">
            <LogOut className="w-4 h-4 mr-2 inline" />
            Sign Out
          </button>
        </div>
      </aside>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 border-b border-gray-200 bg-white h-16">
        <div className="flex h-16 items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-purple-600 shadow-lg transition shrink-0">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">YouTubeAI Pro</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Creator Studio</p>
                <p className="text-xs text-gray-500">Trending Keywords</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar (static simplified copy) */}
        <aside className={`hidden md:flex flex-col w-64 border-r border-gray-200 bg-white fixed left-0 top-16 bottom-0 overflow-y-auto`}>
          <nav className="p-4 space-y-1">
            <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <Home className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Profile</span>
            </Link>
            <Link href="/videos" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <Video className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Videos</span>
            </Link>
            <Link href="/analytics" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Analytics</span>
            </Link>
            <Link href="/upload/normal" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <Sparkles className="w-5 h-5 text-gray-600" />
              <span className="font-medium">AI Tools</span>
            </Link>
            <Link href="/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Settings</span>
            </Link>
          </nav>
          <div className="px-4 py-4 border-t border-gray-100 mt-auto">
            <button className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500 text-white">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8 rounded-xl md:rounded-2xl bg-linear-to-r from-blue-50 to-purple-50 border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/dashboard')} className="p-2 rounded-md hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Keywords</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    aria-label="Search keywords"
                    placeholder="Search keywords"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-md w-full"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSortByFreq(!sortByFreq)} className="px-3 py-2 bg-gray-100 rounded-md text-sm">{sortByFreq ? 'Sort: Frequency' : 'Sort: Alphabet'}</button>
                  <Button onClick={() => setQuery('')} aria-label="Clear search">Clear</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
            {loading ? (
              <p className="text-gray-500">Loading keywords…</p>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">Showing {displayed.length}{totalCount ? ` of ${totalCount}` : ''} keywords {serverSearching && <span className="text-xs text-gray-400">(server search)</span>}</p>

                {/* Popular keywords card: those used in million+ view videos */}
                {popularKeywords && popularKeywords.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg bg-linear-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Top Keywords In Million-View Videos</h4>
                    <div className="flex flex-wrap gap-2">
                      {popularKeywords.map((p: any, i: number) => (
                        <button key={i} onClick={() => { setQuery(p.keyword); setSelected(p); }} className="px-3 py-1 rounded-full bg-white border text-sm text-gray-800 hover:shadow">
                          {p.keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* If user is searching show a single column list (better for mobile) */}
                {displayed.length === 0 && <div className="text-gray-500">No results</div>}
                <div className={query.trim() ? 'flex flex-col gap-3' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'}>
                  {displayed.map((kw, idx) => {
                    const raw = rawKeywords.find((r: any) => r.keyword === kw) || { keyword: kw, frequency: 0 }
                    return (
                      <button
                        key={idx}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const left = rect.left
                          const top = rect.bottom + 8 + window.scrollY
                          setPanelPos({ left, top })
                          setIsMobilePanel(window.innerWidth < 768)
                          setSelected(raw)
                        }}
                        aria-label={`Keyword ${kw}`}
                        className={query.trim() ? "keyword-button w-full p-4 rounded-lg border border-gray-100 bg-gray-50 text-base md:text-sm text-gray-900 text-left hover:bg-gray-100 transition" : "keyword-button p-3 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-900 text-left hover:bg-gray-100 transition"}
                      >
                        <div className="flex items-center gap-3">
                          <Hash className="w-5 h-5 text-gray-500 shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">{kw}</div>
                            <div className="text-xs text-gray-500 mt-1">Frequency: {raw.frequency ?? raw.count ?? 'N/A'}</div>
                          </div>
                          <div className="text-sm text-gray-500">View</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Load more control when available */}
                {displayed.length > 0 && totalCount && displayed.length < totalCount && (
                  <div className="mt-4 flex justify-center">
                    <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-md">Load more</button>
                  </div>
                )}
                {/* Details panel: desktop popover and mobile bottom sheet */}
                {selected && (
                  <>
                    {/* Desktop popover */}
                    {!isMobilePanel && (
                      <div
                        ref={panelRef}
                        style={{ left: panelPos.left, top: panelPos.top }}
                        className="hidden md:block fixed z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">{selected.keyword}</h4>
                            <p className="text-xs text-gray-500">Frequency: {selected.frequency ?? selected.count ?? 'N/A'}</p>
                          </div>
                          <div className="flex items-center">
                            <ViralRing percent={computePercent(selected)} size={64} />
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">Viral possibility is an estimated score based on recent activity for this keyword.</div>
                        <div className="mt-3 text-right">
                          <button onClick={() => setSelected(null)} className="text-sm text-blue-600">Close</button>
                        </div>
                      </div>
                    )}

                    {/* Mobile bottom sheet */}
                    {isMobilePanel && (
                      <div ref={panelRef} className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 p-4 rounded-t-xl shadow-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">{selected.keyword}</h4>
                          <button onClick={() => setSelected(null)} className="text-sm text-gray-500">Close</button>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <ViralRing percent={computePercent(selected)} size={72} />
                          <div>
                            <p className="text-sm text-gray-600">Frequency: {selected.frequency ?? selected.count ?? 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-2">Viral possibility estimated from recent trends.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
