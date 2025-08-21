/**
 * Supabase 詢價功能診斷工具
 * 在瀏覽器 Console 中執行此腳本來診斷問題
 */

async function diagnoseSuppbaseInquiry() {
  console.log('🔍 開始 Supabase 詢價功能診斷...');
  
  const results = {
    connection: false,
    auth: false,
    tables: {
      inquiries: false,
      inquiry_items: false,
      profiles: false
    },
    policies: {
      inquiries_insert: false,
      inquiry_items_insert: false
    },
    testInsert: false,
    errors: []
  };

  try {
    // 步驟 1: 測試 Supabase 連接
    console.log('1️⃣ 測試 Supabase 連接...');
    
    const response = await fetch('/api/inquiries', {
      method: 'GET'
    });
    
    if (response.status === 401) {
      results.connection = true;
      console.log('✅ Supabase API 連接正常（回應 401 需要認證）');
    } else if (response.status === 500) {
      console.log('⚠️ API 端點存在但有內部錯誤');
      results.errors.push('API 內部錯誤');
    }

    // 步驟 2: 檢查認證狀態
    console.log('2️⃣ 檢查認證狀態...');
    
    // 嘗試從 localStorage 或其他方式獲取認證狀態
    const supabaseClient = window.supabase;
    if (supabaseClient) {
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        results.auth = true;
        console.log('✅ 使用者已認證:', session.user.email);
        
        // 步驟 3: 測試有認證的 API 調用
        console.log('3️⃣ 測試認證後的 API 調用...');
        
        const authResponse = await fetch('/api/inquiries', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        const authResult = await authResponse.json();
        console.log('📊 認證 API 回應:', {
          status: authResponse.status,
          result: authResult
        });
        
        if (authResponse.ok) {
          console.log('✅ 認證 API 調用成功');
        } else {
          console.log('❌ 認證 API 調用失敗:', authResult.error);
          results.errors.push(authResult.error);
        }
        
      } else {
        console.log('❌ 使用者未認證');
        results.errors.push('使用者未認證');
      }
    } else {
      console.log('❌ 找不到 Supabase 客戶端');
      results.errors.push('Supabase 客戶端未初始化');
    }

    // 步驟 4: 測試詢價提交（如果認證通過）
    if (results.auth && supabaseClient) {
      console.log('4️⃣ 測試詢價提交...');
      
      const testInquiryData = {
        customer_name: '診斷測試',
        customer_email: 'diagnosis@test.com',
        customer_phone: '0912345678',
        notes: '這是診斷測試資料',
        items: [{
          product_id: 'test-001',
          product_name: '測試商品',
          product_category: '測試',
          quantity: 1,
          unit_price: 100
        }]
      };
      
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        const testResponse = await fetch('/api/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(testInquiryData)
        });
        
        const testResult = await testResponse.json();
        
        console.log('📊 測試詢價提交結果:', {
          status: testResponse.status,
          result: testResult
        });
        
        if (testResponse.ok) {
          results.testInsert = true;
          console.log('✅ 測試詢價提交成功！問題已解決');
          
          // 清理測試資料
          if (testResult.data && testResult.data.id) {
            console.log('🧹 清理測試資料...');
            // 注意：這裡不執行清理，避免影響正常資料
          }
          
        } else {
          console.log('❌ 測試詢價提交失敗:', testResult.error);
          results.errors.push(`測試提交失敗: ${testResult.error}`);
          
          // 分析具體錯誤
          if (testResult.error && testResult.error.includes('row-level security')) {
            console.log('🔍 錯誤分析: RLS 政策問題');
            console.log('💡 建議解決方案: 執行 docs/development/IMMEDIATE_FIX.sql');
          } else if (testResult.error && testResult.error.includes('relation') && testResult.error.includes('does not exist')) {
            console.log('🔍 錯誤分析: 資料表不存在');
            console.log('💡 建議解決方案: 執行資料庫遷移');
          }
        }
        
      } catch (testError) {
        console.log('❌ 測試過程中發生錯誤:', testError);
        results.errors.push(`測試錯誤: ${testError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ 診斷過程中發生錯誤:', error);
    results.errors.push(`診斷錯誤: ${error.message}`);
  }

  // 步驟 5: 輸出診斷結果
  console.log('📋 診斷結果摘要:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔌 Supabase 連接: ${results.connection ? '✅' : '❌'}`);
  console.log(`🔐 使用者認證: ${results.auth ? '✅' : '❌'}`);
  console.log(`📊 測試插入: ${results.testInsert ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('❌ 發現的問題:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  // 步驟 6: 提供建議
  console.log('💡 建議解決方案:');
  
  if (!results.connection) {
    console.log('   1. 檢查 .env.local 中的 Supabase 設定');
    console.log('   2. 確認 Supabase 專案狀態');
  }
  
  if (!results.auth) {
    console.log('   1. 請先登入系統');
    console.log('   2. 檢查認證設定');
  }
  
  if (!results.testInsert && results.auth) {
    console.log('   1. 執行 docs/development/IMMEDIATE_FIX.sql');
    console.log('   2. 檢查資料表是否存在');
    console.log('   3. 檢查 RLS 政策設定');
  }

  console.log('🏁 診斷完成');
  
  return results;
}

// 自動執行診斷
console.log('🚀 Supabase 詢價功能診斷工具已載入');
console.log('💡 執行 diagnoseSuppbaseInquiry() 開始診斷');

// 如果在支援的環境中，自動執行
if (typeof window !== 'undefined' && window.location) {
  // 延遲執行，等待頁面完全載入
  setTimeout(() => {
    if (confirm('是否要自動執行 Supabase 診斷？')) {
      diagnoseSuppbaseInquiry();
    }
  }, 1000);
}