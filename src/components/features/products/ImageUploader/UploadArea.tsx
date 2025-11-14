import { useRef, useCallback, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'
import { cn } from '@/lib/utils/cn'

interface UploadAreaProps {
  isUploading: boolean
  uploadProgress: number
  allowMultiple: boolean
  maxFiles: number
  acceptedTypes: string[]
  onFileSelect: (files: FileList | null) => void
  className?: string
}

export function UploadArea({
  isUploading,
  uploadProgress,
  allowMultiple,
  maxFiles,
  acceptedTypes,
  onFileSelect,
  className = '',
}: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      onFileSelect(files)
    },
    [onFileSelect]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files)
    // 清空 input 值，允許重新選擇相同檔案
    e.target.value = ''
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        dragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-gray-400',
        isUploading && 'pointer-events-none opacity-50',
        className
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div>
          <p className="text-lg font-medium text-gray-900">
            {dragActive ? '放開以上傳圖片' : '拖放圖片到這裡'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            或者{' '}
            <button
              type="button"
              onClick={openFileDialog}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              點擊選擇檔案
            </button>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            支援 JPEG、PNG、WebP、AVIF 格式，單檔最大 10MB
            {allowMultiple && ` (最多 ${maxFiles} 個檔案)`}
          </p>
        </div>
      </div>

      {/* 上傳進度 */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <div className="mt-2 text-sm text-gray-600">
              上傳中... {Math.round(uploadProgress)}%
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
