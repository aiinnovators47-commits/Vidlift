'use client'

import React from 'react'
import { X } from 'lucide-react'
import type { ScoredTag } from '@/lib/scoreTag'

export interface TagBoxProps {
  tags: ScoredTag[] | any[]
  onRemoveTag?: (tag: string) => void
  showScore?: boolean
  showViralScore?: boolean
  showConfidence?: boolean
  maxTags?: number
  className?: string
}

/**
 * TagBox Component - vidIQ-style tag display
 * Shows tags with color-coded scores and viral indicators
 */
export function TagBox({
  tags,
  onRemoveTag,
  showScore = true,
  showViralScore = false,
  showConfidence = false,
  maxTags,
  className = ''
}: TagBoxProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags

  const getColorClasses = (color: string | undefined): string => {
    const colorMap: Record<string, string> = {
      emerald: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
      orange: 'bg-orange-600/20 text-orange-400 border border-orange-500/30',
      blue: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      amber: 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
      purple: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
      rose: 'bg-rose-600/20 text-rose-400 border border-rose-500/30',
      cyan: 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30',
      indigo: 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30',
      green: 'bg-green-600/20 text-green-400 border border-green-500/30',
      yellow: 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
      red: 'bg-red-600/20 text-red-400 border border-red-500/30'
    }
    return colorMap[color || 'blue'] || colorMap.blue
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTags.map((tag, index) => {
        // Handle both ScoredTag and string types
        const tagName = typeof tag === 'string' ? tag : tag.tag
        const score = typeof tag !== 'string' ? tag.score : undefined
        const viralScore = typeof tag !== 'string' ? tag.viralScore : undefined
        const confidence = typeof tag !== 'string' ? tag.confidence : undefined
        const color = typeof tag !== 'string' ? tag.color : undefined

        return (
          <div
            key={index}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
              text-sm font-medium transition-all hover:scale-105
              ${getColorClasses(color)}
            `}
            title={`Score: ${score}, Viral: ${viralScore}, Confidence: ${confidence}`}
          >
            <span className="flex-1">{tagName}</span>

            {showScore && score !== undefined && (
              <span className="text-xs font-bold opacity-75">{score}</span>
            )}

            {showViralScore && viralScore !== undefined && (
              <span className="text-xs font-bold opacity-60">⚡{viralScore}</span>
            )}

            {showConfidence && confidence && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">
                {confidence[0].toUpperCase()}
              </span>
            )}

            {onRemoveTag && (
              <button
                onClick={() => onRemoveTag(tagName)}
                className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors"
                aria-label={`Remove ${tagName}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )
      })}

      {tags.length === 0 && (
        <div className="text-gray-400 italic py-2">
          No tags yet
        </div>
      )}
    </div>
  )
}

export default TagBox
