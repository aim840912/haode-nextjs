# CSS 管理改善方案

## 現況問題分析

### 目前狀況
- **282+ 處 className 使用**：專案中大量使用 Tailwind utility classes
- **單一 CSS 檔案**：僅有 `globals.css` 管理全域樣式
- **無 CSS Modules**：沒有使用模組化 CSS 管理
- **高度重複**：相同樣式組合在多處重複出現

### 主要問題
```tsx
// 現況範例 - 可讀性差、難維護
<button className="bg-amber-900 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors font-medium shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
  探索農產品
</button>
```

## 方案一：Tailwind @apply 指令（推薦優先實施）

### 實施方式
在 `globals.css` 中建立語意化的樣式類別：

```css
/* src/app/globals.css */

/* 按鈕樣式 */
@layer components {
  .btn {
    @apply px-6 py-3 rounded-full font-medium transition-all duration-200;
    @apply active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-primary {
    @apply btn bg-amber-900 text-white hover:bg-amber-800 shadow-lg;
  }
  
  .btn-secondary {
    @apply btn bg-white text-amber-900 border-2 border-amber-900 hover:bg-amber-50;
  }
  
  /* 卡片樣式 */
  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .card-hover {
    @apply card hover:shadow-xl transition-shadow duration-300;
  }
  
  /* 標題樣式 */
  .heading-1 {
    @apply text-5xl md:text-7xl font-serif-display text-amber-900 mb-6;
  }
  
  .heading-2 {
    @apply text-3xl md:text-4xl font-bold text-amber-900 mb-4;
  }
}
```

### 使用範例
```tsx
// 改善後 - 簡潔、語意化
<button className="btn-primary">
  探索農產品
</button>
```

### 優點
- ✅ 保留 Tailwind 的優勢
- ✅ 減少重複程式碼
- ✅ 提高可讀性
- ✅ 容易實施，不需大幅重構

## 方案二：抽取共用元件

### 建立 UI 元件庫
```tsx
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-50';
  
  const variants = {
    primary: 'bg-amber-900 text-white hover:bg-amber-800 shadow-lg',
    secondary: 'bg-white text-amber-900 border-2 border-amber-900 hover:bg-amber-50',
    ghost: 'text-amber-900 hover:bg-amber-50'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 使用範例
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="lg" onClick={handleClick}>
  探索農產品
</Button>
```

### 優點
- ✅ 完全封裝樣式邏輯
- ✅ 提供 TypeScript 類型安全
- ✅ 統一的 API 介面
- ✅ 容易測試和維護

## 方案三：使用 clsx/cn 工具函式

### 安裝與設定
```bash
npm install clsx tailwind-merge
```

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 使用範例
```tsx
import { cn } from '@/lib/utils';

function ProductCard({ isActive, isFeatured }) {
  return (
    <div className={cn(
      'card p-6 transition-all',
      isActive && 'border-2 border-amber-500',
      isFeatured && 'bg-gradient-to-br from-amber-50 to-white',
      'hover:shadow-xl'
    )}>
      {/* 內容 */}
    </div>
  );
}
```

### 優點
- ✅ 條件樣式管理清晰
- ✅ 避免樣式衝突
- ✅ 保持 Tailwind 的靈活性

## 方案四：混合策略（最佳實踐）

### 分層管理
1. **基礎層**：使用 @apply 定義常用樣式
2. **元件層**：抽取共用 UI 元件
3. **工具層**：使用 cn 處理動態樣式
4. **特殊層**：保留 Tailwind utilities 處理一次性樣式

### 目錄結構
```
src/
├── styles/
│   ├── globals.css      # 全域樣式與 @apply
│   ├── components.css   # 元件專用樣式
│   └── utilities.css    # 自定義工具類
├── components/
│   └── ui/             # 共用 UI 元件
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── index.ts
└── lib/
    └── utils.ts        # cn 工具函式
```

## 實施建議

### 第一階段（1-2 天）
- [ ] 建立 cn 工具函式
- [ ] 定義常用的 @apply 樣式類別
- [ ] 整理現有重複的樣式組合

### 第二階段（3-5 天）
- [ ] 抽取 Button、Card、Input 等基礎元件
- [ ] 統一元件的 props 介面
- [ ] 撰寫元件文件

### 第三階段（持續優化）
- [ ] 逐步替換現有的長串 className
- [ ] 建立設計系統規範
- [ ] 加入 Storybook 展示元件

## 效益評估

### Before
```tsx
<div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-6 border-2 border-transparent hover:border-amber-500">
```

### After
```tsx
<Card variant="hover" className="p-6" />
```

### 改善指標
- **程式碼減少**：約 60-70%
- **可讀性提升**：顯著改善
- **維護成本**：降低 50%
- **開發速度**：提升 30%

## 注意事項

1. **漸進式改善**：不需要一次改完所有檔案
2. **保持一致性**：團隊需要統一命名規範
3. **文件重要**：建立元件使用文件
4. **效能考量**：避免過度抽象化
5. **相容性**：確保與現有程式碼相容

## 常見問題 Q&A

### Q: 會不會影響 Tailwind 的效能？
A: 使用 @apply 不會影響效能，因為編譯後仍是相同的 CSS。元件化可能會有輕微的 bundle size 增加，但換來的是更好的維護性。

### Q: 如何保證設計一致性？
A: 建立設計 token 和元件庫，所有樣式統一從這些地方引用，避免直接寫 Tailwind classes。

### Q: 舊程式碼需要立即改寫嗎？
A: 不需要，可以採用漸進式改善。新功能使用新的方式，舊功能在修改時順便重構。

---

**建立時間**: 2025-08-19  
**最後更新**: 2025-08-19  
**狀態**: 待實施