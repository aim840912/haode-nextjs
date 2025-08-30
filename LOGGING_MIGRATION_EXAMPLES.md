# Console 替換範例指南

## 📋 目前發現的 Console 使用情況

根據程式碼分析，發現以下常見的 console 使用模式：

## 🔄 替換範例

### 1. 基本 Console 替換

#### ❌ 舊的方式
```typescript
// src/components/ImageDebugger.tsx
console.log('✅ 圖片載入成功:', imageUrl);
console.error('❌ 圖片載入失敗:', imageUrl, e);
```

#### ✅ 新的方式
```typescript
import { logger } from '@/lib/logger';

// 資訊日誌
logger.info('圖片載入成功', { 
  imageUrl,
  module: 'ImageDebugger',
  action: 'image_load_success'
});

// 錯誤日誌
logger.error('圖片載入失敗', e, {
  imageUrl,
  module: 'ImageDebugger', 
  action: 'image_load_failed'
});
```

### 2. Supabase 操作日誌

#### ❌ 舊的方式
```typescript
// src/lib/supabase-server.ts
console.warn('無法設定 cookie:', error)
```

#### ✅ 新的方式
```typescript
import { authLogger } from '@/lib/logger';

authLogger.warn('無法設定 cookie', {
  error: error.message,
  action: 'cookie_set_failed'
});
```

### 3. 配置和除錯日誌

#### ❌ 舊的方式
```typescript
// src/config/data-strategy.ts
console.log('🔧 資料策略配置:', {
  strategy: selectedStrategy.name,
  supabaseEnabled: useSupabase,
  environment: process.env.NODE_ENV
});
```

#### ✅ 新的方式
```typescript
import { logger } from '@/lib/logger';

logger.debug('資料策略配置已載入', {
  strategy: selectedStrategy.name,
  supabaseEnabled: useSupabase,
  environment: process.env.NODE_ENV,
  module: 'DataStrategy',
  action: 'config_loaded'
});
```

### 4. 圖片上傳錯誤處理

#### ❌ 舊的方式
```typescript
// src/components/ImageUploader.tsx
console.warn('圖片壓縮失敗，使用原檔案:', error);
console.error('上傳失敗，保留本地預覽:', uploadError);
console.error('上傳失敗:', error);
```

#### ✅ 新的方式
```typescript
import { logger } from '@/lib/logger';

// 警告日誌
logger.warn('圖片壓縮失敗，使用原檔案', error, {
  module: 'ImageUploader',
  action: 'compression_fallback'
});

// 錯誤日誌
logger.error('上傳失敗，保留本地預覽', uploadError, {
  module: 'ImageUploader',
  action: 'upload_failed_with_preview'
});

logger.error('上傳失敗', error, {
  module: 'ImageUploader',
  action: 'upload_failed'
});
```

### 5. Rate Limiting 配置錯誤

#### ❌ 舊的方式
```typescript
// src/config/rate-limits.ts
console.error('[Rate Limit Config] Invalid maxRequests:', config.maxRequests);
console.error('[Rate Limit Config] Invalid windowMs:', config.windowMs);
console.error('[Rate Limit Config] Invalid strategy:', config.strategy);
```

#### ✅ 新的方式
```typescript
import { logger } from '@/lib/logger';

logger.error('Rate Limit 配置無效', undefined, {
  module: 'RateLimit',
  action: 'config_validation_failed',
  invalidField: 'maxRequests',
  value: config.maxRequests
});

logger.error('Rate Limit 配置無效', undefined, {
  module: 'RateLimit', 
  action: 'config_validation_failed',
  invalidField: 'windowMs',
  value: config.windowMs
});

logger.error('Rate Limit 配置無效', undefined, {
  module: 'RateLimit',
  action: 'config_validation_failed', 
  invalidField: 'strategy',
  value: config.strategy
});
```

## 🎯 專案特定的 Logger 實例

### API 路由日誌
```typescript
// src/app/api/products/route.ts
import { apiLogger, logApiRequest } from '@/lib/logger';

export async function GET(request: Request) {
  const timer = apiLogger.timer('GET /api/products');
  
  try {
    const products = await getProducts();
    
    timer.end({
      action: 'products_fetch_success',
      count: products.length
    });
    
    return Response.json(products);
  } catch (error) {
    apiLogger.error('取得產品清單失敗', error, {
      action: 'products_fetch_failed'
    });
    
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### 資料庫操作日誌
```typescript
// src/services/supabaseProductService.ts
import { dbLogger, logDbQuery } from '@/lib/logger';

async getProducts(): Promise<Product[]> {
  const timer = dbLogger.timer('select:products');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
      
    if (error) throw error;
    
    timer.end({
      action: 'select_success',
      table: 'products',
      count: data?.length || 0
    });
    
    return data?.map(this.transformFromDB) || [];
  } catch (error) {
    dbLogger.error('查詢產品失敗', error, {
      action: 'select_failed',
      table: 'products'
    });
    
    return [];
  }
}
```

### 快取操作日誌
```typescript
// src/lib/cache-server.ts
import { cacheLogger } from '@/lib/logger';

static async get<T>(key: string): Promise<T | null> {
  try {
    const cached = await kv.get<T>(key);
    
    if (cached !== null) {
      cacheLogger.debug('快取命中', {
        key,
        action: 'cache_hit'
      });
      return cached;
    } else {
      cacheLogger.debug('快取未命中', {
        key,
        action: 'cache_miss'
      });
    }
  } catch (error) {
    cacheLogger.error('快取讀取失敗', error, {
      key,
      action: 'cache_read_error'
    });
  }
  
  return null;
}
```

## 📊 效能監控範例

### API 回應時間監控
```typescript
// middleware.ts 或 API 路由中
import { logger, PERFORMANCE_METRICS } from '@/lib/logger';

const startTime = performance.now();

// ... 處理請求 ...

const duration = performance.now() - startTime;
const { API_RESPONSE_TIME } = PERFORMANCE_METRICS;

if (duration > API_RESPONSE_TIME.SLOW) {
  logger.warn('API 回應過慢', {
    path: request.url,
    method: request.method,
    duration: Math.round(duration),
    action: 'slow_api_response'
  });
} else if (duration < API_RESPONSE_TIME.FAST) {
  logger.debug('API 回應快速', {
    path: request.url,
    method: request.method, 
    duration: Math.round(duration),
    action: 'fast_api_response'
  });
}
```

### 資料庫查詢效能監控
```typescript
import { dbLogger, PERFORMANCE_METRICS } from '@/lib/logger';

const queryTimer = dbLogger.timer('complex_query');

// ... 執行資料庫查詢 ...

const duration = queryTimer.end({
  table: 'products',
  operation: 'join_select'
});

if (duration > PERFORMANCE_METRICS.DB_QUERY_TIME.SLOW) {
  dbLogger.warn('慢查詢偵測', {
    duration: Math.round(duration),
    table: 'products',
    operation: 'join_select',
    action: 'slow_query'
  });
}
```

## 🔧 ESLint 規則建議

將以下規則加入 `.eslintrc.json`：

```json
{
  "rules": {
    "no-console": ["warn", { 
      "allow": ["warn", "error"] 
    }],
    "prefer-template": "warn"
  },
  "overrides": [
    {
      "files": ["**/*.test.*", "**/scripts/**/*"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

## 🚀 漸進式遷移策略

### 階段 1：新增功能使用新 Logger
- 所有新的 API 路由使用 `apiLogger`
- 新的組件使用相應的模組 logger

### 階段 2：重點模組優先遷移
1. 認證相關 (`authLogger`)
2. 資料庫操作 (`dbLogger`) 
3. 快取操作 (`cacheLogger`)
4. API 路由 (`apiLogger`)

### 階段 3：批量替換
使用 IDE 的 find & replace 功能：
- `console.log` → `logger.info`
- `console.warn` → `logger.warn`
- `console.error` → `logger.error`

### 階段 4：優化和監控
- 檢查日誌輸出品質
- 調整日誌級別
- 加入效能監控
- 整合錯誤追蹤服務

## 💡 最佳實踐

1. **使用結構化上下文**：總是提供有意義的 context 資訊
2. **選擇合適的日誌級別**：debug < info < warn < error < fatal
3. **包含操作標識**：使用 `action` 欄位標識具體操作
4. **遮蔽敏感資料**：避免記錄密碼、token 等敏感資訊
5. **效能意識**：避免在迴圈中大量記錄日誌
6. **一致性**：團隊統一使用相同的日誌格式和約定