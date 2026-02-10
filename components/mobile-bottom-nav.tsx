"use client"

import { Home, Video, BarChart3, Sparkles, Settings, LogOut } from "lucide-react"

interface MobileBottomNavProps {
  activePage: string
  onNavigate: (page: string) => void
  onSignOut: () => void
}

export function MobileBottomNav({ activePage, onNavigate, onSignOut }: MobileBottomNavProps) {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "content", icon: Video, label: "Studio" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "vid-info", icon: Video, label: "Video Info" }, // Added new link
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <nav id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-2xl z-50">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition ${
                isActive ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={onSignOut}
          className="flex-1 flex flex-col items-center justify-center py-3 px-2 text-red-600 hover:text-red-700 transition"
        >
          <LogOut className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  )
}