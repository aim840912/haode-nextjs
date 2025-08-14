'use client';

import Image from 'next/image';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

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
  onLoad
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    }
    
    onError?.();
  };

  // 基本的模糊預設圖片 base64
  const defaultBlurDataURL = 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  const containerClassName = `relative overflow-hidden ${className}`;

  if (fill) {
    return (
      <div className={containerClassName}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <LoadingSpinner size="sm" />
          </div>
        )}
        <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes={sizes}
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
        {hasError && currentSrc === fallbackSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
            圖片載入失敗
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName} style={{ width, height }}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ width, height }}
        >
          <LoadingSpinner size="sm" />
        </div>
      )}
      <Image
        src={currentSrc}
        alt={alt}
        width={width || 400}
        height={height || 300}
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
      />
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

// 響應式圖片組件
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'aspect-video',
  className = '',
  ...props
}: OptimizedImageProps & {
  aspectRatio?: string;
}) {
  return (
    <div className={`${aspectRatio} ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
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