#!/usr/bin/env tsx

/**
 * 清理 Moments Storage 中的 .blob 檔案
 * 這個腳本會掃描 moments storage bucket 中的所有檔案，
 * 找出副檔名為 .blob 的檔案並將其刪除
 */

import { getSupabaseAdmin } from '../src/lib/supabase-auth'
import { MOMENT_STORAGE_BUCKET } from '../src/lib/moments-storage'

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string | null
  metadata: Record<string, any>
}

async function cleanupBlobFiles() {
  const supabaseAdmin = getSupabaseAdmin()

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client 未配置')
    process.exit(1)
  }

  console.log('🔍 開始掃描 moments storage bucket 中的 .blob 檔案...')

  try {
    // 取得所有 moment 資料夾
    const { data: folders, error: foldersError } = await supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .list()

    if (foldersError) {
      console.error('❌ 無法列出 storage 資料夾:', foldersError.message)
      return
    }

    console.log(`📁 找到 ${folders?.length || 0} 個資料夾`)

    let totalBlobFiles = 0
    let totalDeletedFiles = 0
    const filesToDelete: { folder: string; file: string; fullPath: string }[] = []

    // 掃描每個資料夾中的檔案
    for (const folder of folders || []) {
      if (folder.name === '.emptyFolderPlaceholder') continue

      console.log(`🔍 掃描資料夾: ${folder.name}`)

      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from(MOMENT_STORAGE_BUCKET)
        .list(folder.name)

      if (filesError) {
        console.warn(`⚠️  無法列出資料夾 ${folder.name} 中的檔案:`, filesError.message)
        continue
      }

      // 找出 .blob 檔案
      const blobFiles = (files || []).filter((file: StorageFile) =>
        file.name.toLowerCase().endsWith('.blob')
      )

      if (blobFiles.length > 0) {
        console.log(`  📄 找到 ${blobFiles.length} 個 .blob 檔案`)
        totalBlobFiles += blobFiles.length

        blobFiles.forEach((file: StorageFile) => {
          const fullPath = `${folder.name}/${file.name}`
          filesToDelete.push({
            folder: folder.name,
            file: file.name,
            fullPath,
          })
          console.log(`    - ${file.name}`)
        })
      }
    }

    if (totalBlobFiles === 0) {
      console.log('✅ 沒有找到 .blob 檔案，storage 已清理完成')
      return
    }

    console.log(`\n📊 統計結果:`)
    console.log(`   總共找到 ${totalBlobFiles} 個 .blob 檔案`)

    // 確認是否要刪除
    console.log('\n⚠️  即將刪除以上檔案，請確認是否繼續？')
    console.log('   這個操作無法還原！')

    // 在腳本環境中直接執行刪除（生產環境中應該要有確認機制）
    console.log('\n🗑️  開始刪除 .blob 檔案...')

    // 批量刪除檔案
    const pathsToDelete = filesToDelete.map(item => item.fullPath)

    const { error: deleteError } = await supabaseAdmin.storage
      .from(MOMENT_STORAGE_BUCKET)
      .remove(pathsToDelete)

    if (deleteError) {
      console.error('❌ 批量刪除失敗:', deleteError.message)
      return
    }

    totalDeletedFiles = pathsToDelete.length
    console.log(`✅ 成功刪除 ${totalDeletedFiles} 個 .blob 檔案`)

    // 顯示詳細結果
    console.log('\n📋 刪除詳情:')
    filesToDelete.forEach(item => {
      console.log(`  ✓ ${item.fullPath}`)
    })

    console.log('\n🎉 .blob 檔案清理完成！')
    console.log('💡 提示: 新的上傳檔案現在會自動使用正確的副檔名')
  } catch (error) {
    console.error('❌ 清理過程發生錯誤:', error)
    process.exit(1)
  }
}

// 執行清理
if (require.main === module) {
  cleanupBlobFiles()
    .then(() => {
      console.log('\n✅ 腳本執行完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 腳本執行失敗:', error)
      process.exit(1)
    })
}

export { cleanupBlobFiles }
