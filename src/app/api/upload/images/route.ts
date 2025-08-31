import { NextRequest, NextResponse } from 'next/server';
import { 
  uploadImageToStorage, 
  uploadMultipleSizeImages,
  SupabaseStorageError,
  initializeStorageBucket 
} from '@/lib/supabase-storage';
import { validateImageFile, compressImage } from '@/lib/image-utils';

// 初始化 storage bucket
let bucketInitialized = false;

async function ensureBucketExists() {
  if (!bucketInitialized) {
    try {
      await initializeStorageBucket();
      bucketInitialized = true;
    } catch (error) {
      console.error('無法初始化 storage bucket:', error);
      // 繼續執行，可能 bucket 已存在
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBucketExists();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const generateMultipleSizes = formData.get('generateMultipleSizes') === 'true';
    const compress = formData.get('compress') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的圖片檔案' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: '產品 ID 是必需的' },
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

    let processedFile = file;

    // 可選的圖片壓縮
    if (compress) {
      try {
        // 注意：server-side 壓縮需要不同的實作
        // 這裡我們先跳過壓縮，在客戶端處理
        console.log('伺服器端圖片壓縮暫未實作');
      } catch (error) {
        console.warn('圖片壓縮失敗，使用原檔案:', error);
      }
    }

    if (generateMultipleSizes) {
      // 上傳多個尺寸
      console.log(`📸 開始多尺寸上傳，產品ID: ${productId}, 檔案: ${file.name}`);
      const results = await uploadMultipleSizeImages(processedFile, productId);
      console.log('📸 多尺寸上傳完成:', results);
      
      return NextResponse.json({
        success: true,
        message: '圖片上傳成功',
        data: {
          multiple: true,
          urls: results
        }
      });
    } else {
      // 單一尺寸上傳
      const size = (formData.get('size') as 'thumbnail' | 'medium' | 'large') || 'medium';
      console.log(`📸 開始單一尺寸上傳，產品ID: ${productId}, 尺寸: ${size}, 檔案: ${file.name}`);
      const result = await uploadImageToStorage(processedFile, productId, size);
      console.log('📸 單一尺寸上傳完成:', result);
      
      return NextResponse.json({
        success: true,
        message: '圖片上傳成功',
        data: {
          multiple: false,
          url: result.url,
          path: result.path,
          size
        }
      });
    }

  } catch (error) {
    console.error('圖片上傳失敗:', error);

    if (error instanceof SupabaseStorageError) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '圖片上傳過程發生未知錯誤' },
      { status: 500 }
    );
  }
}

// 處理圖片刪除
export async function DELETE(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: '檔案路徑是必需的' },
        { status: 400 }
      );
    }

    const { deleteImageFromStorage } = await import('@/lib/supabase-storage');
    await deleteImageFromStorage(filePath);

    return NextResponse.json({
      success: true,
      message: '圖片刪除成功'
    });

  } catch (error) {
    console.error('圖片刪除失敗:', error);

    if (error instanceof SupabaseStorageError) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '圖片刪除過程發生未知錯誤' },
      { status: 500 }
    );
  }
}

// 列出產品圖片
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '產品 ID 是必需的' },
        { status: 400 }
      );
    }

    const { listProductImages } = await import('@/lib/supabase-storage');
    const images = await listProductImages(productId);

    return NextResponse.json({
      success: true,
      data: images
    });

  } catch (error) {
    console.error('列出圖片失敗:', error);

    if (error instanceof SupabaseStorageError) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '列出圖片過程發生未知錯誤' },
      { status: 500 }
    );
  }
}