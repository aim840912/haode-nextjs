# 圖片優化使用指南（統一更新版）

## 🚫 禁止使用原生 `<img>` 標籤

**重要**: 本專案禁止使用原生 `<img>` 標籤，請使用統一的優化組件：

## 🖼️ 統一圖片組件 - OptimizedImage

### 1. OptimizedImage（主要組件）

**所有圖片都應使用此統一組件**，具備以下功能：
- ⚡ 智能懶加載（Intersection Observer）
- 🖼️ 自動 Blur Placeholder
- 📱 響應式圖片支援
- 🔄 Base64 到 Blob 轉換
- ⚠️ 多層錯誤處理
- 🎨 預建響應式和頭像組件

```typescript
import OptimizedImage from '@/components/OptimizedImage'

// 基本使用
<OptimizedImage
  src="/images/example.jpg"
  alt="範例圖片"
  width={400}
  height={300}
/>

// Fill 模式（適合容器內圖片）
<OptimizedImage
  src="/images/example.jpg"
  alt="範例圖片"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// 首屏重要圖片
<OptimizedImage
  src="/images/hero.jpg"
  alt="主要圖片"
  fill
  priority // 優先載入，跳過懶加載
  sizes="100vw"
/>

// 啟用多層 fallback（類似舊 SafeImage）
<OptimizedImage
  src="/images/example.jpg"
  alt="範例圖片"
  width={400}
  height={300}
  enableMultiLevelFallback={true}
  showErrorDetails={true}
/>
```

### 2. 響應式圖片組件

```typescript
import { ResponsiveImage } from '@/components/OptimizedImage'

<ResponsiveImage
  src="/images/example.jpg"
  alt="響應式圖片"
  aspectRatio="aspect-video" // 或 "aspect-square", "aspect-[4/3]"
/>
```

### 3. 頭像圖片組件

```typescript
import { AvatarImage } from '@/components/OptimizedImage'

<AvatarImage
  src="/images/avatar.jpg"
  alt="使用者頭像"
  size="md" // sm, md, lg, xl
/>
```

### 4. 兼容性別名（舊組件遷移）

為了順利遷移，我們提供兼容性別名：

```typescript
// SafeImage 別名（啟用多層 fallback）
import { SafeImage } from '@/components/OptimizedImage'

// SimpleImage 別名（啟用錯誤詳情）
import { SimpleImage } from '@/components/OptimizedImage'

// 其他響應式和頭像組件別名也有提供
import { ResponsiveSimpleImage, AvatarSimpleImage } from '@/components/OptimizedImage'
```

## 📐 優化的 Sizes 屬性

統一組件提供更好的預設 sizes 配置：

```typescript
// 新的預設配置（自動套用）
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

// 響應式產品圖片
sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"

// 全寬橫幅
sizes="100vw"

// 頭像（小圖）
sizes="64px"
```

## ⚡ 增強的效能功能

### 1. 智能懶加載
```typescript
// 預設啟用懶加載，提前 100px 開始載入
<OptimizedImage lazy={true} threshold={0.1} />

// 首屏重要圖片跳過懶加載
<OptimizedImage priority={true} />
```

### 2. 優化的品質和 Placeholder
```typescript
// 新的預設值：品質 80，自動 blur placeholder
<OptimizedImage quality={80} placeholder="blur" />

// 背景圖片（可降低品質）
<OptimizedImage quality={75} />

// 重要圖片（提高品質）
<SimpleImage quality={95} />
```

### 3. Placeholder 處理
```typescript
// 模糊預覽
<SimpleImage
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

## 🛠️ 遷移指南

### 從原生 img 遷移

```typescript
// ❌ 舊寫法
<img 
  src="/images/product.jpg" 
  alt="產品圖片"
  className="w-full h-48 object-cover"
/>

// ✅ 新寫法
<SimpleImage
  src="/images/product.jpg"
  alt="產品圖片"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## 🔍 ESLint 檢查

專案已設定 ESLint 規則 `@next/next/no-img-element: error`，使用原生 img 會報錯。

## 📊 優化效果

使用這些組件後，你的圖片將自動享有：

- ✅ **現代格式**: 自動轉換為 AVIF/WebP
- ✅ **響應式載入**: 根據裝置載入適當大小
- ✅ **延遲載入**: 節省頻寬和提升速度
- ✅ **長期快取**: 365 天瀏覽器快取
- ✅ **模糊預覽**: 提升載入體驗

## ❓ 常見問題

**Q: 什麼時候使用 fill？**
A: 當圖片需要填滿父容器時使用 fill，記得父容器要有 `position: relative`

**Q: base64 圖片怎麼處理？**
A: SimpleImage 會自動處理，無需特殊設定

**Q: 動態圖片如何設定 sizes？**
A: 根據實際顯示大小設定，不確定時使用 `100vw`