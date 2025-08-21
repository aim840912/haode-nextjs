/**
 * 詢價 API 測試腳本
 * 使用方法：在瀏覽器開發者工具的 Console 中執行
 */

// 測試詢價 API 連接
async function testInquiryAPI() {
  console.log('🧪 開始測試詢價 API...');
  
  try {
    // 步驟 1: 檢查認證狀態
    console.log('1️⃣ 檢查認證狀態...');
    
    // 從 localStorage 或其他地方獲取 session
    const supabase = window.supabase || null;
    if (!supabase) {
      console.error('❌ Supabase 客戶端未載入');
      return;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ 取得 session 失敗:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ 使用者未登入');
      console.log('💡 請先登入後再執行此測試');
      return;
    }
    
    console.log('✅ 使用者已登入:', session.user.email);
    
    // 步驟 2: 準備測試資料
    console.log('2️⃣ 準備測試資料...');
    
    const testInquiryData = {
      customer_name: '測試使用者',
      customer_email: session.user.email,
      customer_phone: '0912345678',
      delivery_address: '台北市信義區測試街123號',
      notes: '這是一個API測試詢價單',
      items: [
        {
          product_id: 'test-product-001',
          product_name: '測試商品A',
          product_category: '水果類',
          quantity: 2,
          unit_price: 100
        },
        {
          product_id: 'test-product-002', 
          product_name: '測試商品B',
          product_category: '蔬菜類',
          quantity: 3,
          unit_price: 50
        }
      ]
    };
    
    console.log('✅ 測試資料準備完成');
    
    // 步驟 3: 呼叫詢價 API
    console.log('3️⃣ 呼叫詢價建立 API...');
    
    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testInquiryData)
    });
    
    const result = await response.json();
    
    console.log('📊 API 回應狀態:', response.status);
    console.log('📊 API 回應內容:', result);
    
    if (response.ok) {
      console.log('✅ 詢價建立成功！');
      console.log('📝 詢價單 ID:', result.data.id);
      
      // 步驟 4: 測試查詢 API
      console.log('4️⃣ 測試查詢詢價 API...');
      
      const getResponse = await fetch('/api/inquiries', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const getResult = await getResponse.json();
      console.log('📊 查詢結果:', getResult);
      
      if (getResponse.ok) {
        console.log('✅ 查詢詢價成功！');
        console.log('📊 詢價單數量:', getResult.data?.length || 0);
      } else {
        console.error('❌ 查詢詢價失敗:', getResult.error);
      }
      
    } else {
      console.error('❌ 詢價建立失敗');
      console.error('💬 錯誤訊息:', result.error);
      console.error('📋 詳細資訊:', result.details);
      
      // 提供建議的解決方案
      if (result.error.includes('權限')) {
        console.log('💡 建議解決方案:');
        console.log('   1. 檢查資料庫 RLS 政策設定');
        console.log('   2. 確認 profiles 資料表中有對應的使用者記錄');
        console.log('   3. 執行 docs/development/supabase-inquiry-troubleshooting.sql');
      } else if (result.error.includes('資料表')) {
        console.log('💡 建議解決方案:');
        console.log('   1. 執行 supabase/migrations/009_create_inquiry_tables.sql');
        console.log('   2. 檢查 Supabase Dashboard 中的資料表是否存在');
      }
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
    console.error('📋 錯誤詳情:', error.message);
    console.error('📋 錯誤堆疊:', error.stack);
  }
  
  console.log('🏁 測試完成');
}

// 檢查 Supabase 連接狀態
async function checkSupabaseConnection() {
  console.log('🔗 檢查 Supabase 連接狀態...');
  
  try {
    const response = await fetch(window.location.origin + '/api/inquiries', {
      method: 'GET'
    });
    
    console.log('📊 連接測試狀態:', response.status);
    
    if (response.status === 401) {
      console.log('✅ API 端點存在但需要認證（正常）');
    } else if (response.status === 500) {
      console.log('⚠️  API 端點存在但有內部錯誤');
    } else {
      console.log('✅ API 端點回應正常');
    }
    
  } catch (error) {
    console.error('❌ 連接測試失敗:', error);
  }
}

// 執行測試
console.log('🚀 詢價功能測試腳本已載入');
console.log('💡 執行 testInquiryAPI() 來測試詢價功能');
console.log('💡 執行 checkSupabaseConnection() 來檢查連接狀態');

// 如果在 Node.js 環境中，自動執行測試
if (typeof window === 'undefined') {
  console.log('⚠️  此腳本需要在瀏覽器環境中執行');
}