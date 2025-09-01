/**
 * 統一輸入驗證中間件
 * 
 * 與現有的錯誤處理系統整合，提供統一的 API 輸入驗證
 * 支援 JSON body、查詢參數和路由參數的驗證
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { validateData, validateRequestData, validateSearchParams } from '@/lib/validation-schemas';

// ============================================================================
// 類型定義
// ============================================================================

/**
 * 驗證配置選項
 */
export interface ValidationConfig {
  /** Body 驗證 schema */
  body?: z.ZodSchema<any>;
  /** 查詢參數驗證 schema */
  query?: z.ZodSchema<any>;
  /** 路由參數驗證 schema */
  params?: z.ZodSchema<any>;
  /** 是否跳過 body 驗證（用於 GET 請求） */
  skipBodyValidation?: boolean;
  /** 是否記錄驗證錯誤 */
  logValidationErrors?: boolean;
  /** 自訂錯誤訊息前綴 */
  errorPrefix?: string;
}

/**
 * 驗證結果類型
 */
export interface ValidationResult {
  body?: any;
  query?: any;
  params?: any;
}

/**
 * API 處理器類型（附帶驗證結果）
 */
export type ValidatedApiHandler<T = any> = (
  request: NextRequest,
  context: {
    params?: any;
    validated: ValidationResult;
  }
) => Promise<NextResponse | Response>;

// ============================================================================
// 驗證中間件核心函數
// ============================================================================

/**
 * 驗證請求 Body
 */
async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  options: ValidationConfig
): Promise<T> {
  if (options.skipBodyValidation || request.method === 'GET' || request.method === 'DELETE') {
    return undefined as any;
  }

  try {
    const result = await validateRequestData(request, schema);
    
    if (!result.success) {
      if (options.logValidationErrors) {
        apiLogger.warn('Body validation failed', {
          metadata: {
            error: result.error,
            method: request.method,
            url: request.url,
            type: 'body_validation'
          }
        });
      }
      
      throw new ValidationError(
        `${options.errorPrefix || '請求資料'}驗證失敗: ${result.error}`
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    // JSON 解析錯誤
    throw new ValidationError(
      `${options.errorPrefix || '請求資料'}格式錯誤: 無效的 JSON 格式`
    );
  }
}

/**
 * 驗證查詢參數
 */
function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  options: ValidationConfig
): T {
  const { searchParams } = new URL(request.url);
  const result = validateSearchParams(searchParams, schema);
  
  if (!result.success) {
    if (options.logValidationErrors) {
      apiLogger.warn('Query params validation failed', {
        metadata: {
          error: result.error,
          method: request.method,
          url: request.url,
          type: 'query_validation'
        }
      });
    }
    
    throw new ValidationError(
      `查詢參數驗證失敗: ${result.error}`
    );
  }
  
  return result.data;
}

/**
 * 驗證路由參數
 */
function validateRouteParams<T>(
  params: any,
  schema: z.ZodSchema<T>,
  options: ValidationConfig
): T {
  const result = validateData(schema, params);
  
  if (!result.success) {
    if (options.logValidationErrors) {
      apiLogger.warn('Route params validation failed', {
        metadata: {
          error: result.error,
          params: params,
          type: 'params_validation'
        }
      });
    }
    
    throw new ValidationError(
      `路由參數驗證失敗: ${result.error}`
    );
  }
  
  return result.data;
}

// ============================================================================
// 驗證中間件函數
// ============================================================================

/**
 * 創建驗證中間件
 * 
 * @param handler API 處理函數
 * @param config 驗證配置
 * @returns 包裝後的處理函數
 */
export function withValidation<T extends ValidatedApiHandler>(
  handler: T,
  config: ValidationConfig
): T {
  return (async (request: NextRequest, context?: any) => {
    try {
      const validated: ValidationResult = {};
      
      // 驗證 Body
      if (config.body) {
        validated.body = await validateRequestBody(request, config.body, {
          ...config,
          logValidationErrors: config.logValidationErrors ?? true
        });
      }
      
      // 驗證查詢參數
      if (config.query) {
        validated.query = validateQueryParams(request, config.query, {
          ...config,
          logValidationErrors: config.logValidationErrors ?? true
        });
      }
      
      // 驗證路由參數
      if (config.params && context?.params) {
        validated.params = validateRouteParams(context.params, config.params, {
          ...config,
          logValidationErrors: config.logValidationErrors ?? true
        });
      }
      
      // 呼叫原始處理器，傳入驗證結果
      return await handler(request, {
        ...context,
        validated
      });
      
    } catch (error) {
      // 讓錯誤處理中間件處理驗證錯誤
      throw error;
    }
  }) as T;
}

// ============================================================================
// 便利函數
// ============================================================================

/**
 * 僅驗證 Body 的中間件
 */
export function withBodyValidation<T extends z.ZodSchema<any>>(
  handler: ValidatedApiHandler,
  schema: T,
  options?: Partial<ValidationConfig>
): ValidatedApiHandler {
  return withValidation(handler, {
    body: schema,
    logValidationErrors: true,
    ...options
  });
}

/**
 * 僅驗證查詢參數的中間件
 */
export function withQueryValidation<T extends z.ZodSchema<any>>(
  handler: ValidatedApiHandler,
  schema: T,
  options?: Partial<ValidationConfig>
): ValidatedApiHandler {
  return withValidation(handler, {
    query: schema,
    logValidationErrors: true,
    skipBodyValidation: true,
    ...options
  });
}

/**
 * 僅驗證路由參數的中間件
 */
export function withParamsValidation<T extends z.ZodSchema<any>>(
  handler: ValidatedApiHandler,
  schema: T,
  options?: Partial<ValidationConfig>
): ValidatedApiHandler {
  return withValidation(handler, {
    params: schema,
    logValidationErrors: true,
    skipBodyValidation: true,
    ...options
  });
}

// ============================================================================
// 進階驗證組合
// ============================================================================

/**
 * 組合多個驗證中間件
 * 
 * @param validations 驗證配置數組
 * @returns 組合的驗證配置
 */
export function combineValidations(...validations: ValidationConfig[]): ValidationConfig {
  const combined: ValidationConfig = {
    logValidationErrors: true
  };
  
  for (const validation of validations) {
    if (validation.body) {
      combined.body = validation.body;
    }
    if (validation.query) {
      combined.query = validation.query;
    }
    if (validation.params) {
      combined.params = validation.params;
    }
    if (validation.skipBodyValidation !== undefined) {
      combined.skipBodyValidation = validation.skipBodyValidation;
    }
    if (validation.logValidationErrors !== undefined) {
      combined.logValidationErrors = validation.logValidationErrors;
    }
    if (validation.errorPrefix) {
      combined.errorPrefix = validation.errorPrefix;
    }
  }
  
  return combined;
}

/**
 * 條件式驗證中間件
 * 根據請求方法選擇不同的驗證規則
 */
export function withConditionalValidation(
  handler: ValidatedApiHandler,
  validationMap: Record<string, ValidationConfig>
): ValidatedApiHandler {
  return async (request: NextRequest, context?: any) => {
    const method = request.method.toLowerCase();
    const config = validationMap[method] || validationMap.default;
    
    if (!config) {
      // 沒有配置驗證規則，直接執行
      return await handler(request, context);
    }
    
    return await withValidation(handler, config)(request, context);
  };
}

// ============================================================================
// 常用驗證組合
// ============================================================================

/**
 * 基礎 CRUD 驗證配置
 */
export const CommonValidations = {
  /** UUID 參數驗證 */
  uuidParam: z.object({
    id: z.string().uuid('無效的 ID 格式')
  }),
  
  /** 分頁查詢驗證 */
  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    page: z.coerce.number().int().min(1).optional(),
    per_page: z.coerce.number().int().min(1).max(100).optional()
  }).transform((data) => {
    if (data.page && data.per_page) {
      return {
        limit: data.per_page,
        offset: (data.page - 1) * data.per_page
      };
    }
    return {
      limit: data.limit,
      offset: data.offset
    };
  }),
  
  /** 排序參數驗證 */
  sorting: z.object({
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc')
  }),
  
  /** 管理員金鑰驗證 */
  adminKey: z.object({
    'x-admin-key': z.string().min(32, '無效的管理員金鑰')
  }).or(z.object({
    adminKey: z.string().min(32, '無效的管理員金鑰')
  }))
};

// ============================================================================
// 除錯和日誌工具
// ============================================================================

/**
 * 驗證除錯中間件
 * 在開發環境中記錄驗證過程
 */
export function withValidationDebug(
  handler: ValidatedApiHandler,
  config: ValidationConfig,
  debugLabel?: string
): ValidatedApiHandler {
  if (process.env.NODE_ENV !== 'development') {
    // 生產環境中不啟用除錯
    return withValidation(handler, config);
  }
  
  return withValidation(async (request, context) => {
    const label = debugLabel || 'API Validation';
    
    apiLogger.debug(`[${label}] Validation started`, {
      metadata: {
        method: request.method,
        url: request.url,
        hasBodySchema: !!config.body,
        hasQuerySchema: !!config.query,
        hasParamsSchema: !!config.params
      }
    });
    
    const result = await handler(request, context);
    
    apiLogger.debug(`[${label}] Validation completed`, {
      metadata: {
        validated: {
          body: !!context.validated.body,
          query: !!context.validated.query,
          params: !!context.validated.params
        }
      }
    });
    
    return result;
  }, config);
}

/**
 * 驗證統計收集器（用於監控）
 */
class ValidationMetrics {
  private static instance: ValidationMetrics;
  private metrics: Map<string, { success: number; failure: number }> = new Map();
  
  static getInstance(): ValidationMetrics {
    if (!ValidationMetrics.instance) {
      ValidationMetrics.instance = new ValidationMetrics();
    }
    return ValidationMetrics.instance;
  }
  
  record(endpoint: string, success: boolean): void {
    const current = this.metrics.get(endpoint) || { success: 0, failure: 0 };
    if (success) {
      current.success++;
    } else {
      current.failure++;
    }
    this.metrics.set(endpoint, current);
  }
  
  getMetrics(): Record<string, { success: number; failure: number; total: number; successRate: number }> {
    const result: Record<string, any> = {};
    
    for (const [endpoint, stats] of this.metrics.entries()) {
      const total = stats.success + stats.failure;
      result[endpoint] = {
        ...stats,
        total,
        successRate: total > 0 ? (stats.success / total) * 100 : 0
      };
    }
    
    return result;
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

export const validationMetrics = ValidationMetrics.getInstance();

/**
 * 帶統計的驗證中間件
 */
export function withValidationMetrics(
  handler: ValidatedApiHandler,
  config: ValidationConfig,
  endpoint?: string
): ValidatedApiHandler {
  return withValidation(async (request, context) => {
    const endpointLabel = endpoint || new URL(request.url).pathname;
    
    try {
      const result = await handler(request, context);
      validationMetrics.record(endpointLabel, true);
      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        validationMetrics.record(endpointLabel, false);
      }
      throw error;
    }
  }, config);
}