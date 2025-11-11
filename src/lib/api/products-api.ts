/**
 * Products API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiClient } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import type { Product, CreateProductData, UpdateProductData, ProductImage } from '@/types/product'
import { handleApiError } from './common'

/**
 * 產品查詢參數
 */
export interface FetchProductsParams {
  category?: string
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

/**
 * 檢查名稱/SKU 回應
 */
interface CheckResponse {
  exists: boolean
  message?: string
}

/**
 * 取得產品列表
 * @param params - 查詢參數（篩選、分頁）
 * @returns 產品陣列
 */
export async function fetchProducts(params?: FetchProductsParams): Promise<Product[]> {
  try {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/products${searchParams.toString() ? `?${searchParams}` : ''}`
    const result = await apiClient.get<Product[]>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得產品列表失敗')
    }

    apiLogger.info('產品列表取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchProducts', 'ProductsAPI')
  }
}

/**
 * 取得單一產品詳情
 * @param id - 產品 ID
 * @returns 產品詳細資料
 */
export async function fetchProductById(id: string): Promise<Product> {
  try {
    const result = await apiClient.get<Product>(`/api/products/${id}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得產品詳情失敗')
    }

    apiLogger.info('產品詳情取得成功', {
      metadata: { productId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchProductById', 'ProductsAPI')
  }
}

/**
 * 建立新產品
 * @param data - 產品資料
 * @returns 建立的產品
 */
export async function createProduct(data: CreateProductData): Promise<Product> {
  try {
    const result = await apiClient.post<Product>(
      '/api/products',
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '建立產品失敗')
    }

    apiLogger.info('產品建立成功', {
      metadata: { productId: result.data.id, name: result.data.name },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createProduct', 'ProductsAPI')
  }
}

/**
 * 更新產品
 * @param id - 產品 ID
 * @param data - 更新資料
 * @returns 更新後的產品
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<Product> {
  try {
    const result = await apiClient.put<Product>(
      `/api/products/${id}`,
      data as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '更新產品失敗')
    }

    apiLogger.info('產品更新成功', {
      metadata: { productId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'updateProduct', 'ProductsAPI')
  }
}

/**
 * 刪除產品
 * @param id - 產品 ID
 * @returns 是否刪除成功
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const result = await apiClient.delete<void>(`/api/products/${id}`)

    if (!result.success) {
      throw new Error(result.message || '刪除產品失敗')
    }

    apiLogger.info('產品刪除成功', {
      metadata: { productId: id },
    })

    return true
  } catch (error) {
    handleApiError(error, 'deleteProduct', 'ProductsAPI')
  }
}

/**
 * 取得產品分類列表
 * @returns 分類陣列
 */
export async function fetchProductCategories(): Promise<string[]> {
  try {
    const result = await apiClient.get<string[]>('/api/products/categories')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得產品分類失敗')
    }

    apiLogger.info('產品分類取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchProductCategories', 'ProductsAPI')
  }
}

/**
 * 檢查產品名稱是否已存在
 * @param name - 產品名稱
 * @param excludeId - 排除的產品 ID（用於編輯時）
 * @returns 是否存在
 */
export async function checkProductName(name: string, excludeId?: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ name })
    if (excludeId) {
      params.append('excludeId', excludeId)
    }

    const result = await apiClient.get<CheckResponse>(`/api/products/check-name?${params}`)

    return result.data?.exists ?? false
  } catch (error) {
    apiLogger.warn('檢查產品名稱失敗', {
      metadata: { name, error: error instanceof Error ? error.message : String(error) },
    })
    return false
  }
}

/**
 * 檢查產品 SKU 是否已存在
 * @param sku - 產品 SKU
 * @param excludeId - 排除的產品 ID（用於編輯時）
 * @returns 是否存在
 */
export async function checkProductSKU(sku: string, excludeId?: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ sku })
    if (excludeId) {
      params.append('excludeId', excludeId)
    }

    const result = await apiClient.get<CheckResponse>(`/api/products/check-sku?${params}`)

    return result.data?.exists ?? false
  } catch (error) {
    apiLogger.warn('檢查產品 SKU 失敗', {
      metadata: { sku, error: error instanceof Error ? error.message : String(error) },
    })
    return false
  }
}

/**
 * 取得產品圖片列表
 * @param productId - 產品 ID
 * @returns 產品圖片陣列
 */
export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  try {
    const result = await apiClient.get<ProductImage[]>(`/api/products/${productId}/images`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得產品圖片失敗')
    }

    apiLogger.info('產品圖片取得成功', {
      metadata: { productId, count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchProductImages', 'ProductsAPI')
  }
}
