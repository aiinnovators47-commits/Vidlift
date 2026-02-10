export function CrenovaLogo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-12"
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#0EA5E9', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0284C7', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background circle with gradient */}
      <circle cx="24" cy="24" r="22" fill="url(#bgGradient)" filter="url(#shadow)" />

      {/* Inner highlight circle */}
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* Square inside circle */}
      <rect x="8" y="8" width="32" height="32" fill="rgba(255,255,255,0.05)" rx="4" />

      {/* Boy's head - improved */}
      <circle cx="18" cy="14" r="6" fill="#FFD4A3" />

      {/* Boy's body */}
      <ellipse cx="18" cy="24" rx="4" ry="6" fill="#6366F1" />

      {/* Boy's shoulders */}
      <ellipse cx="16" cy="22" rx="2" ry="3" fill="#6366F1" />
      <ellipse cx="20" cy="22" rx="2" ry="3" fill="#6366F1" />

      {/* Boy's left arm (going down) */}
      <path
        d="M 14.5 22 Q 10 26 9 32"
        stroke="#FFD4A3"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Boy's right arm (holding YouTube logo) */}
      <path
        d="M 21.5 22 Q 28 18 35 16"
        stroke="#FFD4A3"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* YouTube logo box - larger and sharper */}
      <g filter="url(#shadow)">
        <rect x="33" y="10" width="12" height="10" fill="#EF4444" rx="2" />
        <path
          d="M 39 13 L 39 18 L 43.5 15.5 Z"
          fill="white"
        />
      </g>

      {/* Boy's legs */}
      <rect x="16.5" y="30" width="2" height="7" fill="#1F2937" rx="1" />
      <rect x="19.5" y="30" width="2" height="7" fill="#1F2937" rx="1" />

      {/* Smile */}
      <path
        d="M 15.5 16 Q 18 17.5 20.5 16"
        stroke="#1F2937"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes - more expressive */}
      <circle cx="16" cy="13" r="0.8" fill="#1F2937" />
      <circle cx="20" cy="13" r="0.8" fill="#1F2937" />

      {/* Sparkle effect */}
      <g opacity="0.6">
        <circle cx="32" cy="24" r="1.5" fill="white" />
        <path d="M 32 22 L 32 26 M 30 24 L 34 24" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}
