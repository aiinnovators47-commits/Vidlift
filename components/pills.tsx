"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import React from "react"

type PillNavItem = {
  href: string
  label: string
}

export function PillNav({ items, className = "" }: { items: PillNavItem[]; className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full bg-white px-2 py-1 shadow-sm border border-gray-200 ${className}`}>
      {items.map((it, idx) => (
        <React.Fragment key={it.href}>
          <Link href={it.href} className="text-sm font-medium text-gray-700 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors">
            {it.label}
          </Link>
          {idx < items.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-300" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export function PillButton({ children, onClick, href, variant = "default" }: { children: React.ReactNode; onClick?: () => void; href?: string; variant?: "default" | "primary" }) {
  const base = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
  const styles = variant === "primary"
    ? "bg-black text-white hover:bg-neutral-800 shadow-sm"
    : "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-sm"

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles}`}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}
