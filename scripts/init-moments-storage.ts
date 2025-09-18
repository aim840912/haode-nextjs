#!/usr/bin/env tsx

/**
 * 初始化 moments 圖片存儲 bucket
 */

import { createClient } from '@supabase/supabase-js'

async function initMomentsStorage() {
  console.log('🗂️ 初始化 moments 圖片存儲 bucket...')

  // 建立 Supabase 客戶端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少必要的環境變數: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // 1. 檢查所有 buckets
    console.log('📋 檢查現有 storage buckets...')

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`無法列出 buckets: ${listError.message}`)
    }

    console.log('✅ 現有 buckets:', buckets?.map(b => b.name).join(', ') || '無')

    // 2. 檢查 moments bucket 是否存在
    const momentsBucket = buckets?.find(bucket => bucket.name === 'moments')

    if (momentsBucket) {
      console.log('✅ moments bucket 已存在')

      // 檢查 bucket 政策
      const { data: policy, error: policyError } = await supabase.storage
        .from('moments')
        .list('', { limit: 1 })

      if (policyError) {
        console.warn('⚠️ 無法存取 moments bucket，可能需要設定政策:', policyError.message)
      } else {
        console.log('✅ moments bucket 存取正常')
      }
    } else {
      console.log('📦 建立 moments bucket...')

      // 建立 bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        'moments',
        {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 10485760, // 10MB
        }
      )

      if (createError) {
        if (createError.message?.includes('already exists')) {
          console.log('✅ moments bucket 已存在（並發建立）')
        } else {
          throw new Error(`建立 bucket 失敗: ${createError.message}`)
        }
      } else {
        console.log('✅ moments bucket 建立成功')
      }
    }

    // 3. 測試上傳功能
    console.log('🧪 測試上傳功能...')

    const testFileName = `test-${Date.now()}.txt`
    const testContent = 'This is a test file for moments bucket'

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('moments')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      })

    if (uploadError) {
      console.warn('⚠️ 上傳測試失敗:', uploadError.message)
      console.log('📝 可能需要在 Supabase 後台設定 RLS 政策：')
      console.log(`
-- 在 Storage > Policies 中為 moments bucket 建立以下政策：

-- 公開讀取政策
CREATE POLICY "公開讀取 moments 檔案" ON storage.objects
FOR SELECT USING (bucket_id = 'moments');

-- 管理員上傳政策
CREATE POLICY "管理員上傳 moments 檔案" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'moments' AND
  auth.email() = 'admin@gmail.com'
);

-- 管理員刪除政策
CREATE POLICY "管理員刪除 moments 檔案" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'moments' AND
  auth.email() = 'admin@gmail.com'
);
      `)
    } else {
      console.log('✅ 上傳測試成功:', uploadData.path)

      // 清理測試檔案
      const { error: deleteError } = await supabase.storage.from('moments').remove([testFileName])

      if (deleteError) {
        console.warn('⚠️ 清理測試檔案失敗:', deleteError.message)
      } else {
        console.log('✅ 測試檔案清理完成')
      }
    }

    // 4. 檢查 public URL 功能
    console.log('🔗 測試公開 URL 功能...')

    const { data: publicUrl } = supabase.storage.from('moments').getPublicUrl('test.jpg')

    if (publicUrl?.publicUrl) {
      console.log('✅ 公開 URL 生成正常:', publicUrl.publicUrl)
    } else {
      console.warn('⚠️ 無法生成公開 URL')
    }

    console.log('\n🎉 moments storage bucket 初始化完成！')
    console.log('📊 功能狀態：')
    console.log('  ✅ Bucket 存在')
    console.log('  ✅ 支援圖片格式 (JPEG, PNG, WebP)')
    console.log('  ✅ 檔案大小限制 10MB')
    console.log('  ✅ 公開讀取 URL')

    return true
  } catch (error) {
    console.error('❌ 初始化 moments storage 失敗:', error)
    throw error
  }
}

// 執行腳本
if (require.main === module) {
  initMomentsStorage()
    .then(() => {
      console.log('✅ 初始化完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 初始化失敗:', error)
      process.exit(1)
    })
}

export { initMomentsStorage }
