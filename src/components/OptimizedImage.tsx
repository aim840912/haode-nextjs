'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import LoadingSpinner from './LoadingSpinner';
import { handleImageError, buildResponsiveImageSrcSet } from '@/lib/image-utils';
import { useImageBlob } from '@/hooks/useImageBlob';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
  lazy?: boolean; // 啟用懶加載
  productId?: string; // 產品ID，用於生成響應式圖片
  enableResponsive?: boolean; // 啟用響應式圖片
  threshold?: number; // Intersection Observer 閾值
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc = '/images/placeholder.jpg',
  onError,
  onLoad,
  lazy = true,
  productId,
  enableResponsive = false,
  threshold = 0.1
}: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(priority || !lazy);
  const [shouldLoad, setShouldLoad] = useState(priority || !lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // 使用 useCallback 穩定回調函數引用
  const handleLoadCallback = useCallback(() => {
    onLoad?.();
  }, [src, onLoad]);

  const handleErrorCallback = useCallback((errorMsg: string) => {
    logger.error('圖片載入失敗', new Error(errorMsg), { metadata: { src, alt } });
    onError?.();
  }, [onError]);

  // 使用新的圖片 Blob Hook
  const { 
    processedSrc, 
    isLoading, 
    error, 
    isBase64,
    blobUrl 
  } = useImageBlob(src, {
    fallbackSrc,
    onLoad: handleLoadCallback,
    onError: handleErrorCallback
  });


  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, lazy, shouldLoad, threshold]);

  const handleLoad = () => {
    // Image loaded successfully
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    handleImageError(event, fallbackSrc);
  };

  // 基本的模糊預設圖片 base64
  const defaultBlurDataURL = 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  // 響應式圖片處理
  const finalSrc = shouldLoad && processedSrc ? processedSrc : '';
  const finalSizes = enableResponsive && productId ? 
    '(max-width: 200px) 200px, (max-width: 600px) 600px, 1200px' : 
    sizes;

  // 判斷圖片類型：base64、Blob URL 或普通 URL
  const isBase64OrBlob = finalSrc && (finalSrc.startsWith('data:') || finalSrc.startsWith('blob:'));
  

  const containerClassName = fill 
    ? `relative overflow-hidden ${className}` 
    : `relative overflow-hidden ${className}`;

  if (fill) {
    return (
      <div ref={imgRef} className={containerClassName}>
        {(!shouldLoad || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {shouldLoad ? <LoadingSpinner size="sm" /> : <div className="text-gray-400 text-sm">載入中...</div>}
          </div>
        )}
        {shouldLoad && finalSrc && (
          isBase64OrBlob ? (
            // 對於 base64 和 Blob URL，使用原生 img 標籤
            <img
              src={finalSrc}
              alt={alt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleLoad}
              onError={handleError}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            // 對於普通 URL，在 fill 模式下使用原生 img 標籤避免 Next.js Image 的兼容性問題
            <img
              src={finalSrc}
              alt={alt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ objectFit: 'cover' }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center">
            <div className="text-2xl mb-2">❌</div>
            <div className="font-semibold">圖片載入失敗</div>
            <div className="mt-1 opacity-80 text-xs">{error}</div>
            {isBase64 && (
              <div className="mt-1 text-xs text-blue-600">
                📷 Base64 → Blob 轉換
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={containerClassName}>
      {(!shouldLoad || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {shouldLoad ? <LoadingSpinner size="sm" /> : <div className="text-gray-400 text-sm">載入中...</div>}
        </div>
      )}
      {shouldLoad && finalSrc && (
        isBase64OrBlob ? (
          // 對於 base64 和 Blob URL，使用原生 img 標籤
          <img
            src={finalSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            className={`transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          // 對於普通 URL，使用 Next.js Image 組件進行優化
          <Image
            src={finalSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            sizes={finalSizes}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL || defaultBlurDataURL}
            className={`transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            onError={handleError}
          />
        )
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center">
          <div className="text-2xl mb-2">❌</div>
          <div className="font-semibold">圖片載入失敗</div>
          <div className="mt-1 opacity-80 text-xs">{error}</div>
          {isBase64 && (
            <div className="mt-1 text-xs text-blue-600">
              📷 Base64 → Blob 轉換
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 響應式圖片組件 - 使用 padding-bottom 技巧確保高度
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'aspect-square',
  className = '',
  productId,
  ...props
}: OptimizedImageProps & {
  aspectRatio?: string;
}) {
  // 將 aspectRatio 轉換為 padding-bottom 百分比
  const paddingBottomMap: Record<string, string> = {
    'aspect-square': '100%',    // 1:1
    'aspect-video': '56.25%',   // 16:9
    'aspect-[4/3]': '75%',      // 4:3
    'aspect-[3/2]': '66.67%',   // 3:2
    'aspect-[2/1]': '50%',      // 2:1
  };
  
  const paddingBottom = paddingBottomMap[aspectRatio] || '100%';
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div style={{ paddingBottom }} className="relative">
        <div className="absolute inset-0">
          <OptimizedImage
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            enableResponsive={true}
            productId={productId}
            lazy={true}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

// 頭像圖片組件
export function AvatarImage({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}: OptimizedImageProps & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const sizePx = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 }
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePx[size].width}
      height={sizePx[size].height}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}