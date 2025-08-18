import { ProductImage } from '@/types/product';

export interface ImageSizeConfig {
  thumbnail: { width: 200; height: 200 }
  medium: { width: 600; height: 600 }
  large: { width: 1200; height: 1200 }
}

export const IMAGE_SIZES: ImageSizeConfig = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
};

export interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  progressive?: boolean
}

export const DEFAULT_IMAGE_OPTIONS: ImageOptimizationOptions = {
  quality: 80,
  format: 'webp',
  progressive: true
};

/**
 * 生成圖片URL，根據不同尺寸和來源
 */
export function generateImageUrl(
  productId: string, 
  filename: string, 
  size: keyof ImageSizeConfig = 'medium',
  source: 'local' | 'supabase' = 'local'
): string {
  if (source === 'supabase') {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${productId}/${size}-${filename}`;
  }
  
  // 本地圖片路徑
  const baseFileName = filename.replace(/\.[^/.]+$/, ''); // 移除副檔名
  const extension = filename.split('.').pop() || 'jpg';
  return `/images/products/${productId}-${size}.${extension}`;
}

/**
 * 生成產品所有尺寸的圖片URLs
 */
export function generateProductImageUrls(
  productId: string, 
  filename: string,
  source: 'local' | 'supabase' = 'local'
): Record<keyof ImageSizeConfig, string> {
  return {
    thumbnail: generateImageUrl(productId, filename, 'thumbnail', source),
    medium: generateImageUrl(productId, filename, 'medium', source),
    large: generateImageUrl(productId, filename, 'large', source)
  };
}

/**
 * 建立 ProductImage 物件
 */
export function createProductImage(
  productId: string,
  filename: string,
  alt: string,
  position: number = 0,
  size: keyof ImageSizeConfig = 'medium',
  source: 'local' | 'supabase' = 'local'
): ProductImage {
  const url = generateImageUrl(productId, filename, size, source);
  const sizeConfig = IMAGE_SIZES[size];
  
  return {
    id: `${productId}-${size}-${position}`,
    url,
    alt,
    position,
    size,
    width: sizeConfig.width,
    height: sizeConfig.height
  };
}

/**
 * 壓縮圖片檔案 (瀏覽器端使用)
 */
export async function compressImage(
  file: File, 
  options: { maxSizeMB?: number; maxWidthOrHeight?: number; quality?: number } = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.8
  } = options;

  // 動態導入 browser-image-compression
  const { default: imageCompression } = await import('browser-image-compression');
  
  const compressOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: quality
  };

  try {
    const compressedFile = await imageCompression(file, compressOptions);
    return compressedFile;
  } catch (error) {
    console.error('圖片壓縮失敗:', error);
    return file; // 壓縮失敗時返回原檔案
  }
}

/**
 * 驗證圖片檔案
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的檔案格式。請使用 JPEG、PNG、WebP 或 AVIF 格式。'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: '檔案大小不能超過 10MB。'
    };
  }

  return { valid: true };
}

/**
 * 產生檔案名稱
 */
export function generateFileName(originalName: string, productId: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${productId}_${baseName}_${timestamp}.${extension}`;
}

/**
 * 獲取圖片預覽URL
 */
export function getImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 建立不同尺寸的響應式圖片srcSet
 */
export function buildResponsiveImageSrcSet(baseUrl: string, productId: string): string {
  const sizes = ['thumbnail', 'medium', 'large'] as const;
  return sizes
    .map(size => {
      const width = IMAGE_SIZES[size].width;
      const url = baseUrl.replace('medium', size);
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * 獲取適當的圖片尺寸基於容器寬度
 */
export function getOptimalImageSize(containerWidth: number): keyof ImageSizeConfig {
  if (containerWidth <= 200) return 'thumbnail';
  if (containerWidth <= 600) return 'medium';
  return 'large';
}

/**
 * 圖片載入錯誤時的後備處理
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = '/images/placeholder.jpg'
): void {
  const img = event.currentTarget;
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl;
  }
}

/**
 * 預載入圖片
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 批量預載入圖片
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map(url => preloadImage(url)));
  } catch (error) {
    console.warn('部分圖片預載入失敗:', error);
  }
}