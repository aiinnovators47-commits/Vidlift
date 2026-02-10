"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronRight, LogOut, User, Mail, Trophy } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { ProfessionalLogoWithText } from "@/components/professional-logo"
import NotificationBell from "@/components/notification-bell"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthPage = pathname === "/signup" || pathname === "/signin"

  const handleGetStarted = () => {
    if (session) {
      router.push("/connect")
    } else {
      router.push("/signup")
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="mx-auto px-3 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo - responsive */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2 shrink-0 ml-0 sm:ml-20 hover:opacity-80 transition-opacity">
            <ProfessionalLogoWithText className="text-black" />
          </Link>

          {/* Center: Navigation */}
          {!isAuthPage && (
            <nav className="flex-1 hidden md:flex items-center justify-center gap-8">
              <Link href="#why" className="text-sm font-medium text-gray-600 hover:text-sky-600 transition">
                Why VidTools
              </Link>
              <Link href="#how" className="text-sm font-medium text-gray-600 hover:text-sky-600 transition">
                How It Works
              </Link>
              <Link href="#tools" className="text-sm font-medium text-gray-600 hover:text-sky-600 transition">
                Tools
              </Link>
              <Link href="#blog" className="text-sm font-medium text-gray-600 hover:text-sky-600 transition">
                Blog
              </Link>
            </nav>
          )}

          {/* Right: User Menu */}
          <div className="flex items-center gap-4 ml-auto">
            {session ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="hidden md:block">
                  <NotificationBell />
                </div>
                
                {/* User Info with Email */}
                <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                      {session.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {session.user?.name || "User"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {session.user?.email || "user@example.com"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-sm group"
                >
                  <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  <span>Logout</span>
                </button>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 md:hidden">
                  {session.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            ) : (
              <button 
                onClick={handleGetStarted}
                className="hidden md:flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Request Early Access
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-lg rounded-b-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 space-y-2">
              {!isAuthPage && (
                <>
                  <Link href="#" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Get Started</Link>
                  <Link href="#" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Create strategy</Link>
                  <Link href="#pricing" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Pricing</Link>
                  <Link href="#contact" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Contact</Link>
                </>
              )}
              {session ? (
                <div className="pt-2 border-t border-gray-200">
                  {/* Mobile User Info */}
                  <div className="px-3 py-3 bg-gray-50 rounded-lg mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {session.user?.name || "User"}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{session.user?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Achievements Link */}
                  <Link href="/achievements" className="block w-full">
                    <Button 
                      variant="outline"
                      className="w-full justify-start gap-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 mb-2"
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Achievements</span>
                    </Button>
                  </Link>
                  
                  {/* Notification Bell for Mobile */}
                  <div className="mb-3 md:hidden">
                    <NotificationBell />
                  </div>
                  
                  {/* Enhanced Mobile Logout Button */}
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleGetStarted} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
