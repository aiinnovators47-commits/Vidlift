"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function PageProgress() {
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [pct, setPct] = useState(0)
  const timer = useRef<number | null>(null)
  const finishTimeout = useRef<number | null>(null)

  useEffect(() => {
    // Prefetch popular routes once on mount to speed up navigation
    try {
      router.prefetch('/title-search')
      router.prefetch('/dashboard')
      router.prefetch('/challenge')
    } catch (e) {}
  }, [router])

  const startProgress = () => {
    if (finishTimeout.current) { clearTimeout(finishTimeout.current); finishTimeout.current = null }
    if (timer.current) { clearInterval(timer.current); timer.current = null }
    setVisible(true)
    setPct(8)
    timer.current = window.setInterval(() => {
      setPct((p) => Math.min(92, p + Math.random() * 12))
    }, 250)
  }

  const finishProgress = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
    setPct(100)
    finishTimeout.current = window.setTimeout(() => {
      setVisible(false)
      setPct(0)
      finishTimeout.current = null
    }, 220)
  }

  useEffect(() => {
    // Listen for clicks on links to start the progress immediately (works on older Next versions)
    const onDocClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement
        const anchor = target.closest && (target.closest('a') as HTMLAnchorElement | null)
        if (!anchor) return
        const href = anchor.getAttribute('href')
        if (!href) return
        // Ignore external, mailto, tel, hash links
        if (href.startsWith('http') && !href.startsWith(window.location.origin)) return
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return
        // If link goes to a different location, start progress
        const url = new URL(anchor.href, window.location.href)
        if (url.href !== window.location.href) {
          startProgress()
        }
      } catch (e) {}
    }

    window.addEventListener('click', onDocClick, true)
    // Also detect popstate/back/forward
    const onPop = () => startProgress()
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('click', onDocClick, true)
      window.removeEventListener('popstate', onPop)
      if (timer.current) { clearInterval(timer.current); timer.current = null }
      if (finishTimeout.current) { clearTimeout(finishTimeout.current); finishTimeout.current = null }
    }
  }, [])

  // Finish when pathname changes (navigation completed)
  useEffect(() => {
    if (visible) finishProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none">
      <div className="h-1 bg-amber-400 shadow-md transition-all duration-200" style={{ width: `${pct}%` }} />
    </div>
  )
}
