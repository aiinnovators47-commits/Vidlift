"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center text-sm text-gray-600 mt-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {item.href ? (
            <Link href={item.href} className="text-blue-600 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-2" />
          )}
        </div>
      ))}
    </div>
  )
}