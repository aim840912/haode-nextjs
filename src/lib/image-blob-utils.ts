/**
 * 圖片 Blob URL 工具函數
 * 用於將 base64 圖片轉換為 Blob URL，提升渲染效能並減少記憶體使用
 */
import { dbLogger } from '@/lib/logger';

interface BlobCacheItem {
  blobUrl: string;
  timestamp: number;
  size: number;
}

// Blob URL 快取，避免重複轉換
const blobCache = new Map<string, BlobCacheItem>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 分鐘過期

/**
 * 將 base64 字串轉換為 Blob URL
 */
export function base64ToBlobUrl(base64Data: string): string | null {
  try {
    // 檢查是否為有效的 base64 格式
    if (!base64Data.startsWith('data:image/')) {
      dbLogger.warn('不是有效的 base64 圖片格式', {
        module: 'image-blob-utils',
        action: 'base64ToBlobUrl',
        metadata: { base64Prefix: base64Data.substring(0, 50) }
      });
      return null;
    }

    // 檢查快取
    const cacheKey = base64Data.substring(0, 100); // 使用前100字符作為快取鍵
    const cached = blobCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      dbLogger.info('使用快取的 Blob URL', {
        module: 'image-blob-utils',
        action: 'base64ToBlobUrl',
        metadata: {
          cacheKey: cacheKey.substring(0, 30),
          cacheAge: Math.round((Date.now() - cached.timestamp) / 1000) + 's'
        }
      });
      return cached.blobUrl;
    }

    // 解析 base64 資料
    const [header, data] = base64Data.split(',');
    if (!data) {
      dbLogger.error('base64 資料格式錯誤', new Error('Invalid base64 format'), {
        module: 'image-blob-utils',
        action: 'base64ToBlobUrl',
        metadata: { base64Prefix: base64Data.substring(0, 50) }
      });
      return null;
    }

    // 提取 MIME 類型
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

    dbLogger.info('轉換 base64 為 Blob URL', {
      module: 'image-blob-utils',
      action: 'base64ToBlobUrl',
      metadata: {
        mimeType,
        dataLength: data.length,
        estimatedSize: `${Math.round((data.length * 3) / 4 / 1024)}KB`
      }
    });

    // 將 base64 轉換為 Uint8Array
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 創建 Blob
    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // 加入快取
    blobCache.set(cacheKey, {
      blobUrl,
      timestamp: Date.now(),
      size: blob.size
    });

    dbLogger.info('成功轉換 base64 為 Blob URL', {
      module: 'image-blob-utils',
      action: 'base64ToBlobUrl',
      metadata: {
        blobUrl: blobUrl.substring(0, 50) + '...',
        blobSize: `${Math.round(blob.size / 1024)}KB`,
        cacheKey: cacheKey.substring(0, 30)
      }
    });

    return blobUrl;

  } catch (error) {
    dbLogger.error('base64 轉 Blob URL 失敗', error as Error, {
      module: 'image-blob-utils',
      action: 'base64ToBlobUrl',
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return null;
  }
}

/**
 * 清理過期的 Blob URL 快取
 */
export function cleanupBlobCache(): void {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, item] of blobCache.entries()) {
    if (now - item.timestamp > CACHE_EXPIRY) {
      URL.revokeObjectURL(item.blobUrl);
      blobCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    dbLogger.info('清理過期的 Blob URL', {
      module: 'image-blob-utils',
      action: 'cleanupBlobCache',
      metadata: { cleanedCount }
    });
  }
}

/**
 * 手動清理特定的 Blob URL
 */
export function revokeBlobUrl(blobUrl: string): void {
  try {
    URL.revokeObjectURL(blobUrl);
    
    // 從快取中移除
    for (const [key, item] of blobCache.entries()) {
      if (item.blobUrl === blobUrl) {
        blobCache.delete(key);
        break;
      }
    }
    
    dbLogger.info('已清理 Blob URL', {
      module: 'image-blob-utils',
      action: 'revokeBlobUrl',
      metadata: { blobUrl: blobUrl.substring(0, 50) + '...' }
    });
  } catch (error) {
    dbLogger.error('清理 Blob URL 失敗', error as Error, {
      module: 'image-blob-utils',
      action: 'revokeBlobUrl',
      metadata: {
        blobUrl: blobUrl.substring(0, 50) + '...',
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

/**
 * 取得快取統計資訊
 */
export function getBlobCacheStats(): { count: number; totalSize: number } {
  let totalSize = 0;
  for (const item of blobCache.values()) {
    totalSize += item.size;
  }
  
  return {
    count: blobCache.size,
    totalSize: Math.round(totalSize / 1024) // KB
  };
}

/**
 * 自動清理過期快取的定時器
 */
if (typeof window !== 'undefined') {
  // 每 5 分鐘清理一次過期快取
  setInterval(cleanupBlobCache, 5 * 60 * 1000);
}