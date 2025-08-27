/**
 * 批次移動現有產品圖片從 temp 資料夾到正確的產品 UUID 資料夾
 * 
 * 使用方法：
 * npx tsx scripts/migrate-product-images.ts
 * 
 * 可選參數：
 * --dry-run: 只檢查不執行 (npx tsx scripts/migrate-product-images.ts --dry-run)
 * --product-id: 只處理特定產品 (npx tsx scripts/migrate-product-images.ts --product-id=PRODUCT_UUID)
 */

import { createClient } from '@supabase/supabase-js';

// 環境變數檢查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 請設定必要的環境變數:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageMoveResult {
  success: boolean;
  tempFolder: string;
  targetFolder: string;
  movedFiles: Array<{
    oldPath: string;
    newPath: string;
    newUrl: string;
  }>;
  failedFiles: Array<{
    oldPath: string;
    error: string;
  }>;
  error?: string;
}

async function moveImagesFromTempToProduct(
  tempProductId: string,
  actualProductId: string
): Promise<ImageMoveResult> {
  const result: ImageMoveResult = {
    success: false,
    tempFolder: tempProductId,
    targetFolder: actualProductId,
    movedFiles: [],
    failedFiles: []
  };

  try {
    console.log(`📦 開始移動圖片: ${tempProductId} → ${actualProductId}`);

    // 列出臨時資料夾下的所有檔案
    const { data: tempFiles, error: listError } = await supabase.storage
      .from('products')
      .list(tempProductId);

    if (listError) {
      result.error = `列出臨時資料夾檔案失敗: ${listError.message}`;
      return result;
    }

    if (!tempFiles || tempFiles.length === 0) {
      result.success = true;
      result.error = '臨時資料夾中沒有檔案';
      return result;
    }

    console.log(`🔍 找到 ${tempFiles.length} 個檔案需要移動`);

    // 移動每個檔案
    for (const file of tempFiles) {
      const oldPath = `${tempProductId}/${file.name}`;
      const newPath = `${actualProductId}/${file.name}`;
      
      try {
        // 複製檔案到新位置
        const { error: moveError } = await supabase.storage
          .from('products')
          .move(oldPath, newPath);

        if (moveError) {
          result.failedFiles.push({
            oldPath,
            error: moveError.message
          });
          console.warn(`⚠️ 移動檔案失敗: ${oldPath} → ${newPath}: ${moveError.message}`);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(newPath);
          
          result.movedFiles.push({
            oldPath,
            newPath,
            newUrl: publicUrlData.publicUrl
          });
          console.log(`✅ 成功移動: ${oldPath} → ${newPath}`);
        }
      } catch (fileError) {
        result.failedFiles.push({
          oldPath,
          error: fileError instanceof Error ? fileError.message : '未知錯誤'
        });
        console.warn(`⚠️ 移動檔案時發生例外: ${oldPath}:`, fileError);
      }
    }

    // 如果有成功移動的檔案，嘗試刪除空的臨時資料夾
    if (result.movedFiles.length > 0 && result.failedFiles.length === 0) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('products')
          .remove([tempProductId]);
        
        if (deleteError) {
          console.warn(`⚠️ 刪除臨時資料夾失敗: ${deleteError.message}`);
        } else {
          console.log(`🗑️ 已刪除空的臨時資料夾: ${tempProductId}`);
        }
      } catch (deleteError) {
        console.warn(`⚠️ 刪除臨時資料夾時發生例外:`, deleteError);
      }
    }

    result.success = result.movedFiles.length > 0;
    
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : '未知錯誤';
    console.error(`💥 移動圖片過程發生未知錯誤:`, error);
    return result;
  }
}

interface MigrationResult {
  totalProducts: number;
  processedProducts: number;
  successfulMigrations: number;
  failedMigrations: number;
  skippedProducts: number;
  results: Array<{
    productId: string;
    productName: string;
    tempFolder: string | null;
    status: 'success' | 'failed' | 'skipped' | 'no-temp-folder';
    message: string;
    movedFiles?: number;
  }>;
}

async function findTempFoldersForProduct(productId: string, productImageUrl: string | null): Promise<string | null> {
  try {
    // 如果產品的 image_url 包含 temp- 路徑，直接提取
    if (productImageUrl && productImageUrl.includes('temp-')) {
      const urlParts = productImageUrl.split('/');
      const tempFolder = urlParts.find(part => part.startsWith('temp-'));
      if (tempFolder) {
        console.log(`🔍 從 image_url 找到 temp 資料夾: ${tempFolder} (產品: ${productId})`);
        return tempFolder;
      }
    }

    // 列出所有 temp- 資料夾
    const { data: allFolders, error } = await supabase.storage
      .from('products')
      .list('');

    if (error || !allFolders) {
      console.warn(`⚠️ 無法列出儲存資料夾: ${error?.message}`);
      return null;
    }

    const tempFolders = allFolders
      .filter((folder: any) => folder.name.startsWith('temp-'))
      .map((folder: any) => folder.name);

    // 這裡我們無法直接關聯 temp 資料夾和產品
    // 所以返回 null，讓呼叫者知道需要手動處理
    return null;

  } catch (error) {
    console.warn(`⚠️ 查找 temp 資料夾時發生錯誤:`, error);
    return null;
  }
}

async function getAllTempFolders(): Promise<string[]> {
  try {
    const { data: allFolders, error } = await supabase.storage
      .from('products')
      .list('');

    if (error || !allFolders) {
      console.warn(`⚠️ 無法列出儲存資料夾: ${error?.message}`);
      return [];
    }

    return allFolders
      .filter((folder: any) => folder.name.startsWith('temp-'))
      .map((folder: any) => folder.name);
  } catch (error) {
    console.warn(`⚠️ 獲取 temp 資料夾列表時發生錯誤:`, error);
    return [];
  }
}

async function migrateProductImages(dryRun: boolean = false, specificProductId?: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalProducts: 0,
    processedProducts: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    skippedProducts: 0,
    results: []
  };

  console.log(`🚀 開始產品圖片遷移${dryRun ? ' (僅檢查模式)' : ''}...`);
  
  try {
    // 獲取所有產品
    let query = supabase
      .from('products')
      .select('id, name, image_url');

    if (specificProductId) {
      query = query.eq('id', specificProductId);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error('❌ 獲取產品資料失敗:', productsError);
      return result;
    }

    if (!products || products.length === 0) {
      console.log('ℹ️ 沒有找到產品資料');
      return result;
    }

    result.totalProducts = products.length;
    console.log(`📊 找到 ${products.length} 個產品`);

    // 獲取所有 temp 資料夾
    const allTempFolders = await getAllTempFolders();
    console.log(`📁 找到 ${allTempFolders.length} 個 temp 資料夾:`, allTempFolders);

    // 處理每個產品
    for (const product of products) {
      result.processedProducts++;
      console.log(`\n📦 處理產品 ${result.processedProducts}/${result.totalProducts}: ${product.name} (ID: ${product.id})`);

      // 檢查產品是否已經有正確位置的圖片
      const { data: existingFiles } = await supabase.storage
        .from('products')
        .list(product.id);

      if (existingFiles && existingFiles.length > 0) {
        console.log(`✅ 產品 ${product.name} 已有正確位置的圖片，跳過`);
        result.results.push({
          productId: product.id,
          productName: product.name,
          tempFolder: null,
          status: 'skipped',
          message: '產品已有正確位置的圖片'
        });
        result.skippedProducts++;
        continue;
      }

      // 查找對應的 temp 資料夾
      const tempFolder = await findTempFoldersForProduct(product.id, product.image_url);
      
      if (!tempFolder) {
        console.log(`ℹ️ 產品 ${product.name} 沒有找到對應的 temp 資料夾`);
        result.results.push({
          productId: product.id,
          productName: product.name,
          tempFolder: null,
          status: 'no-temp-folder',
          message: '沒有找到對應的 temp 資料夾'
        });
        continue;
      }

      if (dryRun) {
        console.log(`🔍 [DRY RUN] 將會移動: ${tempFolder} → ${product.id}`);
        result.results.push({
          productId: product.id,
          productName: product.name,
          tempFolder,
          status: 'success',
          message: '[DRY RUN] 準備移動'
        });
        result.successfulMigrations++;
      } else {
        // 執行實際移動
        try {
          const moveResult = await moveImagesFromTempToProduct(tempFolder, product.id);
          
          if (moveResult.success) {
            console.log(`✅ 成功移動產品 ${product.name} 的圖片`);
            result.results.push({
              productId: product.id,
              productName: product.name,
              tempFolder,
              status: 'success',
              message: `成功移動 ${moveResult.movedFiles.length} 個檔案`,
              movedFiles: moveResult.movedFiles.length
            });
            result.successfulMigrations++;
            
            // 更新資料庫中的圖片 URL
            if (moveResult.movedFiles.length > 0) {
              const { error: updateError } = await supabase
                .from('products')
                .update({ 
                  image_url: moveResult.movedFiles[0].newUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', product.id);

              if (updateError) {
                console.warn(`⚠️ 更新產品 ${product.name} 圖片 URL 失敗:`, updateError);
              }
            }
          } else {
            console.error(`❌ 移動產品 ${product.name} 圖片失敗: ${moveResult.error}`);
            result.results.push({
              productId: product.id,
              productName: product.name,
              tempFolder,
              status: 'failed',
              message: moveResult.error || '移動失敗'
            });
            result.failedMigrations++;
          }
        } catch (moveError) {
          console.error(`❌ 移動產品 ${product.name} 圖片時發生例外:`, moveError);
          result.results.push({
            productId: product.id,
            productName: product.name,
            tempFolder,
            status: 'failed',
            message: moveError instanceof Error ? moveError.message : '未知錯誤'
          });
          result.failedMigrations++;
        }
      }
    }

    return result;

  } catch (error) {
    console.error('💥 遷移過程發生嚴重錯誤:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const productIdArg = args.find(arg => arg.startsWith('--product-id='));
  const specificProductId = productIdArg ? productIdArg.split('=')[1] : undefined;

  console.log('🔧 產品圖片遷移工具');
  console.log('==================');
  
  if (dryRun) {
    console.log('⚠️ 執行模式: 僅檢查 (不會實際移動檔案)');
  }
  
  if (specificProductId) {
    console.log(`🎯 目標產品: ${specificProductId}`);
  }

  try {
    const result = await migrateProductImages(dryRun, specificProductId);
    
    console.log('\n📊 遷移結果統計:');
    console.log('================');
    console.log(`總產品數: ${result.totalProducts}`);
    console.log(`已處理: ${result.processedProducts}`);
    console.log(`成功遷移: ${result.successfulMigrations}`);
    console.log(`失敗: ${result.failedMigrations}`);
    console.log(`跳過: ${result.skippedProducts}`);

    if (result.results.length > 0) {
      console.log('\n📝 詳細結果:');
      result.results.forEach((item, index) => {
        const status = item.status === 'success' ? '✅' : 
                      item.status === 'failed' ? '❌' : 
                      item.status === 'skipped' ? '⏭️' : 'ℹ️';
        console.log(`${status} ${index + 1}. ${item.productName}`);
        console.log(`   產品 ID: ${item.productId}`);
        if (item.tempFolder) {
          console.log(`   Temp 資料夾: ${item.tempFolder}`);
        }
        console.log(`   狀態: ${item.message}`);
        if (item.movedFiles) {
          console.log(`   移動檔案數: ${item.movedFiles}`);
        }
        console.log('');
      });
    }

    if (!dryRun && result.successfulMigrations > 0) {
      console.log('🎉 遷移完成！建議檢查網站確認圖片顯示正常。');
    } else if (dryRun) {
      console.log('🔍 檢查完成！如要執行實際遷移，請移除 --dry-run 參數。');
    }

  } catch (error) {
    console.error('💥 腳本執行失敗:', error);
    process.exit(1);
  }
}

// 執行主函數
main().catch((error) => {
  console.error('💥 腳本執行時發生未預期錯誤:', error);
  process.exit(1);
});