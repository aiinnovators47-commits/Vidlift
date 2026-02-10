"use client"

export const dynamic = 'force-dynamic'

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Header } from "@/components/header"
import { CrenovaLogo } from "@/components/crenova-logo"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleAuth = () => {
    setIsLoading(true)
    setError("")
    
    // Use redirect and prompt select_account so the account chooser opens
    signIn("google", {
      callbackUrl: "/connect",
      prompt: 'select_account'
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header - Use home page navbar */}
      <Header />
      
      {/* Hero-like soft gradient background */}
      <div className="absolute inset-x-0 top-0 h-[70%] sm:h-[80%] lg:h-[85%] bg-linear-to-b from-sky-50/20 to-white pointer-events-none z-0" />

      {/* Decorative orbs removed per request (icons/animated elements removed) */}

      {/* Main Content - Simple centered auth card */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 pb-10 min-h-[calc(100vh-64px)] flex items-start justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">

          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-4">
              <CrenovaLogo />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black text-center">Crenova</h1>
            <p className="text-sm text-gray-500 mt-1">AI Creator Hub</p>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Welcome to Crenova</h2>
            <p className="text-sm sm:text-base text-gray-500">Sign in with your Google account to continue</p>
          </div>

          {/* Google Login Button */}
          <div className="w-full">
            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              aria-label="Sign in with Google" 
              title="Sign in with Google" 
              className="w-full border-2 border-gray-200 rounded-lg py-3 sm:py-4 text-sm font-semibold flex items-center justify-center gap-3 hover:shadow-md transition hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path fill="#EA4335" d="M23 9.5c2.9 0 5.3 1 7.1 2.5l5.3-5.3C33.5 3 28.9 1 23 1 14 1 6.2 6.7 3.2 14.9l6.6 5.1C11.4 13 16.6 9.5 23 9.5z"/>
                <path fill="#34A853" d="M44.5 24.5c0-1.6-.1-2.8-.4-4.1H23v7.5h12.2c-.5 2.6-1.9 4.9-4.1 6.4l6.3 4.9c3.7-3.4 5.1-8.6 5.1-14.7z"/>
                <path fill="#4285F4" d="M23 45c5.9 0 10.9-1.9 14.6-5.3l-6.3-4.9C28.9 36 26.2 37 23 37c-6.4 0-11.6-3.5-13.2-8.7l-6.6 5.1C6.2 39.3 14 45 23 45z"/>
                <path fill="#FBBC05" d="M3.2 14.9l6.6 5.1C10.8 20.3 16.1 17 23 17c3.6 0 6.9 1.2 9.4 3.3l6.9-6.9C34.5 7.6 28.3 5 23 5 16.6 5 11.5 7.8 8.5 12.2z"/>
              </svg>
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Footer Text */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-gentle-bounce {
          animation: gentle-bounce 3s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
