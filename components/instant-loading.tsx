"use client"

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function InstantLoading() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Reset loading state when route changes
    setIsLoading(false)
  }, [pathname, searchParams])

  // For manual triggering of loading states
  const showLoading = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 300) // Auto-hide after 300ms
  }

  // Make it globally available
  if (typeof window !== 'undefined') {
    (window as any).showInstantLoading = showLoading
  }

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}