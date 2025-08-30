import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAuditLogs() {
  try {
    console.log('🧹 開始清理歷史審計日誌記錄...\n');
    
    // 1. 先統計要刪除的記錄
    const { data: viewListLogs, error: countError } = await supabase
      .from('audit_logs')
      .select('id, created_at, user_email, resource_type')
      .eq('action', 'view_list');
    
    if (countError) {
      console.error('❌ 統計記錄失敗:', countError);
      return;
    }
    
    if (!viewListLogs || viewListLogs.length === 0) {
      console.log('✅ 沒有需要清理的 view_list 記錄');
      return;
    }
    
    console.log(`📊 找到 ${viewListLogs.length} 個 view_list 記錄需要清理:`);
    
    // 按資源類型分組統計
    const byResourceType: Record<string, number> = {};
    viewListLogs.forEach(log => {
      byResourceType[log.resource_type] = (byResourceType[log.resource_type] || 0) + 1;
    });
    
    console.log('   按資源類型分布:');
    Object.entries(byResourceType).forEach(([resourceType, count]) => {
      console.log(`     ${resourceType}: ${count} 個`);
    });
    
    // 顯示最早和最新的記錄時間
    const dates = viewListLogs.map(log => new Date(log.created_at)).sort((a, b) => a.getTime() - b.getTime());
    console.log(`   時間範圍: ${dates[0].toLocaleString('zh-TW')} ~ ${dates[dates.length - 1].toLocaleString('zh-TW')}\n`);
    
    // 2. 執行刪除
    console.log('🗑️ 正在刪除 view_list 記錄...');
    
    const { error: deleteError, count } = await supabase
      .from('audit_logs')
      .delete()
      .eq('action', 'view_list');
    
    if (deleteError) {
      console.error('❌ 刪除失敗:', deleteError);
      return;
    }
    
    console.log(`✅ 成功刪除 ${count || viewListLogs.length} 個 view_list 記錄\n`);
    
    // 3. 驗證清理效果
    const { data: remainingLogs } = await supabase
      .from('audit_logs')
      .select('action')
      .eq('action', 'view_list');
    
    if (!remainingLogs || remainingLogs.length === 0) {
      console.log('✅ 清理完成！資料庫中已無 view_list 記錄');
    } else {
      console.log(`⚠️ 仍有 ${remainingLogs.length} 個 view_list 記錄未清理`);
    }
    
    // 4. 顯示優化後的統計
    const { data: allLogsAfter } = await supabase
      .from('audit_logs')
      .select('action');
    
    if (allLogsAfter) {
      const totalAfter = allLogsAfter.length;
      const actionCounts: Record<string, number> = {};
      
      allLogsAfter.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      
      console.log('\n📈 清理後的審計日誌統計:');
      console.log(`   總記錄數: ${totalAfter}`);
      console.log('   動作分布:');
      
      Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([action, count]) => {
          const percentage = ((count / totalAfter) * 100).toFixed(1);
          console.log(`     ${action}: ${count} 次 (${percentage}%)`);
        });
      
      console.log('\n🎉 資料庫優化完成！');
      console.log('   現在審計日誌只包含真正有價值的操作記錄');
    }
    
  } catch (err) {
    console.error('❌ 清理過程發生錯誤:', err);
  }
}

cleanupAuditLogs();