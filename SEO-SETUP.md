# SEO 設定指南

這份文件說明如何完成網站的 SEO 設定，讓您的農場網站在 Google 搜尋中被找到。

## 🎯 已完成的 SEO 優化

### ✅ 基礎檔案
- ✅ **sitemap.xml** - 自動生成網站地圖
- ✅ **robots.txt** - 搜尋引擎指引
- ✅ **結構化資料** - JSON-LD 格式的農場資訊

### ✅ Metadata 優化
- ✅ **首頁 metadata** - 完整的 SEO 標籤
- ✅ **各頁面 metadata** - 產品、新聞、文化等頁面
- ✅ **Open Graph** - 社群分享優化
- ✅ **Twitter Cards** - Twitter 分享優化

## 🔧 需要手動完成的設定

### 1. 更新網域資訊

請替換以下檔案中的 `https://haode-nextjs.vercel.app/` 為您的實際網域：

```
src/app/sitemap.ts (第6行)
src/app/robots.ts (第4行)
src/app/layout.tsx (第64、84行)
src/lib/seo-config.ts (第10行)
src/components/StructuredData.tsx (第19、75行)
```

### 2. 設定 Google Search Console

#### 步驟 A：建立 Google Search Console 帳戶
1. 前往 [Google Search Console](https://search.google.com/search-console/)
2. 點擊「開始使用」
3. 選擇「網址前置字元」驗證方式
4. 輸入您的網站網域

#### 步驟 B：驗證網站擁有權
選擇以下任一方式：

**方式1：HTML 檔案驗證**
1. 下載 Google 提供的驗證檔案
2. 將檔案放到 `public/` 資料夾
3. 替換現有的 `google-site-verification.html`

**方式2：HTML 標籤驗證**
1. 複製 Google 提供的 meta 標籤
2. 更新 `src/app/layout.tsx` 第87行的驗證碼

#### 步驟 C：提交 Sitemap
1. 驗證完成後，前往「Sitemap」頁面
2. 提交您的 sitemap：`https://haode-nextjs.vercel.app//sitemap.xml`

### 3. 完善聯絡資訊

更新 `src/lib/seo-config.ts` 中的以下資訊：

```typescript
export const contactInfo = {
  phone: '+886-5-2501234', // 替換為實際電話
  email: 'info@haudefarm.com', // 替換為實際 email
  address: {
    street: '梅山鄉農場路123號', // 替換為實際地址
    // ...
  },
  coordinates: {
    latitude: '23.5833', // 替換為實際座標
    longitude: '120.5833'
  }
}
```

### 4. 設定社群媒體連結

更新 `src/lib/seo-config.ts` 中的社群連結：

```typescript
export const socialLinks = {
  facebook: 'https://www.facebook.com/haudefarm', // 實際 FB 粉絲頁
  instagram: 'https://www.instagram.com/haudefarm', // 實際 IG 帳號
  line: 'https://line.me/haudefarm', // Line 官方帳號
  youtube: 'https://www.youtube.com/haudefarm' // YouTube 頻道
}
```

## 🚀 下一步 SEO 優化建議

### Google My Business
1. 建立 Google 商家檔案
2. 上傳農場照片
3. 設定營業時間
4. 收集客戶評價

### 內容優化
1. 定期發布農場新聞
2. 添加產品詳細資訊
3. 建立農業知識文章
4. 拍攝高品質農場照片

### 技術優化
1. 監控網站載入速度
2. 確保手機版本體驗良好
3. 定期檢查 broken links
4. 優化圖片檔案大小

## 📊 追蹤成效

完成設定後，可以透過以下工具追蹤 SEO 成效：

1. **Google Search Console** - 搜尋表現、索引狀態
2. **Google Analytics** - 流量來源、使用者行為
3. **PageSpeed Insights** - 網站速度評分
4. **Core Web Vitals** - 使用者體驗指標

## ❓ 常見問題

**Q: 多久會在 Google 搜尋中看到我的網站？**
A: 通常需要 1-4 週，取決於網站內容品質和競爭程度。

**Q: 如何提高搜尋排名？**
A: 定期更新內容、獲得其他網站連結、提升使用者體驗。

**Q: 我需要付費才能出現在 Google 搜尋嗎？**
A: 不需要。這些都是免費的自然搜尋優化。

---

完成這些設定後，您的農場網站將具備完整的 SEO 基礎，大大提升在 Google 搜尋中被找到的機會！