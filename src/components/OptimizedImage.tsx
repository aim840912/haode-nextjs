'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { handleImageError, buildResponsiveImageSrcSet } from '@/lib/image-utils';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || shouldLoad) return;

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
  }, [lazy, priority, shouldLoad, threshold]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    }
    
    // 使用工具函數處理錯誤
    handleImageError(event, fallbackSrc);
    onError?.();
  };

  // 基本的模糊預設圖片 base64
  const defaultBlurDataURL = 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  // 響應式圖片處理
  const finalSrc = shouldLoad ? currentSrc : '';
  const finalSizes = enableResponsive && productId ? 
    '(max-width: 200px) 200px, (max-width: 600px) 600px, 1200px' : 
    sizes;

  const containerClassName = fill 
    ? `relative overflow-hidden ${className}` 
    : `relative overflow-hidden ${className}`;

  if (fill) {
    return (
      <div ref={imgRef} className={containerClassName} style={{ position: 'relative' }}>
        {(!shouldLoad || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            {shouldLoad ? <LoadingSpinner size="sm" /> : <div className="text-gray-400 text-sm">載入中...</div>}
          </div>
        )}
        {shouldLoad && (
          <Image
            src={finalSrc}
            alt={alt}
            fill
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
        )}
        {hasError && currentSrc === fallbackSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
            圖片載入失敗
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={containerClassName} style={{ width, height }}>
      {(!shouldLoad || isLoading) && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ width, height }}
        >
          {shouldLoad ? <LoadingSpinner size="sm" /> : <div className="text-gray-400 text-sm">載入中...</div>}
        </div>
      )}
      {shouldLoad && (
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
      )}
      {hasError && currentSrc === fallbackSrc && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm"
          style={{ width, height }}
        >
          圖片載入失敗
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
    <div className={`relative overflow-hidden ${className}`} style={{ position: 'relative' }}>
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