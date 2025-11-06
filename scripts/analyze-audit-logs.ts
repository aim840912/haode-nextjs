import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeAuditLogs() {
  try {
    console.log('🔍 分析審計日誌記錄...\n')

    // 1. 取得所有審計日誌的動作統計
    const { data: allLogs } = await supabase
      .from('audit_logs')
      .select('action, resource_type, created_at, user_email')

    if (!allLogs || allLogs.length === 0) {
      console.log('❌ 沒有找到審計日誌記錄')
      return
    }

    // 2. 統計各種動作的數量
    const actionStats: Record<string, number> = {}
    allLogs.forEach(log => {
      const key = `${log.action}_${log.resource_type}`
      actionStats[key] = (actionStats[key] || 0) + 1
    })

    console.log('📊 審計日誌動作統計:')
    console.log('總記錄數:', allLogs.length)
    console.log('\n動作分布:')

    // 排序並顯示
    Object.entries(actionStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([key, count]) => {
        const parts = key.split('_')
        const action = parts[0]
        const resource = parts.slice(1).join('_')
        const percentage = ((count / allLogs.length) * 100).toFixed(1)
        console.log(`  ${action} ${resource}: ${count} 次 (${percentage}%)`)
      })

    // 3. 特別檢查 view_list 的記錄
    const viewListLogs = allLogs.filter(log => log.action === 'view_list')
    console.log('\n📋 「瀏覽列表」記錄分析:')
    console.log('  總數:', viewListLogs.length)

    // 按資源類型分組
    const viewListByResource: Record<string, number> = {}
    viewListLogs.forEach(log => {
      viewListByResource[log.resource_type] = (viewListByResource[log.resource_type] || 0) + 1
    })

    console.log('  按資源類型:')
    Object.entries(viewListByResource).forEach(([resource, count]) => {
      console.log(`    ${resource}: ${count} 次`)
    })

    // 4. 查看最近的 view_list 記錄
    const { data: recentViewLists } = await supabase
      .from('audit_logs')
      .select('user_email, resource_type, created_at')
      .eq('action', 'view_list')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentViewLists && recentViewLists.length > 0) {
      console.log('\n📅 最近的「瀏覽列表」記錄:')
      recentViewLists.forEach(log => {
        const date = new Date(log.created_at).toLocaleString('zh-TW')
        console.log(`  ${date} - ${log.user_email} 瀏覽 ${log.resource_type} 列表`)
      })
    }

    // 5. 分析是否有過多的瀏覽記錄
    const viewPercentage = ((viewListLogs.length / allLogs.length) * 100).toFixed(1)
    console.log('\n💡 分析結論:')
    console.log(`  瀏覽列表占總記錄的 ${viewPercentage}%`)

    if (parseFloat(viewPercentage) > 30) {
      console.log('  ⚠️ 瀏覽列表記錄比例偏高，建議考慮是否需要記錄所有列表瀏覽')
      console.log('  建議：')
      console.log('    1. 只記錄管理員的列表瀏覽')
      console.log('    2. 或設定時間間隔，避免短時間內重複記錄')
      console.log('    3. 或完全移除列表瀏覽記錄，只保留重要操作')
    } else if (parseFloat(viewPercentage) < 10) {
      console.log('  ✅ 瀏覽列表記錄比例合理')
    } else {
      console.log('  📊 瀏覽列表記錄比例適中')
    }

    // 6. 檢查重要操作的記錄
    const importantActions = ['create', 'update', 'delete', 'login', 'logout']
    console.log('\n🔐 重要操作統計:')
    importantActions.forEach(action => {
      const count = allLogs.filter(log => log.action === action).length
      const percentage = ((count / allLogs.length) * 100).toFixed(1)
      console.log(`  ${action}: ${count} 次 (${percentage}%)`)
    })
  } catch (err) {
    console.error('❌ 分析錯誤:', err)
  }
}

analyzeAuditLogs()
