"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, LockOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LockAnimation() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [keyCount, setKeyCount] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUnlocked) return

      if (e.key !== "Enter") {
        setKeyCount((prev) => prev + 1)
        setShowButton(keyCount > 0)
      }

      if (e.key === "Enter") {
        setIsUnlocked(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isUnlocked, router, keyCount])

  const handleUnlockClick = () => {
    setIsUnlocked(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Lock Icon */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6 sm:mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`transition-all duration-500 transform ${
              isUnlocked ? "scale-110 -rotate-12" : "scale-100 rotate-0"
            }`}
          >
            {isUnlocked ? (
              <>
                <LockOpen className="w-24 h-24 sm:w-32 sm:h-32 text-green-500 drop-shadow-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full animate-ping"></div>
                </div>
              </>
            ) : (
              <Lock className="w-24 h-24 sm:w-32 sm:h-32 text-blue-600 drop-shadow-lg" />
            )}
          </div>
        </div>
      </div>

      {/* Status Text */}
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
        {isUnlocked ? "Access Granted!" : "Press Enter to Unlock"}
      </h3>
      <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
        {isUnlocked ? "Redirecting to dashboard..." : "Any key to start, then press Enter"}
      </p>

      {/* Key Counter */}
      {keyCount > 0 && !isUnlocked && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-mono text-blue-700 mb-6">
          Keys pressed: <span className="font-bold">{keyCount}</span>
        </div>
      )}

      {/* Unlock Button - Mobile Friendly */}
      {showButton && !isUnlocked && (
        <Button
          onClick={handleUnlockClick}
          className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-lg"
        >
          Unlock Now
        </Button>
      )}

      {/* Progress Bar */}
      {isUnlocked && (
        <div className="w-40 sm:w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-green-600 animate-pulse"></div>
        </div>
      )}
    </div>
  )
}
