import React from "react";

export function ProfessionalLogo() {
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
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main circular background */}
      <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" filter="url(#logoShadow)" />

      {/* Inner ring */}
      <circle cx="24" cy="24" r="19" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />

      {/* Play button symbol representing YouTube/AI */}
      <g transform="translate(12, 12)">
        {/* Play button base */}
        <polygon 
          points="12,6 12,18 24,12" 
          fill="white" 
          opacity="0.9"
        />
        
        {/* AI circuit pattern */}
        <path 
          d="M8 8 L10 6 M10 6 L12 8 M12 8 L10 10 M10 10 L8 8 Z" 
          stroke="white" 
          strokeWidth="0.8" 
          fill="none"
          opacity="0.7"
        />
        <path 
          d="M16 16 L18 14 M18 14 L20 16 M20 16 L18 18 M18 18 L16 16 Z" 
          stroke="white" 
          strokeWidth="0.8" 
          fill="none"
          opacity="0.7"
        />
      </g>

      {/* Subtle abstract shapes for modern tech feel */}
      <circle cx="32" cy="16" r="2" fill="white" opacity="0.3" />
      <circle cx="16" cy="32" r="1.5" fill="white" opacity="0.3" />
      
      {/* Abstract geometric accent */}
      <path 
        d="M28 24 L30 22 L32 24 L30 26 Z" 
        fill="white" 
        opacity="0.4"
      />
    </svg>
  );
}

export function ProfessionalLogoWithText({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ProfessionalLogo />
      <span className="text-xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif" }}>
        Vidiomex
      </span>
    </div>
  );
}