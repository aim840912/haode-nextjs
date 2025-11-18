import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'
import { MainImageDisplayProps } from './types'

/**
 * 主要圖片展示區元件
 *
 * 包含：
 * - 主圖片顯示
 * - 載入狀態動畫
 * - 前後導航按鈕
 * - 圖片指示器（圓點）
 * - 圖片計數器
 */
export const MainImageDisplay = React.memo<MainImageDisplayProps>(
  ({
    imageUrls,
    currentImageIndex,
    isImageLoaded,
    productName,
    className,
    onPrevious,
    onNext,
    onImageChange,
    onImageLoad,
  }) => {
    return (
      <div
        className={cn(
          'relative bg-white overflow-hidden group',
          className?.includes('elegant-frame')
            ? 'rounded-lg'
            : 'rounded-2xl shadow-2xl shadow-black/10 border border-white/20'
        )}
      >
        {/* 圖片容器 - 適應父容器高度 */}
        <div
          className={cn('relative', className?.includes('h-full') && 'h-full min-h-[300px]')}
          style={!className?.includes('h-full') ? { paddingBottom: '100%' } : {}}
        >
          <Image
            src={imageUrls[currentImageIndex]}
            alt={`${productName} - 圖片 ${currentImageIndex + 1}`}
            fill
            className="object-cover transition-all duration-700 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={currentImageIndex === 0}
            onLoad={onImageLoad}
          />

          {/* 覆蓋層效果 */}
          {className?.includes('elegant-frame') ? (
            <>
              <div className="absolute inset-0 shadow-inner shadow-amber-900/10" />
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/10 via-transparent to-orange-50/10 pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 shadow-inner shadow-black/5 rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/10 pointer-events-none" />
            </>
          )}
        </div>

        {/* 圖片載入狀態 */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/50 backdrop-blur-sm">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-200/50 border-t-amber-500"></div>
              <div className="absolute inset-1 animate-spin-reverse rounded-full h-12 w-12 border-3 border-orange-200/50 border-b-orange-400"></div>
              <div className="absolute inset-4 animate-pulse rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"></div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-700 animate-pulse">載入圖片中</p>
              <div className="flex space-x-1 justify-center">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 導航按鈕 */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110',
                className?.includes('elegant-frame')
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800 hover:text-amber-900 p-2 rounded-lg shadow-md border border-amber-200/50'
                  : 'bg-white/90 hover:bg-white text-gray-700 hover:text-amber-600 p-3 rounded-full shadow-lg hover:shadow-xl backdrop-blur-sm'
              )}
              aria-label="上一張圖片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={onNext}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110',
                className?.includes('elegant-frame')
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800 hover:text-amber-900 p-2 rounded-lg shadow-md border border-amber-200/50'
                  : 'bg-white/90 hover:bg-white text-gray-700 hover:text-amber-600 p-3 rounded-full shadow-lg hover:shadow-xl backdrop-blur-sm'
              )}
              aria-label="下一張圖片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* 圖片指示器 */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-2">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => onImageChange(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300 hover:scale-125',
                  index === currentImageIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white/60 hover:bg-white/80'
                )}
                aria-label={`切換到第 ${index + 1} 張圖片`}
              />
            ))}
          </div>
        )}

        {/* 圖片計數器 */}
        {imageUrls.length > 1 && (
          <div className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 px-3 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105">
            <span className="text-amber-600 font-bold">{currentImageIndex + 1}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span>{imageUrls.length}</span>
          </div>
        )}
      </div>
    )
  }
)

MainImageDisplay.displayName = 'MainImageDisplay'
