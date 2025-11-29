import { cn } from '@/lib/utils/cn'

interface EmptyGalleryPlaceholderProps {
  className?: string
}

export function EmptyGalleryPlaceholder({ className = '' }: EmptyGalleryPlaceholderProps) {
  return (
    <div className={cn('text-center py-8 text-gray-500', className)}>
      <svg
        className="w-16 h-16 mx-auto mb-4 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p>尚未上傳任何圖片</p>
      <p className="text-sm mt-1">請使用上方的圖片上傳功能</p>
    </div>
  )
}
