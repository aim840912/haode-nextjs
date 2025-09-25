import { ValidationRules, validationRules } from '@/hooks/useFormValidation'

export interface ProductFormData {
  name: string
  description: string
  category: string
  price: number
  inventory: number
  images: string[]
  isActive: boolean
  tags: string[]
  sku?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  seoTitle?: string
  seoDescription?: string
}

/**
 * 產品表單驗證規則配置
 */
export const productValidationRules: ValidationRules<ProductFormData> = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: '產品名稱必填且長度需在 2-100 字元之間',
  },

  description: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    message: '產品描述必填且長度需在 10-1000 字元之間',
  },

  category: {
    required: true,
    message: '請選擇產品分類',
  },

  price: {
    required: true,
    customValidator: (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return '價格必須是有效數字'
      }
      if (value <= 0) {
        return '價格必須大於 0'
      }
      if (value > 1000000) {
        return '價格不能超過 1,000,000'
      }
      // 檢查小數位數
      const decimalPlaces = (value.toString().split('.')[1] || '').length
      if (decimalPlaces > 2) {
        return '價格小數位數不能超過 2 位'
      }
      return null
    },
  },

  inventory: {
    required: true,
    customValidator: (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return '庫存必須是有效數字'
      }
      if (value < 0) {
        return '庫存不能為負數'
      }
      if (!Number.isInteger(value)) {
        return '庫存必須是整數'
      }
      if (value > 999999) {
        return '庫存數量不能超過 999,999'
      }
      return null
    },
  },

  images: {
    required: true,
    customValidator: (value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) {
        return '請至少上傳一張產品圖片'
      }
      if (value.length > 10) {
        return '圖片數量不能超過 10 張'
      }
      return null
    },
  },

  sku: {
    required: false,
    pattern: /^[A-Z0-9-]{3,20}$/,
    message: 'SKU 格式：3-20 位英文大寫字母、數字或連字符',
  },

  weight: {
    required: false,
    customValidator: (value?: number) => {
      if (value === undefined) return null
      if (typeof value !== 'number' || isNaN(value)) {
        return '重量必須是有效數字'
      }
      if (value <= 0) {
        return '重量必須大於 0'
      }
      if (value > 100000) {
        return '重量不能超過 100kg'
      }
      return null
    },
  },

  seoTitle: {
    required: false,
    maxLength: 60,
    message: 'SEO 標題不能超過 60 字元',
  },

  seoDescription: {
    required: false,
    maxLength: 160,
    message: 'SEO 描述不能超過 160 字元',
  },
}

/**
 * 非同步驗證規則：檢查產品名稱是否重複
 */
export const createAsyncProductValidationRules = (): ValidationRules<ProductFormData> => ({
  ...productValidationRules,
  name: {
    ...productValidationRules.name,
    asyncValidator: async (name: string) => {
      if (!name || name.length < 2) return null

      try {
        const response = await fetch(`/api/products/check-name?name=${encodeURIComponent(name)}`)
        const data = await response.json()

        if (data.exists) {
          return '此產品名稱已存在，請使用其他名稱'
        }
        return null
      } catch (error) {
        // 非同步驗證失敗時不阻止表單提交，由伺服器端最終驗證
        return null
      }
    },
  },

  sku: productValidationRules.sku
    ? {
        ...productValidationRules.sku,
        asyncValidator: async (sku?: string) => {
          if (!sku) return null

          try {
            const response = await fetch(`/api/products/check-sku?sku=${encodeURIComponent(sku)}`)
            const data = await response.json()

            if (data.exists) {
              return '此 SKU 已存在，請使用其他 SKU'
            }
            return null
          } catch (error) {
            return null
          }
        },
      }
    : undefined,
})

/**
 * 表單完成度計算
 */
export function calculateFormCompleteness(values: Partial<ProductFormData>): {
  completeness: number
  requiredFieldsCount: number
  completedFieldsCount: number
  optionalFieldsCount: number
  completedOptionalFieldsCount: number
} {
  const requiredFields = [
    'name',
    'description',
    'category',
    'price',
    'inventory',
    'images',
  ] as const
  const optionalFields = ['sku', 'weight', 'seoTitle', 'seoDescription', 'tags'] as const

  const completedRequiredFields = requiredFields.filter(field => {
    const value = values[field]
    if (field === 'images') {
      return Array.isArray(value) && value.length > 0
    }
    if (typeof value === 'number') {
      return !isNaN(value)
    }
    return value && value.toString().trim().length > 0
  })

  const completedOptionalFields = optionalFields.filter(field => {
    const value = values[field]
    if (field === 'tags') {
      return Array.isArray(value) && value.length > 0
    }
    if (typeof value === 'number') {
      return !isNaN(value) && value > 0
    }
    return value && value.toString().trim().length > 0
  })

  const requiredCompleteness = completedRequiredFields.length / requiredFields.length
  const optionalCompleteness = completedOptionalFields.length / optionalFields.length

  // 必填欄位權重 80%，選填欄位權重 20%
  const completeness = requiredCompleteness * 0.8 + optionalCompleteness * 0.2

  return {
    completeness: Math.round(completeness * 100) / 100,
    requiredFieldsCount: requiredFields.length,
    completedFieldsCount: completedRequiredFields.length,
    optionalFieldsCount: optionalFields.length,
    completedOptionalFieldsCount: completedOptionalFields.length,
  }
}

/**
 * 表單提交前的最終驗證
 */
export function validateProductForSubmission(values: ProductFormData): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 基本必填欄位檢查
  if (!values.name?.trim()) errors.push('產品名稱不能為空')
  if (!values.description?.trim()) errors.push('產品描述不能為空')
  if (!values.category) errors.push('請選擇產品分類')
  if (!values.price || values.price <= 0) errors.push('請輸入有效的產品價格')
  if (values.inventory === undefined || values.inventory < 0) errors.push('請輸入有效的庫存數量')
  if (!Array.isArray(values.images) || values.images.length === 0)
    errors.push('請至少上傳一張產品圖片')

  // 業務邏輯檢查
  if (values.price > 100000) warnings.push('產品價格較高，請確認是否正確')
  if (values.inventory > 10000) warnings.push('庫存數量較大，請確認是否正確')
  if (values.description.length < 20) warnings.push('產品描述較短，建議增加更多詳細資訊')
  if (!values.seoTitle) warnings.push('建議設定 SEO 標題以提升搜尋排名')

  // 圖片檢查
  if (values.images.length === 1) warnings.push('建議上傳多張圖片展示產品細節')

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 產品表單初始值
 */
export const initialProductFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  price: 0,
  inventory: 0,
  images: [],
  isActive: true,
  tags: [],
}
