import { useState, useEffect, useRef } from 'react';
import { base64ToBlobUrl, revokeBlobUrl } from '@/lib/image-blob-utils';

interface UseImageBlobOptions {
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

interface UseImageBlobReturn {
  processedSrc: string | null;
  isLoading: boolean;
  error: string | null;
  isBase64: boolean;
  blobUrl: string | null;
}

/**
 * 處理圖片載入的 Hook，自動將 base64 轉換為 Blob URL
 */
export function useImageBlob(
  src: string | undefined, 
  options: UseImageBlobOptions = {}
): UseImageBlobReturn {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  const { fallbackSrc, onLoad, onError } = options;
  const currentBlobRef = useRef<string | null>(null);
  
  // 使用 ref 儲存最新的回調函數，避免依賴項變化
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  
  // 更新回調函數 ref
  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  });

  // 檢查是否為 base64 圖片
  const isBase64 = src?.startsWith('data:image/') ?? false;

  useEffect(() => {
    if (!src) {
      setProcessedSrc(fallbackSrc || null);
      setIsLoading(false);
      setError(null);
      return;
    }


    setIsLoading(true);
    setError(null);

    if (isBase64) {
      // 處理 base64 圖片
      try {
        const convertedBlobUrl = base64ToBlobUrl(src);
        
        if (convertedBlobUrl) {
          // 清理舊的 Blob URL
          if (currentBlobRef.current) {
            revokeBlobUrl(currentBlobRef.current);
          }
          
          currentBlobRef.current = convertedBlobUrl;
          setBlobUrl(convertedBlobUrl);
          setProcessedSrc(convertedBlobUrl);
          setIsLoading(false);
          onLoadRef.current?.();
          
        } else {
          throw new Error('base64 轉換失敗');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'base64 處理失敗';
        console.error('❌ base64 處理錯誤:', errorMsg);
        setError(errorMsg);
        setProcessedSrc(fallbackSrc || null);
        setIsLoading(false);
        onErrorRef.current?.(errorMsg);
      }
    } else {
      // 處理普通 URL
      setProcessedSrc(src);
      setIsLoading(false);
      onLoadRef.current?.();
    }

    // 清理函數
    return () => {
      if (currentBlobRef.current) {
        revokeBlobUrl(currentBlobRef.current);
        currentBlobRef.current = null;
      }
    };
  }, [src, fallbackSrc, isBase64]); // 移除會變化的回調函數

  return {
    processedSrc,
    isLoading,
    error,
    isBase64,
    blobUrl
  };
}