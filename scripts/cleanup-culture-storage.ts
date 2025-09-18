#!/usr/bin/env tsx

/**
 * 清理 culture storage bucket
 */

import { createClient } from '@supabase/supabase-js'

async function cleanupCultureStorage() {
  console.log('🗑️ 清理 culture storage bucket...')

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
    // 1. 檢查 culture bucket 是否存在
    console.log('📋 檢查 culture bucket...')

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`無法列出 buckets: ${listError.message}`)
    }

    const cultureBucket = buckets?.find(bucket => bucket.name === 'culture')

    if (!cultureBucket) {
      console.log('✅ culture bucket 不存在，無需清理')
      return true
    }

    console.log('📦 發現 culture bucket，開始清理...')

    // 2. 列出所有檔案
    const { data: files, error: listFilesError } = await supabase.storage
      .from('culture')
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

    if (listFilesError) {
      console.warn('⚠️ 列出檔案時發生錯誤:', listFilesError.message)
    } else {
      console.log(`📁 找到 ${files?.length || 0} 個檔案`)

      // 3. 刪除所有檔案
      if (files && files.length > 0) {
        console.log('🗂️ 刪除檔案...')

        const filePaths = files.map(file => file.name)
        const { data: deletedFiles, error: deleteError } = await supabase.storage
          .from('culture')
          .remove(filePaths)

        if (deleteError) {
          console.warn('⚠️ 刪除檔案時發生錯誤:', deleteError.message)
        } else {
          console.log(`✅ 成功刪除 ${deletedFiles?.length || 0} 個檔案`)
        }
      }
    }

    // 4. 刪除 bucket
    console.log('🗑️ 刪除 culture bucket...')

    const { error: deleteBucketError } = await supabase.storage.deleteBucket('culture')

    if (deleteBucketError) {
      console.warn('⚠️ 刪除 bucket 時發生錯誤:', deleteBucketError.message)
      console.log('📝 可能需要在 Supabase 後台手動刪除 culture bucket')
    } else {
      console.log('✅ culture bucket 刪除成功')
    }

    // 5. 驗證刪除結果
    console.log('🔍 驗證清理結果...')

    const { data: remainingBuckets, error: verifyError } = await supabase.storage.listBuckets()

    if (verifyError) {
      console.warn('⚠️ 驗證時發生錯誤:', verifyError.message)
    } else {
      const cultureStillExists = remainingBuckets?.find(bucket => bucket.name === 'culture')

      if (cultureStillExists) {
        console.warn('⚠️ culture bucket 仍然存在')
      } else {
        console.log('✅ culture bucket 已完全清理')
      }

      console.log('📊 剩餘 buckets:', remainingBuckets?.map(b => b.name).join(', ') || '無')
    }

    console.log('\n🎉 culture storage 清理完成！')
    return true
  } catch (error) {
    console.error('❌ 清理 culture storage 失敗:', error)
    throw error
  }
}

// 執行腳本
if (require.main === module) {
  cleanupCultureStorage()
    .then(() => {
      console.log('✅ 清理完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 清理失敗:', error)
      process.exit(1)
    })
}

export { cleanupCultureStorage }
