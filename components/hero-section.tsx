"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const handleStartNow = async () => {
        setIsLoading(true)
        try {
            if (session) {
                await router.push("/connect")
            } else {
                await router.push("/signup")
            }
        } catch (error) {
            console.error("Navigation error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <section className="relative py-24 sm:py-32 lg:py-40 bg-white overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
                <div className={`flex flex-col items-center justify-center text-center transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 bg-blue-100/60 border border-blue-200 px-4 py-2 rounded-full">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Join 10,000+ YouTube creators on the waitlist</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl">
                        <span className="text-gray-900">Don't Just Upload Videos.</span>
                        <span className="block mt-3 bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                            Dominate Your Niche.
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                        An AI-powered YouTube system that helps you turn ideas into optimized, ranked videos that feel <span className="font-semibold">intentional</span>, not random.
                    </p>

                    {/* CTA Button */}
                    <div className="flex flex-col items-center gap-4 mb-12">
                        <button 
                            onClick={handleStartNow}
                            disabled={isLoading}
                            className="relative px-10 py-4 bg-linear-to-r from-sky-400 to-blue-500 text-white rounded-xl font-semibold text-lg hover:from-sky-500 hover:to-blue-600 transition-all duration-300 inline-flex items-center gap-2 shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-90 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading && (
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 opacity-75 animate-pulse" />
                            )}
                            <span className={`relative flex items-center gap-2 ${isLoading ? 'opacity-100' : ''}`}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Loading...</span>
                                    </>
                                ) : (
                                    <>
                                        Start Now
                                        <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </span>
                        </button>
                        <p className="text-sm text-gray-600">No credit card required to get started.</p>
                    </div>

                    {/* Benefits */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">No Credit Card Required</span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">YouTube Safe</span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Channel-Based Onboarding</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </section>
    )
}