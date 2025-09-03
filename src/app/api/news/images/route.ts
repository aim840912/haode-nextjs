import { NextRequest, NextResponse } from 'next/server';
import { 
  uploadNewsImage,
  uploadNewsImageServer,
  uploadNewsImageWithThumbnail,
  deleteNewsImage,
  listNewsImages,
  initializeNewsBucket
} from '@/lib/news-storage';
import { SupabaseStorageError } from '@/lib/supabase-storage';
import { validateImageFile } from '@/lib/image-utils';
import { apiLogger } from '@/lib/logger';

// 初始化 news bucket
let bucketInitialized = false;

async function ensureNewsBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeNewsBucket();
      bucketInitialized = true;
    } catch (error) {
      apiLogger.error('無法初始化新聞 storage bucket:', error);
      // 繼續執行，可能 bucket 已存在
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureNewsBucketExists();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const newsId = formData.get('newsId') as string;
    const generateThumbnail = formData.get('generateThumbnail') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的圖片檔案' },
        { status: 400 }
      );
    }

    // 驗證檔案
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (generateThumbnail) {
      // 上傳主圖片和縮圖
      apiLogger.info(`📸 開始新聞圖片多檔案上傳，新聞ID: ${newsId}, 檔案: ${file.name}`);
      const results = await uploadNewsImageWithThumbnail(file, newsId);
      apiLogger.info('📸 新聞圖片多檔案上傳完成:', results);
      
      return NextResponse.json({
        success: true,
        message: '新聞圖片上傳成功',
        data: {
          multiple: true,
          urls: results
        }
      });
    } else {
      // 單一檔案上傳（使用伺服器端函數繞過 RLS）
      apiLogger.info(`📸 開始新聞圖片上傳，新聞ID: ${newsId}, 檔案: ${file.name}`);
      const result = await uploadNewsImageServer(file, newsId);
      apiLogger.info('📸 新聞圖片上傳完成:', result);
      
      return NextResponse.json({
        success: true,
        message: '新聞圖片上傳成功',
        data: {
          multiple: false,
          url: result.url,
          path: result.path
        }
      });
    }

  } catch (error) {
    apiLogger.error('新聞圖片上傳失敗:', error);

    if (error instanceof SupabaseStorageError) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '新聞圖片上傳過程發生未知錯誤' },
      { status: 500 }
    );
  }
}

// 處理新聞圖片刪除
export async function DELETE(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: '檔案路徑是必需的' },
        { status: 400 }
      );
    }

    await deleteNewsImage(filePath);

    return NextResponse.json({
      success: true,
      message: '新聞圖片刪除成功'
    });

  } catch (error) {
    apiLogger.error('新聞圖片刪除失敗:', error);

    if (error instanceof SupabaseStorageError) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '新聞圖片刪除過程發生未知錯誤' },
      { status: 500 }
    );
  }
}

// 列出新聞圖片
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');

    if (!newsId) {
      return NextResponse.json(
        { error: '新聞 ID 是必需的' },
        { status: 400 }
      );
    }

    const images = await listNewsImages(newsId);

    return NextResponse.json({
      success: true,
      data: images
    });

  } catch (error) {
    apiLogger.error('列出新聞圖片失敗:', error);

    if (error instanceof SupabaseStorageError) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '列出新聞圖片過程發生未知錯誤' },
      { status: 500 }
    );
  }
}