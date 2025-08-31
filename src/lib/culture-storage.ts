import { supabase, supabaseAdmin } from './supabase-auth';
import { validateImageFile, generateFileName } from './image-utils';
import { dbLogger } from './logger';

export class CultureStorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'CultureStorageError';
  }
}

export const CULTURE_STORAGE_BUCKET = 'culture';

/**
 * 初始化 Culture Storage Bucket
 */
export async function initializeCultureStorageBucket() {
  if (!supabaseAdmin) {
    throw new CultureStorageError('Supabase admin client 未配置');
  }

  try {
    // 檢查 bucket 是否存在
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      throw new CultureStorageError('無法列出 storage buckets', listError);
    }

    const bucketExists = buckets?.some((bucket: any) => bucket.name === CULTURE_STORAGE_BUCKET);

    if (!bucketExists) {
      // 建立 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(CULTURE_STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

      if (error) {
        throw new CultureStorageError('建立 culture storage bucket 失敗', error);
      }

      dbLogger.info('Culture Storage bucket 建立成功:', data);
    }

    return true;
  } catch (error) {
    dbLogger.error('初始化 culture storage bucket 失敗', error instanceof Error ? error : new Error('Unknown error'), {
      metadata: { context: 'initializeCultureStorageBucket' }
    });
    throw error;
  }
}

/**
 * 上傳時光典藏圖片到 Supabase Storage
 */
export async function uploadCultureImageToStorage(
  file: File,
  cultureId: string
): Promise<{ url: string; path: string }> {
  try {
    // 檢查 admin client 是否配置
    if (!supabaseAdmin) {
      throw new CultureStorageError('Supabase admin client 未配置');
    }

    // 驗證檔案
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new CultureStorageError(validation.error || '檔案驗證失敗');
    }

    // 生成檔案名稱
    const fileName = generateFileName(file.name, cultureId);
    const filePath = `${cultureId}/${fileName}`;

    // 使用 admin 客戶端上傳檔案（繞過 RLS）
    const { data, error } = await supabaseAdmin.storage
      .from(CULTURE_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new CultureStorageError('時光典藏圖片上傳失敗', error);
    }

    // 取得公開 URL（也使用 admin 客戶端）
    const { data: urlData } = supabaseAdmin.storage
      .from(CULTURE_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    dbLogger.info('✅ 時光典藏圖片上傳成功', {
      metadata: {
        filePath,
        url: urlData.publicUrl
      }
    });

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    if (error instanceof CultureStorageError) {
      throw error;
    }
    throw new CultureStorageError('上傳過程發生未知錯誤', error);
  }
}

/**
 * 刪除時光典藏圖片
 */
export async function deleteCultureImageFromStorage(filePath: string): Promise<void> {
  try {
    if (!supabaseAdmin) {
      throw new CultureStorageError('Supabase admin client 未配置');
    }

    const { error } = await supabaseAdmin.storage
      .from(CULTURE_STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new CultureStorageError('刪除時光典藏圖片失敗', error);
    }

    dbLogger.info('✅ 時光典藏圖片刪除成功', {
      metadata: { filePath }
    });
  } catch (error) {
    if (error instanceof CultureStorageError) {
      throw error;
    }
    throw new CultureStorageError('刪除過程發生未知錯誤', error);
  }
}

/**
 * 刪除時光典藏項目的所有圖片
 */
export async function deleteCultureImages(cultureId: string): Promise<{
  success: boolean;
  deletedCount: number;
  deletedFiles: string[];
  error?: string;
}> {
  try {
    dbLogger.info(`🗑️ 開始刪除時光典藏 ${cultureId} 的圖片...`);
    
    // 列出該項目的所有圖片
    const { data: files, error: listError } = await supabaseAdmin!.storage
      .from(CULTURE_STORAGE_BUCKET)
      .list(cultureId);

    if (listError || !files || files.length === 0) {
      dbLogger.info(`ℹ️ 時光典藏 ${cultureId} 沒有找到圖片需要刪除`);
      return {
        success: true,
        deletedCount: 0,
        deletedFiles: []
      };
    }

    dbLogger.info(`📁 在資料夾 ${cultureId} 發現 ${files.length} 個檔案:`, 
      files.map((f: any) => f.name));

    // 建立要刪除的檔案路徑列表
    const filePaths = files.map((file: any) => `${cultureId}/${file.name}`);

    // 批量刪除所有圖片
    const { error: deleteError } = await supabaseAdmin!.storage
      .from(CULTURE_STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      throw new CultureStorageError('批量刪除時光典藏圖片失敗', deleteError);
    }

    dbLogger.info(`✅ 成功刪除時光典藏 ${cultureId} 的 ${filePaths.length} 張圖片`);

    return {
      success: true,
      deletedCount: filePaths.length,
      deletedFiles: files.map((f: any) => f.name)
    };
    
  } catch (error) {
    const errorMessage = error instanceof CultureStorageError 
      ? error.message 
      : '刪除時光典藏圖片過程發生未知錯誤';
    
    dbLogger.error(`💥 刪除時光典藏 ${cultureId} 圖片過程發生錯誤`, error instanceof Error ? error : new Error('Unknown error'), {
      metadata: { context: 'deleteAllCultureImages', cultureId }
    });
    
    return {
      success: false,
      deletedCount: 0,
      deletedFiles: [],
      error: errorMessage
    };
  }
}

/**
 * 列出時光典藏項目的所有圖片
 */
export async function listCultureImages(cultureId: string): Promise<Array<{
  name: string;
  url: string;
  metadata: any;
}>> {
  try {
    const { data, error } = await supabaseAdmin!.storage
      .from(CULTURE_STORAGE_BUCKET)
      .list(cultureId);

    if (error) {
      throw new CultureStorageError('列出時光典藏圖片失敗', error);
    }

    return (data || []).map((file: any) => {
      const { data: urlData } = supabaseAdmin!.storage
        .from(CULTURE_STORAGE_BUCKET)
        .getPublicUrl(`${cultureId}/${file.name}`);

      return {
        name: file.name,
        url: urlData.publicUrl,
        metadata: file.metadata
      };
    });
  } catch (error) {
    if (error instanceof CultureStorageError) {
      throw error;
    }
    throw new CultureStorageError('列出圖片過程發生未知錯誤', error);
  }
}

/**
 * 檢查時光典藏圖片是否存在
 */
export async function checkCultureImageExists(filePath: string): Promise<boolean> {
  try {
    const pathParts = filePath.split('/');
    if (pathParts.length < 2) return false;
    
    const cultureId = pathParts[0];
    const fileName = pathParts[1];

    const { data, error } = await supabaseAdmin!.storage
      .from(CULTURE_STORAGE_BUCKET)
      .list(cultureId);

    if (error) {
      return false;
    }

    return (data || []).some((file: any) => file.name === fileName);
  } catch (error) {
    return false;
  }
}

/**
 * 取得時光典藏圖片的公開 URL
 */
export function getCultureImagePublicUrl(filePath: string): string {
  const { data } = supabaseAdmin!.storage
    .from(CULTURE_STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 生成時光典藏圖片的簽名 URL（適用於私有圖片）
 */
export async function getCultureImageSignedUrl(
  filePath: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin!.storage
      .from(CULTURE_STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new CultureStorageError('生成時光典藏圖片簽名 URL 失敗', error);
    }

    return data.signedUrl;
  } catch (error) {
    if (error instanceof CultureStorageError) {
      throw error;
    }
    throw new CultureStorageError('生成簽名 URL 過程發生未知錯誤', error);
  }
}

/**
 * 從 base64 資料上傳圖片（用於資料遷移）
 */
export async function uploadBase64ToCultureStorage(
  base64Data: string,
  cultureId: string,
  filename: string = 'culture-image.jpg'
): Promise<{ url: string; path: string }> {
  try {
    // 將 base64 轉換為 File 物件
    const response = await fetch(base64Data);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });

    // 使用現有的上傳函數
    return await uploadCultureImageToStorage(file, cultureId);
  } catch (error) {
    throw new CultureStorageError('從 base64 上傳時光典藏圖片失敗', error);
  }
}