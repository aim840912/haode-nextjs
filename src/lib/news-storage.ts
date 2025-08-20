import { supabase, supabaseAdmin } from './supabase-auth';
import { validateImageFile, generateFileName } from './image-utils';
import { SupabaseStorageError } from './supabase-storage';

export const NEWS_STORAGE_BUCKET = 'news';

/**
 * 初始化新聞 Storage Bucket
 */
export async function initializeNewsBucket() {
  if (!supabaseAdmin) {
    throw new SupabaseStorageError('Supabase admin client 未配置');
  }

  try {
    // 檢查 bucket 是否存在
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      throw new SupabaseStorageError('無法列出 storage buckets', listError);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === NEWS_STORAGE_BUCKET);

    if (!bucketExists) {
      // 建立新聞專用 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(NEWS_STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 10 * 1024 * 1024 // 10MB
      });

      if (error) {
        throw new SupabaseStorageError('建立新聞 storage bucket 失敗', error);
      }

      console.log('新聞 Storage bucket 建立成功:', data);
    }

    return true;
  } catch (error) {
    console.error('初始化新聞 storage bucket 失敗:', error);
    throw error;
  }
}

/**
 * 上傳新聞圖片到 Supabase Storage
 */
export async function uploadNewsImage(
  file: File,
  newsId?: string
): Promise<{ url: string; path: string }> {
  try {
    // 驗證檔案
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new SupabaseStorageError(validation.error || '檔案驗證失敗');
    }

    // 生成新聞 ID（如果沒有提供的話）
    const id = newsId || `news_${Date.now()}`;

    // 生成檔案名稱
    const fileName = generateNewsFileName(file.name, id);
    const filePath = `${id}/${fileName}`;

    // 上傳檔案
    const { data, error } = await supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new SupabaseStorageError('新聞圖片上傳失敗', error);
    }

    // 取得公開 URL
    const { data: urlData } = supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('新聞圖片上傳過程發生未知錯誤', error);
  }
}

/**
 * 上傳新聞圖片（含縮圖）
 */
export async function uploadNewsImageWithThumbnail(
  file: File,
  newsId?: string
): Promise<{
  main: { url: string; path: string };
  thumbnail: { url: string; path: string };
}> {
  try {
    const id = newsId || `news_${Date.now()}`;
    
    // 主圖片
    const mainFileName = generateNewsFileName(file.name, id, 'main');
    const mainFilePath = `${id}/${mainFileName}`;
    
    // 縮圖（目前使用相同檔案，未來可實作圖片調整大小）
    const thumbnailFileName = generateNewsFileName(file.name, id, 'thumbnail');
    const thumbnailFilePath = `${id}/${thumbnailFileName}`;

    // 並行上傳主圖和縮圖
    const [mainResult, thumbnailResult] = await Promise.all([
      // 主圖片上傳
      supabase.storage
        .from(NEWS_STORAGE_BUCKET)
        .upload(mainFilePath, file, {
          cacheControl: '3600',
          upsert: true
        }),
      // 縮圖上傳（目前使用相同檔案）
      supabase.storage
        .from(NEWS_STORAGE_BUCKET)
        .upload(thumbnailFilePath, file, {
          cacheControl: '3600',
          upsert: true
        })
    ]);

    if (mainResult.error) {
      throw new SupabaseStorageError('主圖片上傳失敗', mainResult.error);
    }
    if (thumbnailResult.error) {
      throw new SupabaseStorageError('縮圖上傳失敗', thumbnailResult.error);
    }

    // 取得公開 URLs
    const { data: mainUrlData } = supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .getPublicUrl(mainFilePath);

    const { data: thumbnailUrlData } = supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .getPublicUrl(thumbnailFilePath);

    return {
      main: {
        url: mainUrlData.publicUrl,
        path: mainFilePath
      },
      thumbnail: {
        url: thumbnailUrlData.publicUrl,
        path: thumbnailFilePath
      }
    };
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('新聞圖片批量上傳過程發生未知錯誤', error);
  }
}

/**
 * 刪除新聞圖片
 */
export async function deleteNewsImage(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new SupabaseStorageError('刪除新聞圖片失敗', error);
    }
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError('刪除新聞圖片過程發生未知錯誤', error);
  }
}

/**
 * 刪除新聞的所有圖片
 */
export async function deleteAllNewsImages(newsId: string): Promise<void> {
  try {
    console.log(`🗑️ 開始刪除新聞 ${newsId} 的圖片...`);
    
    // 列出新聞資料夾下的所有檔案
    const { data: files, error: listError } = await supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .list(newsId);

    if (listError) {
      console.error(`❌ 列出新聞 ${newsId} 圖片失敗:`, listError);
      throw new SupabaseStorageError('列出新聞圖片失敗', listError);
    }

    if (!files || files.length === 0) {
      console.log(`ℹ️ 新聞 ${newsId} 沒有圖片需要刪除`);
      return;
    }

    console.log(`📁 發現 ${files.length} 個檔案需要刪除:`, files.map(f => f.name));

    // 建立要刪除的檔案路徑列表
    const filePaths = files.map(file => `${newsId}/${file.name}`);

    // 批量刪除所有圖片
    const { error: deleteError } = await supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error(`❌ 批量刪除新聞 ${newsId} 圖片失敗:`, deleteError);
      throw new SupabaseStorageError('批量刪除新聞圖片失敗', deleteError);
    }

    console.log(`✅ 成功刪除新聞 ${newsId} 的 ${filePaths.length} 張圖片`);
    
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    console.error(`💥 刪除新聞 ${newsId} 圖片過程發生未知錯誤:`, error);
    throw new SupabaseStorageError('刪除新聞圖片過程發生未知錯誤', error);
  }
}

/**
 * 列出新聞的所有圖片
 */
export async function listNewsImages(newsId: string): Promise<Array<{
  name: string;
  url: string;
  metadata: any;
}>> {
  try {
    const { data, error } = await supabase.storage
      .from(NEWS_STORAGE_BUCKET)
      .list(newsId);

    if (error) {
      throw new SupabaseStorageError('列出新聞圖片失敗', error);
    }

    return (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from(NEWS_STORAGE_BUCKET)
        .getPublicUrl(`${newsId}/${file.name}`);

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
    throw new SupabaseStorageError('列出新聞圖片過程發生未知錯誤', error);
  }
}

/**
 * 生成新聞圖片檔案名稱
 */
function generateNewsFileName(
  originalName: string, 
  newsId: string, 
  type: 'main' | 'thumbnail' = 'main'
): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${type}-${baseName}_${timestamp}.${extension}`;
}

/**
 * 取得新聞圖片的公開 URL
 */
export function getNewsImagePublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(NEWS_STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * 檢查新聞圖片是否存在
 */
export async function checkNewsImageExists(filePath: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(NEWS_STORAGE_BUCKET)
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