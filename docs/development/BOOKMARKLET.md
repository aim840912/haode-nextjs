# 📖 詢價診斷書籤小工具 (Bookmarklet)

## 使用方法

如果無法訪問診斷頁面，您可以使用此書籤小工具進行快速診斷。

### 步驟 1：創建書籤

1. 在瀏覽器中創建一個新書籤
2. 將書籤名稱設為：`詢價診斷`
3. 將下面的程式碼複製到書籤的 URL 欄位：

```javascript
javascript:(function(){
  // 詢價診斷書籤小工具
  const log = console.log;
  const style = 'background: #1a1a1a; color: #00ff00; padding: 2px 4px; border-radius: 3px;';
  
  log('%c🔍 開始詢價診斷...', style);
  
  (async function diagnose() {
    try {
      // 檢查 API 連接
      log('%c1️⃣ 測試 API 連接...', style);
      const apiTest = await fetch('/api/inquiries');
      log(`%cAPI 狀態: ${apiTest.status}`, apiTest.status === 401 ? 'color: green' : 'color: orange');
      
      // 檢查認證
      log('%c2️⃣ 檢查認證狀態...', style);
      const authTest = await fetch('/api/inquiries', {
        headers: { 'Authorization': 'Bearer test' }
      });
      log(`%c認證測試: ${authTest.status}`, 'color: blue');
      
      // 如果可能，嘗試獲取實際的 session
      if (window.supabase) {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
          log('%c3️⃣ 測試實際詢價提交...', style);
          const testData = {
            customer_name: '書籤測試',
            customer_email: session.user.email,
            customer_phone: '0900000000',
            notes: '書籤診斷測試',
            items: [{
              product_id: 'BOOKMARK-TEST',
              product_name: '書籤測試商品',
              product_category: '測試',
              quantity: 1,
              unit_price: 1
            }]
          };
          
          const testResult = await fetch('/api/inquiries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(testData)
          });
          
          const result = await testResult.json();
          
          if (testResult.ok) {
            log('%c✅ 詢價提交測試成功！', 'color: green; font-weight: bold;');
            // 立即刪除測試資料
            if (result.data && result.data.id) {
              await fetch(`/api/inquiries/${result.data.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              });
              log('%c🧹 測試資料已清理', 'color: gray;');
            }
          } else {
            log('%c❌ 詢價提交失敗:', 'color: red; font-weight: bold;');
            log('%c錯誤:', 'color: red;', result.error);
            
            if (result.error.includes('row-level security')) {
              log('%c💡 建議: RLS 政策問題，需要執行 SQL 修復', 'color: yellow; font-weight: bold;');
            } else if (result.error.includes('relation') && result.error.includes('does not exist')) {
              log('%c💡 建議: 資料表不存在，需要建立資料表', 'color: yellow; font-weight: bold;');
            }
          }
        } else {
          log('%c❌ 未登入，無法進行完整測試', 'color: orange;');
        }
      } else {
        log('%c❌ 找不到 Supabase 客戶端', 'color: red;');
      }
      
      log('%c🏁 診斷完成', style);
      log('%c如需詳細診斷，請前往: /diagnosis', 'color: blue; font-style: italic;');
      
    } catch (error) {
      log('%c❌ 診斷過程中發生錯誤:', 'color: red; font-weight: bold;', error);
    }
  })();
})();
```

### 步驟 2：使用書籤

1. 前往您的網站首頁
2. 點擊剛才創建的「詢價診斷」書籤
3. 打開瀏覽器開發者工具 (F12)
4. 查看 Console 標籤頁的診斷結果

### 步驟 3：解讀結果

根據控制台輸出的結果：

- **綠色 ✅** = 正常
- **橙色 ⚠️** = 需要注意
- **紅色 ❌** = 有問題需要修復

## 常見結果解讀

### 結果 1：API 狀態 401
```
API 狀態: 401
```
**說明**：正常，表示 API 端點存在且要求認證

### 結果 2：詢價提交成功
```
✅ 詢價提交測試成功！
```
**說明**：功能完全正常，問題可能是暫時的

### 結果 3：RLS 政策錯誤
```
❌ 詢價提交失敗:
錯誤: 建立詢價單失敗: new row violates row-level security policy
💡 建議: RLS 政策問題，需要執行 SQL 修復
```
**說明**：需要執行 `docs/development/IMMEDIATE_FIX.sql`

### 結果 4：資料表不存在
```
❌ 詢價提交失敗:
錯誤: relation "inquiries" does not exist
💡 建議: 資料表不存在，需要建立資料表
```
**說明**：需要執行 `docs/development/EMERGENCY_BYPASS.md` 中的完整 SQL

## 後續行動

根據診斷結果：

1. **如果測試成功** → 問題可能已自動修復，重試詢價功能
2. **如果是 RLS 問題** → 前往 Supabase Dashboard 執行 RLS 修復 SQL
3. **如果是資料表問題** → 執行完整的資料庫建立 SQL
4. **如果仍有問題** → 前往 `/diagnosis` 頁面進行詳細診斷

## 注意事項

- 此書籤只能在您的網站上使用
- 需要先登入才能進行完整測試
- 測試資料會自動清理，不會影響正常資料