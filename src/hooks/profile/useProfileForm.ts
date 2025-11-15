import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { User } from '@/types/auth'

export interface ProfileFormData {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

export interface UseProfileFormReturn {
  formData: ProfileFormData
  isEditing: boolean
  isSaving: boolean
  setIsEditing: (editing: boolean) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSave: () => Promise<void>
}

/**
 * 個人資料表單 Hook
 * 負責管理個人資料的表單狀態和儲存邏輯
 */
export function useProfileForm(
  user: User | null,
  updateProfile: (data: Partial<User>) => Promise<void>,
  onSuccess: () => void,
  onError: (message: string) => void
): UseProfileFormReturn {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: '台灣',
    },
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 初始化表單資料
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || '台灣',
        },
      })
    }
  }, [user])

  // 處理輸入變更
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }, [])

  // 儲存個人資料
  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      })

      setIsEditing(false)
      onSuccess()
    } catch (updateError) {
      logger.error('Profile update failed', updateError as Error, {
        metadata: { userId: user?.id },
      })
      onError('更新失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }, [formData, updateProfile, user, onSuccess, onError])

  return {
    formData,
    isEditing,
    isSaving,
    setIsEditing,
    handleInputChange,
    handleSave,
  }
}
