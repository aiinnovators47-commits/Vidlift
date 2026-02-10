"use client"

import React, { useEffect, useState, useRef } from 'react'

type Props = {
  open: boolean
  items: string[]
  perItemDuration?: number // ms
  maxDuration?: number // ms total cap
  useAll?: boolean
  sizeClass?: string
  onFinish?: () => void
}

export default function AnimationLoader({ open, items, perItemDuration = 3000, maxDuration, useAll = true, sizeClass = 'w-48 h-48', onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(open)
  const startRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setVisible(open)
    if (!open) return

    // Start timeline
    startRef.current = Date.now()
    setIndex(0)

    const advance = () => {
      const elapsed = Date.now() - (startRef.current || 0)
      const capped = typeof maxDuration === 'number' ? Math.min(maxDuration, elapsed) : elapsed

      // If not using all, only show first item for perItemDuration or maxDuration
      if (!useAll) {
        const duration = Math.min(perItemDuration, maxDuration || perItemDuration)
        timerRef.current = window.setTimeout(() => finish(), duration)
        return
      }

      // Use all: advance through items until we exceed maxDuration (if set) or show all
      const next = () => {
        const elapsedNow = Date.now() - (startRef.current || 0)
        if (maxDuration && elapsedNow >= maxDuration!) {
          finish()
          return
        }

        setIndex((prev) => {
          const nextIndex = prev + 1
          if (nextIndex >= items.length) {
            // reached end
            finish()
            return prev
          }

          // schedule next
          timerRef.current = window.setTimeout(next, perItemDuration)
          return nextIndex
        })
      }

      // Kick off cycle
      timerRef.current = window.setTimeout(next, perItemDuration)
    }

    // Start the loader
    advance()

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const finish = () => {
    setVisible(false)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (onFinish) {
      setTimeout(onFinish, 200)
    }
  }

  if (!visible) return null

  const src = items && items.length > 0 ? items[index % items.length] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl">
        {src && src.endsWith('.mp4') ? (
          <video src={src} autoPlay muted playsInline className={`${sizeClass} object-contain`} />
        ) : (
          <img src={src || ''} alt="Loading" className={`${sizeClass} object-contain`} />
        )}
        <div className="text-gray-800 font-semibold">Loading…</div>
      </div>
    </div>
  )
}
