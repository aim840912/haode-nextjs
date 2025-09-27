'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  currentImage?: string
  onUpload: (imageUrl: string) => void
  onRemove?: () => void
  label?: string
  maxSize?: number // MB
}

export default function ImageUploader({
  currentImage,
  onUpload,
  onRemove,
  label = '上傳圖片',
  maxSize = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize * 1024 * 1024) {
      setError(`圖片大小不能超過 ${maxSize}MB`)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('只支援 JPG、PNG、WebP 和 GIF 格式')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/site-settings/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '上傳失敗')
      }

      onUpload(result.data.url)
      setPreview(result.data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳失敗')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove?.()
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="預覽"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
              <button
                type="button"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all"
                title="移除圖片"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <div className="flex flex-col items-center space-y-3">
              <ImageIcon className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">點擊選擇圖片</p>
                <p className="text-xs text-gray-500 mt-1">
                  支援 JPG、PNG、WebP、GIF，最大 {maxSize}MB
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <Upload className="w-5 h-5 animate-bounce" />
          <span className="text-sm">上傳中...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
