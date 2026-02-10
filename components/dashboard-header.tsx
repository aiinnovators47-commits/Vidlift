"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import {
    Search,
    Settings,
    User,
    LogOut,
    Menu,
    X,
    Play,
    ChevronDown,
    Youtube,
    Zap,
    Users,
    HelpCircle,
    Moon
} from "lucide-react"
import dynamic from 'next/dynamic'
const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })

interface DashboardHeaderProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
}

export default function DashboardHeader({ sidebarOpen, setSidebarOpen }: DashboardHeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session } = useSession()
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    const pageTitles: Record<string,string> = {
        '/dashboard': 'Dashboard',
        '/title-search': 'SEO Tags',
        '/vid-info': 'Vid-Info',
        '/compare': 'Compare',
        '/upload': 'Upload',
        '/challenge': 'Start Challenges'
    }

    const currentPageTitle = pageTitles[pathname?.split('?')?.[0] || pathname || '/dashboard'] || 'Dashboard'

    // Determine user's plan (fallback to Free)
    const planName = (session?.user as any)?.plan || (session?.user as any)?.subscription || 'Free'

    const handleSignOut = async () => {
        await signOut({ redirect: false })
        router.push('/')
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-transparent bg-transparent backdrop-blur-sm h-16">
            <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Left: Logo & Search */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {sidebarOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
                    </button>


                </div>

                {/* Right-side enlarged logo (partial right) */}
                <div className="hidden lg:flex items-center gap-3 ml-4 mr-2">
                  <Image src="/vidlyst-logo.svg" alt="Vidlyst" width={72} height={72} className="rounded-lg" />
                  <span className="text-2xl font-extrabold text-gray-900">Vidlyst</span>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <div className="hidden md:block mr-2">
                      {/* client-only, dynamic import to avoid SSR */}
                      <NotificationBell />
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-semibold text-gray-900">{session?.user?.name || "Creator"}</p>
                            </div>
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white text-sm font-bold">
                                        {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                                    </span>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                        </button>

                        {/* Profile Menu Dropdown */}
                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                                {/* Header with Avatar - Subtle bg */}
                                <div className="p-5 bg-gradient-to-b from-gray-50/50 to-white border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md shrink-0">
                                            <span className="text-white text-lg font-bold">
                                                {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 text-sm">{session?.user?.name || "Creator"}</p>
                                            <p className="text-xs text-gray-500">{session?.user?.email || '—'}</p>
                                        </div>
                                    </div>

                                    {/* Account Button (removed upgrade pricing CTA) */}
                                    <Link href="/profile" className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 text-gray-900 rounded-full hover:bg-gray-50 transition-all shadow-sm font-semibold">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            <span className="text-sm">Account</span>
                                        </div>
                                    </Link>
                                </div>

                                {/* Menu Items */}
                                <div className="p-3 space-y-1">
                                    <Link href="/profile">
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left">
                                            <User className="w-5 h-5 text-gray-700" />
                                            <span className="text-sm font-medium text-gray-900">User Profile</span>
                                        </button>
                                    </Link>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left">
                                        <Zap className="w-5 h-5 text-gray-700" />
                                        <span className="text-sm font-medium text-gray-900">Integrations</span>
                                    </button>
                                    <Link href="/settings">
                                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left">
                                            <Settings className="w-5 h-5 text-gray-700" />
                                            <span className="text-sm font-medium text-gray-900">Settings</span>
                                        </button>
                                    </Link>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left">
                                        <Users className="w-5 h-5 text-gray-700" />
                                        <span className="text-sm font-medium text-gray-900">Community</span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left">
                                        <HelpCircle className="w-5 h-5 text-gray-700" />
                                        <span className="text-sm font-medium text-gray-900">Help Center</span>
                                    </button>

                                    {/* Dark Mode Toggle */}
                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Moon className="w-5 h-5 text-gray-700" />
                                            <span className="text-sm font-medium text-gray-900">Dark Mode</span>
                                        </div>
                                        <button
                                            onClick={() => setDarkMode(!darkMode)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-3 py-2 border-t border-gray-100 bg-red-50/60">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors text-left"
                                    >
                                        <LogOut className="w-5 h-5 text-red-500" />
                                        <span className="text-sm font-semibold text-red-500">User Profile</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
