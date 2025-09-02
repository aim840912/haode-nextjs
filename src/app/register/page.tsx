'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/Toast'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const { register } = useAuth()
  const { success, error: showError } = useToast()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // 檢查手機號碼是否已被使用
  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || !/^09\d{8}$/.test(phone.replace(/[-\s]/g, ''))) {
      return // 格式不正確時不檢查
    }

    setIsCheckingPhone(true)
    try {
      const response = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(phone)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '檢查手機號碼時發生錯誤')
      }

      if (!result.data.available) {
        setErrors(prev => ({
          ...prev,
          phone: '此手機號碼已被註冊'
        }))
      } else {
        // 清除手機號碼錯誤
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.phone
          return newErrors
        })
      }
    } catch (error) {
      console.error('Error checking phone availability:', error)
      // 不顯示網路錯誤給使用者，避免影響註冊流程
    } finally {
      setIsCheckingPhone(false)
    }
  }

  // 處理失去焦點時的驗證
  const handleInputBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // 對失去焦點的欄位進行驗證
    const error = validateField(name, value)

    // 設定錯誤訊息（如果有的話）
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }))

    // 特殊處理：如果是手機號碼欄位且格式正確，檢查是否已被使用
    if (name === 'phone' && !error && value.trim()) {
      await checkPhoneAvailability(value.trim())
    }

    // 特殊處理：如果是密碼欄位，也要重新驗證確認密碼欄位
    if (name === 'password' && formData.confirmPassword) {
      const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword)
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordError,
      }))
    }
  }

  // 單一欄位驗證函數
  const validateField = (name: string, value: string, allData = formData): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          return '請輸入姓名'
        }
        break

      case 'email':
        if (!value.trim()) {
          return '請輸入電子郵件'
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          return '請輸入有效的電子郵件'
        }
        break

      case 'phone':
        if (!value.trim()) {
          return '請輸入手機號碼'
        } else if (!/^09\d{8}$/.test(value.replace(/[-\s]/g, ''))) {
          return '請輸入有效的台灣手機號碼（09開頭，10位數字）'
        }
        break

      case 'password':
        if (!value) {
          return '請輸入密碼'
        } else if (value.length < 8) {
          return '密碼至少需要8個字元'
        }
        break

      case 'confirmPassword':
        if (!value) {
          return '請確認密碼'
        } else if (allData.password !== value) {
          return '密碼不一致'
        }
        break

      default:
        break
    }
    return ''
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    const fields = ['fullName', 'email', 'phone', 'password', 'confirmPassword']
    fields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData] as string)
      if (error) {
        newErrors[field] = error
      }
    })

    return newErrors
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')

    try {
      // 最後一次檢查手機號碼是否可用
      if (formData.phone) {
        setIsCheckingPhone(true)
        const phoneCheckResponse = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(formData.phone)}`)
        const phoneCheckResult = await phoneCheckResponse.json()
        
        if (!phoneCheckResponse.ok || !phoneCheckResult.data.available) {
          throw new Error('此手機號碼已被註冊，請使用其他手機號碼')
        }
        setIsCheckingPhone(false)
      }

      await register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: formData.phone,
      })

      // 顯示成功提示
      success('註冊成功', '歡迎加入豪德茶業！請檢查您的電子郵件進行驗證')
      setSuccessMessage('註冊成功！請檢查您的電子郵件進行驗證...')

      // 延遲一下讓用戶看到成功訊息，然後跳轉到登入頁面
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      console.error('Registration failed:', error)
      let errorMessage = error instanceof Error ? error.message : '註冊失敗，請稍後再試'
      
      // 特殊處理手機號碼重複錯誤
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique') || errorMessage.includes('已被註冊')) {
        errorMessage = '此手機號碼已被註冊，請使用其他手機號碼'
        setErrors({ phone: errorMessage })
      } else {
        setErrors({ general: errorMessage })
      }

      // 顯示錯誤提示
      showError('註冊失敗', errorMessage)
    } finally {
      setIsLoading(false)
      setIsCheckingPhone(false)
    }
  }

  const handleSocialRegister = (provider: string) => {
    alert(`${provider} 註冊功能尚在開發中`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <div className="text-3xl font-bold text-amber-900 tracking-tight">豪德茶業</div>
            <div className="text-sm text-amber-700/70 font-medium tracking-wider">HAUDE TEA</div>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">建立新帳號</h2>
          <p className="text-gray-600">加入豪德茶業會員，享受更多優惠</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">❌</span>
                <p className="text-red-700 font-medium">{errors.general}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                姓名 *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                placeholder="請輸入您的姓名"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                電子郵件 *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                placeholder="請輸入您的電子郵件"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                手機號碼 *
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                  placeholder="請輸入手機號碼（例：0912345678）"
                />
                {isCheckingPhone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                  </div>
                )}
                {!isCheckingPhone && formData.phone && !errors.phone && /^09\d{8}$/.test(formData.phone.replace(/[-\s]/g, '')) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                )}
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              {isCheckingPhone && (
                <p className="mt-1 text-sm text-gray-500">檢查手機號碼中...</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密碼 *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                placeholder="請輸入密碼（至少8個字元）"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                確認密碼 *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-gray-800 placeholder-gray-500"
                placeholder="請再次輸入密碼"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '註冊中...' : '建立帳號'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者使用</span>
              </div>
            </div>
          </div>

          {/* Social Register Buttons */}
          <div className="mt-6 space-y-3">
            {/* Google Register */}
            <button
              onClick={() => handleSocialRegister('Google')}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 註冊
            </button>

            {/* Facebook Register */}
            <button
              onClick={() => handleSocialRegister('Facebook')}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-[#1877F2] text-white hover:bg-[#166FE5] focus:ring-2 focus:ring-amber-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              使用 Facebook 註冊
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已經有帳號了？{' '}
              <Link
                href="/login"
                className="text-amber-600 hover:text-amber-800 font-medium transition-colors"
              >
                立即登入
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-amber-600 transition-colors">
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}
