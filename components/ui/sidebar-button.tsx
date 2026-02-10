import Link from 'next/link'
import React from 'react'
import { cn } from '@/lib/utils'

type SidebarButtonProps = {
  id?: string
  href?: string
  label: string
  Icon: React.ComponentType<any>
  isActive?: boolean
  onClick?: () => void
}

export default function SidebarButton({ id, href, label, Icon, isActive, onClick }: SidebarButtonProps) {
  const base = 'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-sm'

  const activeClasses = 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-700 border border-blue-300/50 shadow-sm'
  const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

  const iconActive = 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow'
  const iconInactive = 'bg-white/0'

  const content = (
    <div className="flex items-center space-x-3">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition', isActive ? iconActive : iconInactive)}>
        <Icon className={isActive ? 'h-4 w-4 text-white' : 'h-4 w-4 text-gray-500'} />
      </div>
      <span className="font-medium truncate">{label}</span>
    </div>
  )

  if (onClick) {
    return (
      <button key={id} onClick={onClick} className={cn(base, isActive ? activeClasses : inactiveClasses)}>
        {content}
      </button>
    )
  }

  return (
    <Link key={id} href={href || '#'} className={cn(base, isActive ? activeClasses : inactiveClasses)}>
      {content}
    </Link>
  )
}
