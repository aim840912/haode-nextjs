import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalAuditVerification() {
  try {
    console.log('✅ 最終驗證審計日誌優化效果...\n')

    // 檢查最近 30 分鐘內的審計日誌
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: recentLogs } = await supabase
      .from('audit_logs')
      .select('action, resource_type, created_at, user_email')
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })

    console.log(`📊 最近 30 分鐘內的審計日誌（${thirtyMinutesAgo} 之後）:`)

    if (!recentLogs || recentLogs.length === 0) {
      console.log('   🎉 沒有新的審計日誌記錄')
      console.log('   這表明優化完全生效，不再記錄不必要的列表瀏覽\n')
    } else {
      console.log(`   總記錄數: ${recentLogs.length}`)

      // 統計各種操作
      const actionCounts: Record<string, number> = {}
      recentLogs.forEach(log => {
        const key = `${log.action}_${log.resource_type}`
        actionCounts[key] = (actionCounts[key] || 0) + 1
      })

      // 檢查是否有 view_list 記錄
      const viewListRecords = recentLogs.filter(log => log.action === 'view_list')

      if (viewListRecords.length === 0) {
        console.log('   ✅ 沒有新的 view_list 記錄！優化成功！')
      } else {
        console.log(`   ⚠️ 仍有 ${viewListRecords.length} 個 view_list 記錄`)
        viewListRecords.forEach(log => {
          const time = new Date(log.created_at).toLocaleString('zh-TW')
          console.log(`     ${time} - ${log.user_email} 瀏覽 ${log.resource_type}`)
        })
      }

      console.log('\n   📋 操作分布:')
      Object.entries(actionCounts).forEach(([key, count]) => {
        const [action, resource] = key.split('_')
        console.log(`     ${action} ${resource}: ${count} 次`)
      })
    }

    // 計算優化前後的比較
    const { data: allLogs } = await supabase.from('audit_logs').select('action, created_at')

    if (allLogs && allLogs.length > 0) {
      const totalViewList = allLogs.filter(log => log.action === 'view_list').length
      const recentViewList = recentLogs?.filter(log => log.action === 'view_list').length || 0

      console.log('\n📈 優化效果總結:')
      console.log(`   歷史 view_list 記錄總數: ${totalViewList}`)
      console.log(`   最近 30 分鐘新增: ${recentViewList}`)

      if (recentViewList === 0) {
        console.log('   🎉 優化完全成功！不再產生不必要的列表瀏覽記錄')
        console.log('   💡 建議：可以考慮清理歷史的 view_list 記錄以進一步優化資料庫')
      } else {
        console.log('   ⚠️ 仍有新的記錄產生，需要進一步檢查')
      }
    }
  } catch (err) {
    console.error('❌ 驗證錯誤:', err)
  }
}

finalAuditVerification()
