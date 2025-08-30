import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAuditOptimization() {
  try {
    console.log('🔍 驗證審計日誌優化效果...\n');
    
    // 1. 檢查最近 1 小時內的審計日誌
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('audit_logs')
      .select('action, resource_type, created_at, user_email')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });
    
    if (!recentLogs || recentLogs.length === 0) {
      console.log('📊 最近 1 小時內沒有新的審計日誌記錄');
      console.log('   這可能表示系統正常或沒有使用者活動\n');
    } else {
      console.log('📊 最近 1 小時內的審計日誌:');
      console.log(`   總記錄數: ${recentLogs.length}`);
      
      // 檢查是否有 view_list 記錄
      const viewListRecords = recentLogs.filter(log => log.action === 'view_list');
      console.log(`   瀏覽列表記錄: ${viewListRecords.length}`);
      
      if (viewListRecords.length > 0) {
        console.log('   ⚠️ 發現新的瀏覽列表記錄:');
        viewListRecords.forEach(log => {
          const time = new Date(log.created_at).toLocaleString('zh-TW');
          console.log(`     ${time} - ${log.user_email} 瀏覽 ${log.resource_type}`);
        });
        console.log('   💡 可能需要檢查其他 API 路由是否仍在記錄列表瀏覽\n');
      } else {
        console.log('   ✅ 沒有新的瀏覽列表記錄，優化生效！\n');
      }
      
      // 顯示其他操作類型
      const otherActions = recentLogs.filter(log => log.action !== 'view_list');
      if (otherActions.length > 0) {
        console.log('   📋 其他操作記錄:');
        const actionCounts: Record<string, number> = {};
        otherActions.forEach(log => {
          const key = `${log.action}_${log.resource_type}`;
          actionCounts[key] = (actionCounts[key] || 0) + 1;
        });
        
        Object.entries(actionCounts).forEach(([key, count]) => {
          const [action, resource] = key.split('_');
          console.log(`     ${action} ${resource}: ${count} 次`);
        });
      }
    }
    
    // 2. 統計整體改善效果
    const { data: allLogs } = await supabase
      .from('audit_logs')
      .select('action, created_at');
      
    if (allLogs && allLogs.length > 0) {
      const viewListCount = allLogs.filter(log => log.action === 'view_list').length;
      const totalCount = allLogs.length;
      const percentage = ((viewListCount / totalCount) * 100).toFixed(1);
      
      console.log('📈 整體統計（包含歷史記錄）:');
      console.log(`   總記錄數: ${totalCount}`);
      console.log(`   瀏覽列表記錄: ${viewListCount} (${percentage}%)`);
      
      if (parseFloat(percentage) > 40) {
        console.log('   💡 建議：考慮清理歷史的瀏覽列表記錄以進一步優化');
      } else if (parseFloat(percentage) < 20) {
        console.log('   ✅ 瀏覽列表記錄比例已大幅改善！');
      }
    }
    
    // 3. 檢查是否有任何 inquiry 相關的 view_list 記錄
    const { data: inquiryViewLogs } = await supabase
      .from('audit_logs')
      .select('created_at, user_email')
      .eq('action', 'view_list')
      .eq('resource_type', 'inquiry')
      .gte('created_at', oneHourAgo);
      
    if (inquiryViewLogs && inquiryViewLogs.length > 0) {
      console.log('\n⚠️ 發現最近的詢價列表瀏覽記錄:');
      inquiryViewLogs.forEach(log => {
        const time = new Date(log.created_at).toLocaleString('zh-TW');
        console.log(`   ${time} - ${log.user_email}`);
      });
      console.log('   需要檢查 /api/inquiries 路由是否仍有遺漏的記錄點');
    } else {
      console.log('\n✅ 最近沒有詢價列表瀏覽記錄，/api/inquiries 優化成功！');
    }
    
  } catch (err) {
    console.error('❌ 驗證錯誤:', err);
  }
}

verifyAuditOptimization();