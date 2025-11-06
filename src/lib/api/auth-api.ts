/**
 * Auth API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiClient } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import { handleApiError } from './common'

/**
 * 檢查手機號碼回應
 */
export interface CheckPhoneResponse {
  phone: string
  available: boolean
  message: string
}

/**
 * 手機轉電子郵件回應
 */
export interface PhoneToEmailResponse {
  email: string
  userId: string
}

/**
 * 忘記密碼請求
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * 更新密碼請求
 */
export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
}

/**
 * 檢查手機號碼是否可用
 * @param phone - 手機號碼
 * @returns 檢查結果
 */
export async function checkPhoneAvailability(phone: string): Promise<CheckPhoneResponse> {
  try {
    const params = new URLSearchParams({ phone })
    const result = await apiClient.get<CheckPhoneResponse>(`/api/auth/check-phone?${params}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '檢查手機號碼失敗')
    }

    apiLogger.info('手機號碼檢查完成', {
      metadata: {
        phonePrefix: phone.substring(0, 3) + '***',
        available: result.data.available,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'checkPhoneAvailability', 'AuthAPI')
  }
}

/**
 * 根據手機號碼查詢電子郵件
 * @param phone - 手機號碼
 * @returns 電子郵件和使用者 ID
 */
export async function getEmailByPhone(phone: string): Promise<PhoneToEmailResponse> {
  try {
    const params = new URLSearchParams({ phone })
    const result = await apiClient.get<PhoneToEmailResponse>(`/api/auth/phone-to-email?${params}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '查詢電子郵件失敗')
    }

    apiLogger.info('手機號碼轉換成功', {
      metadata: {
        phonePrefix: phone.substring(0, 3) + '***',
        emailDomain: result.data.email.split('@')[1],
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'getEmailByPhone', 'AuthAPI')
  }
}

/**
 * 發送忘記密碼郵件
 * @param email - 電子郵件地址
 * @returns 是否發送成功
 */
export async function sendPasswordResetEmail(email: string): Promise<boolean> {
  try {
    const result = await apiClient.post<{ message: string }>('/api/auth/forgot-password', {
      email,
    })

    if (!result.success) {
      throw new Error(result.message || '發送密碼重設郵件失敗')
    }

    apiLogger.info('密碼重設郵件發送成功', {
      metadata: {
        emailDomain: email.split('@')[1],
      },
    })

    return true
  } catch (error) {
    handleApiError(error, 'sendPasswordResetEmail', 'AuthAPI')
  }
}

/**
 * 更新使用者密碼
 * @param data - 密碼更新資料
 * @returns 是否更新成功
 */
export async function updateUserPassword(data: UpdatePasswordRequest): Promise<boolean> {
  try {
    const result = await apiClient.post<{ message: string }>(
      '/api/auth/update-password',
      data as unknown as Record<string, unknown>
    )

    if (!result.success) {
      throw new Error(result.message || '更新密碼失敗')
    }

    apiLogger.info('密碼更新成功', {
      metadata: { timestamp: new Date().toISOString() },
    })

    return true
  } catch (error) {
    handleApiError(error, 'updateUserPassword', 'AuthAPI')
  }
}
