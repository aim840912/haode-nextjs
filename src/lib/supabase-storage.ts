import { supabase, supabaseAdmin } from './supabase-auth';
import { validateImageFile, generateFileName } from './image-utils';
import { dbLogger } from '@/lib/logger';

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

    const bucketExists = buckets?.some((bucket: any) => bucket.name === STORAGE_BUCKET);

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

      dbLogger.info('Storage bucket 建立成功', { metadata: { bucketName: STORAGE_BUCKET } });
    }

    return true;
  } catch (error) {
    dbLogger.error('初始化 storage bucket 失敗', error as Error, { metadata: { bucketName: STORAGE_BUCKET } });
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
 * 產品圖片刪除結果介面
 */
export interface ProductImageDeletionResult {
  success: boolean;
  productId: string;
  deletedCount: number;
  deletedFiles: string[];
  folderCleanedUp: boolean;
  error?: string;
}

/**
 * 刪除產品的所有圖片
 */
export async function deleteProductImages(productId: string): Promise<ProductImageDeletionResult> {
  try {
    dbLogger.info('開始刪除產品圖片', { metadata: { productId } });
    
    const allDeletedFiles: string[] = [];
    let totalDeletedCount = 0;
    let folderCleanedUp = false;
    
    // 要檢查的可能資料夾路徑
    const possibleFolders = [
      productId, // UUID 資料夾
      `temp-${productId}`, // 如果 productId 本身是數字，嘗試 temp 前綴
    ];

    // 如果 productId 不是以 temp- 開頭，也檢查所有可能的 temp 資料夾
    if (!productId.startsWith('temp-')) {
      // 列出所有 temp- 開頭的資料夾，找可能關聯的
      try {
        const { data: allFolders } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list('');
        
        if (allFolders) {
          const tempFolders = allFolders
            .filter((folder: any) => folder.name.startsWith('temp-'))
            .map((folder: any) => folder.name);
          
          possibleFolders.push(...tempFolders);
        }
      } catch (listAllError) {
        dbLogger.warn('無法列出所有資料夾', { metadata: { productId, error: (listAllError as Error).message } });
      }
    }

    dbLogger.debug('檢查資料夾', { metadata: { productId, folders: possibleFolders } });

    // 檢查每個可能的資料夾
    for (const folder of possibleFolders) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(folder);

        if (listError || !files || files.length === 0) {
          continue; // 跳過此資料夾
        }

        dbLogger.debug('在資料夾發現檔案', { metadata: { folder, fileCount: files.length, productId, files: files.map((f: any) => f.name) } });

        // 建立要刪除的檔案路徑列表
        const filePaths = files.map((file: any) => `${folder}/${file.name}`);

        // 批量刪除所有圖片
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(filePaths);

        if (!deleteError) {
          allDeletedFiles.push(...files.map((f: any) => f.name));
          totalDeletedCount += filePaths.length;
          dbLogger.info('成功刪除資料夾圖片', { metadata: { folder, deletedCount: filePaths.length, productId } });
          folderCleanedUp = true;
        } else {
          dbLogger.error('批量刪除資料夾圖片失敗', deleteError, { metadata: { folder, productId } });
        }
      } catch (folderError) {
        dbLogger.warn('處理資料夾時發生錯誤', { metadata: { folder, productId, error: (folderError as Error).message } });
      }
    }

    if (totalDeletedCount === 0) {
      dbLogger.debug('產品沒有找到圖片', { metadata: { productId } });
      return {
        success: true,
        productId,
        deletedCount: 0,
        deletedFiles: [],
        folderCleanedUp: false
      };
    }

    dbLogger.info('總共成功刪除產品圖片', { metadata: { productId, totalDeletedCount } });

    return {
      success: true,
      productId,
      deletedCount: totalDeletedCount,
      deletedFiles: allDeletedFiles,
      folderCleanedUp
    };
    
  } catch (error) {
    const errorMessage = error instanceof SupabaseStorageError 
      ? error.message 
      : '刪除產品圖片過程發生未知錯誤';
    
    dbLogger.error('刪除產品圖片過程發生錯誤', error as Error, { metadata: { productId } });
    
    return {
      success: false,
      productId,
      deletedCount: 0,
      deletedFiles: [],
      folderCleanedUp: false,
      error: errorMessage
    };
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

    return (data || []).map((file: any) => {
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
    return (data || []).some((file: any) => file.name === fileName);
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

