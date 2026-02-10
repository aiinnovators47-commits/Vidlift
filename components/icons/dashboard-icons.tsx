import React from 'react'

type SVGProps = React.SVGProps<SVGSVGElement>

export const ViewsIcon = ({ className = 'w-5 h-5', ...props }: SVGProps) => (
  // Search / magnifier icon
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="11" cy="11" r="6" />
    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
  </svg>
)

export const SubscribersIcon = ({ className = 'w-5 h-5', ...props }: SVGProps) => (
  // Bell / notification icon
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6 6.002 6.002 0 0012 8a6 6 0 00-5.6 6.6c0 .538-.214 1.055-.595 1.445L4 17h5" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

export const WatchTimeIcon = ({ className = 'w-5 h-5', ...props }: SVGProps) => (
  // Video / play icon inside rounded rectangle
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="2" y="6" width="20" height="12" rx="3" />
    <path d="M10 9l6 3-6 3V9z" />
  </svg>
)

export const EngagementIcon = ({ className = 'w-5 h-5', ...props }: SVGProps) => (
  // Handshake icon (simplified)
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M3 12l4 4 5-5" />
    <path d="M12 15l5-5 4 4" />
    <path d="M7 12l2-2" />
    <path d="M14 9l2-2" />
  </svg>
)

export const UploadedIcon = ({ className = 'w-5 h-5', ...props }: SVGProps) => (
  // Clipboard / checklist with magnifier (custom)
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="3" y="4" width="10" height="16" rx="2" />
    <path d="M7 8h6" />
    <path d="M7 12h6" />
    <circle cx="18" cy="18" r="3" />
    <path d="M20.5 20.5 L22 22" />
    <path d="M19 19 L20.5 20.5" />
  </svg>
)
