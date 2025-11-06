'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export type ValidatedInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'url'
  | 'password'

export interface ValidatedInputProps {
  id: string
  label: string
  type?: ValidatedInputType
  value: string | number
  onChange: (value: string | number) => void
  onBlur?: () => void
  onFocus?: () => void

  // 驗證狀態
  error?: string
  warning?: string
  success?: string
  isValidating?: boolean

  // 樣式和行為
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string

  // 輔助功能
  helpText?: string
  maxLength?: number
  showCharCount?: boolean

  // 特殊功能
  prefix?: string
  suffix?: string
  autoComplete?: string
  rows?: number // for textarea

  // 進階功能
  suggestions?: string[]
  onSuggestionSelect?: (suggestion: string) => void
}

/**
 * 增強的驗證輸入元件
 *
 * 功能特色：
 * - 即時驗證狀態顯示
 * - 字數統計
 * - 建議列表
 * - 無障礙支援
 * - 多種輸入類型支援
 */
export function ValidatedInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  success,
  isValidating,
  placeholder,
  required,
  disabled,
  className = '',
  helpText,
  maxLength,
  showCharCount,
  prefix,
  suffix,
  autoComplete,
  rows = 4,
  suggestions = [],
  onSuggestionSelect,
}: ValidatedInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [internalValue, setInternalValue] = useState(value)

  // 同步外部值變化
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // 決定輸入框的樣式狀態
  const getInputState = () => {
    if (error) return 'error'
    if (isValidating) return 'validating'
    if (success && !isValidating) return 'success'
    if (warning) return 'warning'
    return 'default'
  }

  const inputState = getInputState()

  // 樣式映射
  const stateClasses = {
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500',
    warning: 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500',
    success: 'border-green-500 focus:ring-green-500 focus:border-green-500',
    validating: 'border-blue-500 focus:ring-blue-500 focus:border-blue-500',
    default: 'border-gray-300 focus:ring-green-500 focus:border-transparent',
  }

  const baseClasses = cn(
    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200',
    stateClasses[inputState],
    className
  )

  // 處理值變化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value
    setInternalValue(newValue)
    onChange(newValue)
  }

  // 處理聚焦
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
    onFocus?.()
  }

  // 處理失焦
  const handleBlur = () => {
    // 延遲隱藏建議列表，讓用戶有機會點擊建議項目
    setTimeout(() => setShowSuggestions(false), 200)
    onBlur?.()
  }

  // 選擇建議項目
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    onSuggestionSelect?.(suggestion)
  }

  // 狀態圖標
  const StatusIcon = () => {
    switch (inputState) {
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'validating':
        return (
          <div className="w-5 h-5">
            <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )
      case 'warning':
        return <InformationCircleIcon className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  // 渲染輸入框
  const renderInput = () => {
    const inputProps = {
      id,
      value: internalValue,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      disabled,
      maxLength,
      autoComplete,
      'aria-invalid': !!error,
      'aria-describedby':
        [
          error ? `${id}-error` : '',
          warning ? `${id}-warning` : '',
          success ? `${id}-success` : '',
          helpText ? `${id}-help` : '',
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    }

    if (type === 'textarea') {
      return <textarea {...inputProps} rows={rows} className={baseClasses} />
    }

    return (
      <input
        {...inputProps}
        type={type}
        className={baseClasses}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
      />
    )
  }

  return (
    <div className="relative">
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* 輸入框容器 */}
      <div className="relative">
        {/* 前綴 */}
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 select-none">
            {prefix}
          </span>
        )}

        {/* 輸入框 */}
        <div className={cn(prefix && 'pl-8', suffix && 'pr-12')}>{renderInput()}</div>

        {/* 狀態圖標和後綴 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {suffix && !isValidating && <span className="text-gray-500 select-none">{suffix}</span>}
          <StatusIcon />
        </div>

        {/* 建議列表 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 輔助資訊區域 */}
      <div className="mt-1 space-y-1">
        {/* 錯誤訊息 */}
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600 flex items-center" role="alert">
            <ExclamationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* 警告訊息 */}
        {warning && !error && (
          <p id={`${id}-warning`} className="text-sm text-yellow-600 flex items-center">
            <InformationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            {warning}
          </p>
        )}

        {/* 成功訊息 */}
        {success && !error && !warning && (
          <p id={`${id}-success`} className="text-sm text-green-600 flex items-center">
            <CheckCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            {success}
          </p>
        )}

        {/* 說明文字和字數統計 */}
        <div className="flex justify-between items-center">
          {helpText && !error && !warning && !success && (
            <p id={`${id}-help`} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}

          {/* 字數統計 */}
          {showCharCount && maxLength && type !== 'number' && (
            <span
              className={cn(
                'text-sm',
                String(internalValue).length > maxLength * 0.9
                  ? 'text-red-500'
                  : String(internalValue).length > maxLength * 0.7
                    ? 'text-yellow-500'
                    : 'text-gray-400'
              )}
            >
              {String(internalValue).length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
