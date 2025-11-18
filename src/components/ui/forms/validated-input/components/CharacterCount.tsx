import React from 'react'
import { cn } from '@/lib/utils/cn'

interface CharacterCountProps {
  value: string | number
  maxLength: number
  type: string
  showCharCount?: boolean
}

/**
 * 字數統計元件
 */
export const CharacterCount = React.memo(function CharacterCount({
  value,
  maxLength,
  type,
  showCharCount,
}: CharacterCountProps) {
  if (!showCharCount || !maxLength || type === 'number') return null

  const currentLength = String(value).length
  const percentage = currentLength / maxLength

  return (
    <span
      className={cn(
        'text-sm',
        percentage > 0.9 ? 'text-red-500' : percentage > 0.7 ? 'text-yellow-500' : 'text-gray-400'
      )}
    >
      {currentLength}/{maxLength}
    </span>
  )
})
