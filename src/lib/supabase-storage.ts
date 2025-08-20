import { supabase, supabaseAdmin } from './supabase-auth';
import { validateImageFile, generateFileName } from './image-utils';

export class SupabaseStorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'SupabaseStorageError';
  }
}

export const STORAGE_BUCKET = 'products';

/**
 * 初始化 Storage Bucket（僅在服務端使用）
 */
export async function initializeStorageBucket() {
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置');
  }

  try {
    // 檢查 bucket 是否存在
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      throw new SupabaseStorageError('無法列出 storage buckets', listError);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // 建立 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

      if (error) {
        throw new SupabaseStorageError('建立 storage bucket 失敗', error);
      }

      console.log('Storage bucket 建立成功:', data);
    }

    return true;
  } catch (error) {
    console.error('初始化 storage bucket 失敗:', error);
    throw error;
  }
}

/**
 * 上傳圖片到 Supabase Storage
 */
export async function uploadImageToStorage(
  file: File,
  productId: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): Promise<{ url: string; path: string }> {
  try {
    // 驗證檔案
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new SupabaseStorageError(validation.error || '檔案驗證失敗');
    }

    // 生成檔案名稱
    const fileName = generateFileName(file.name, productId);
    const filePath = `${productId}/${size}-${fileName}`;

    // 上傳檔案
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new SupabaseStorageError('圖片上傳失敗', error);
    }

    // 取得公開 URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);


    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('上傳過程發生未知錯誤', error);
  }
}

/**
 * 批量上傳多個尺寸的圖片
 */
export async function uploadMultipleSizeImages(
  file: File,
  productId: string
): Promise<{
  thumbnail: { url: string; path: string };
  medium: { url: string; path: string };
  large: { url: string; path: string };
}> {
  try {
    // 這裡可以實作圖片自動調整大小邏輯
    // 目前先上傳相同檔案到不同路徑
    const [thumbnail, medium, large] = await Promise.all([
      uploadImageToStorage(file, productId, 'thumbnail'),
      uploadImageToStorage(file, productId, 'medium'),
      uploadImageToStorage(file, productId, 'large')
    ]);

    return { thumbnail, medium, large };
  } catch (error) {
    throw new SupabaseStorageError('批量上傳失敗', error);
  }
}

/**
 * 刪除圖片
 */
export async function deleteImageFromStorage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new SupabaseStorageError('刪除圖片失敗', error);
    }
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('刪除過程發生未知錯誤', error);
  }
}

/**
 * 刪除產品的所有圖片
 */
export async function deleteProductImages(productId: string): Promise<void> {
  try {
    console.log(`🗑️ 開始刪除產品 ${productId} 的圖片...`);
    
    // 列出產品資料夾下的所有檔案
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(productId);

    if (listError) {
      console.error(`❌ 列出產品 ${productId} 圖片失敗:`, listError);
      throw new SupabaseStorageError('列出產品圖片失敗', listError);
    }

    if (!files || files.length === 0) {
      console.log(`ℹ️ 產品 ${productId} 沒有圖片需要刪除`);
      return;
    }

    console.log(`📁 發現 ${files.length} 個檔案需要刪除:`, files.map(f => f.name));

    // 建立要刪除的檔案路徑列表
    const filePaths = files.map(file => `${productId}/${file.name}`);

    // 批量刪除所有圖片
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error(`❌ 批量刪除產品 ${productId} 圖片失敗:`, deleteError);
      throw new SupabaseStorageError('批量刪除產品圖片失敗', deleteError);
    }

    console.log(`✅ 成功刪除產品 ${productId} 的 ${filePaths.length} 張圖片`);
    
    // 嘗試刪除空資料夾（如果 Supabase 支持的話）
    try {
      const { error: folderError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([`${productId}/.keep`]); // 嘗試刪除可能的標記檔案
      
      if (!folderError) {
        console.log(`🗂️ 已清理產品 ${productId} 資料夾`);
      }
    } catch (folderCleanupError) {
      // 資料夾清理失敗不是致命錯誤
      console.log(`ℹ️ 資料夾清理略過 (這是正常的):`, folderCleanupError);
    }
    
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    console.error(`💥 刪除產品 ${productId} 圖片過程發生未知錯誤:`, error);
    throw new SupabaseStorageError('刪除產品圖片過程發生未知錯誤', error);
  }
}

/**
 * 列出產品的所有圖片
 */
export async function listProductImages(productId: string): Promise<Array<{
  name: string;
  url: string;
  metadata: any;
}>> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(productId);

    if (error) {
      throw new SupabaseStorageError('列出圖片失敗', error);
    }

    return (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`${productId}/${file.name}`);

      return {
        name: file.name,
        url: urlData.publicUrl,
        metadata: file.metadata
      };
    });
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('列出圖片過程發生未知錯誤', error);
  }
}

/**
 * 檢查圖片是否存在
 */
export async function checkImageExists(filePath: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(filePath.substring(0, filePath.lastIndexOf('/')));

    if (error) {
      return false;
    }

    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    return (data || []).some(file => file.name === fileName);
  } catch (error) {
    return false;
  }
}

/**
 * 取得圖片的公開 URL
 */
export function getImagePublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 生成圖片的簽名 URL（適用於私有圖片）
 */
export async function getImageSignedUrl(
  filePath: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new SupabaseStorageError('生成簽名 URL 失敗', error);
    }

    return data.signedUrl;
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('生成簽名 URL 過程發生未知錯誤', error);
  }
}