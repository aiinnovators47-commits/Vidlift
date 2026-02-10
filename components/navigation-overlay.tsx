"use client"

import React, { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const DEFAULT_ITEMS = ['/animation/running.gif','/animation/loading1.gif','/animation/loading2.gif','/animation/screening.gif']

export default function NavigationOverlay({ items = DEFAULT_ITEMS, perItemDuration = 800, minShow = 600 }: { items?: string[], perItemDuration?: number, minShow?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const openAtRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const idxRef = useRef(0)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement
        const anchor = target.closest && (target.closest('a') as HTMLAnchorElement | null)
        if (!anchor) return
        const href = anchor.getAttribute('href')
        if (!href) return
        if (href.startsWith('http') && !href.startsWith(window.location.origin)) return
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return
        const url = new URL(anchor.href, window.location.href)
        if (url.href !== window.location.href) {
          // start overlay
          idxRef.current = (idxRef.current + 1) % items.length
          openAtRef.current = Date.now()
          setOpen(true)
          // ensure it shows at least minShow
          if (timerRef.current) { clearTimeout(timerRef.current) }
          timerRef.current = window.setTimeout(() => {
            setOpen(false)
            timerRef.current = null
            openAtRef.current = null
          }, Math.max(minShow, perItemDuration))
        }
      } catch (e) {}
    }

    const onPop = () => {
      idxRef.current = (idxRef.current + 1) % items.length
      openAtRef.current = Date.now()
      setOpen(true)
      if (timerRef.current) { clearTimeout(timerRef.current) }
      timerRef.current = window.setTimeout(() => {
        setOpen(false)
        timerRef.current = null
        openAtRef.current = null
      }, Math.max(minShow, perItemDuration))
    }

    window.addEventListener('click', onDocClick, true)
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('click', onDocClick, true)
      window.removeEventListener('popstate', onPop)
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    }
  }, [items, perItemDuration, minShow])

  // Close on pathname change as well if it's been open a short while
  useEffect(() => {
    if (!open) return
    const elapsed = openAtRef.current ? Date.now() - openAtRef.current : 0
    // If we've already shown long enough, close now, else ensure minShow
    const remaining = Math.max(0, 600 - elapsed)
    const t = window.setTimeout(() => setOpen(false), remaining)
    return () => window.clearTimeout(t)
  }, [pathname])

  return (
    open && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg font-semibold text-gray-800">Loading...</p>
          <p className="text-sm text-gray-500">Redirecting</p>
        </div>
      </div>
    )
  )
}
