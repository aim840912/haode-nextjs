# 圖片優化使用指南

## 🚫 禁止使用原生 `<img>` 標籤

**重要**: 本專案禁止使用原生 `<img>` 標籤，請使用以下優化組件：

## 🖼️ 推薦組件

### 1. SimpleImage（主要組件）

```typescript
import SimpleImage from '@/components/SimpleImage'

// 基本使用
<SimpleImage
  src="/images/example.jpg"
  alt="範例圖片"
  width={400}
  height={300}
/>

// Fill 模式（適合容器內圖片）
<SimpleImage
  src="/images/example.jpg"
  alt="範例圖片"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// 首屏重要圖片
<SimpleImage
  src="/images/hero.jpg"
  alt="主要圖片"
  fill
  priority // 優先載入
  sizes="100vw"
/>
```

### 2. ResponsiveSimpleImage（響應式圖片）

```typescript
import { ResponsiveSimpleImage } from '@/components/SimpleImage'

<ResponsiveSimpleImage
  src="/images/example.jpg"
  alt="響應式圖片"
  aspectRatio="aspect-video" // 或 "aspect-square", "aspect-[4/3]"
/>
```

### 3. AvatarSimpleImage（頭像圖片）

```typescript
import { AvatarSimpleImage } from '@/components/SimpleImage'

<AvatarSimpleImage
  src="/images/avatar.jpg"
  alt="使用者頭像"
  size="md" // sm, md, lg, xl
/>
```

## 📐 Sizes 屬性指南

正確的 `sizes` 屬性對效能至關重要：

```typescript
// 卡片網格（3 欄）
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

// 全寬橫幅
sizes="100vw"

// 側邊欄圖片（固定寬度）
sizes="(max-width: 768px) 100vw, 300px"

// 頭像（小圖）
sizes="64px"
```

## ⚡ 效能最佳實踐

### 1. 優先級設定
```typescript
// 首屏圖片設為 priority
<SimpleImage priority={true} />

// 前 3 個項目設為優先
<SimpleImage priority={index < 3} />
```

### 2. 品質設定
```typescript
// 一般圖片
<SimpleImage quality={85} /> // 預設值

// 背景圖片（可降低品質）
<SimpleImage quality={75} />

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