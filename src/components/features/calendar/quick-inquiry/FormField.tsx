import React from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * 表單欄位類型
 */
type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea'

/**
 * Select 選項
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * FormField Props
 */
interface FormFieldProps {
  /** 欄位標籤 */
  label: string
  /** 欄位類型 */
  type: FormFieldType
  /** 欄位值 */
  value: string | number
  /** 值變更回調 */
  onChange: (value: string | number) => void
  /** 是否必填 */
  required?: boolean
  /** 錯誤訊息 */
  error?: string
  /** Placeholder */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 最小值 (number/date) */
  min?: string | number
  /** 最大值 (number/date) */
  max?: string | number
  /** 文字區域行數 */
  rows?: number
  /** Select 選項 */
  options?: SelectOption[]
}

/**
 * 通用表單欄位元件
 *
 * 支援多種輸入類型，統一錯誤顯示和樣式
 */
export const FormField = React.memo<FormFieldProps>(
  ({
    label,
    type,
    value,
    onChange,
    required = false,
    error,
    placeholder,
    disabled = false,
    min,
    max,
    rows = 3,
    options = [],
  }) => {
    const baseInputClassName = cn(
      'w-full px-3 py-2 border rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-blue-500',
      error ? 'border-red-300' : 'border-gray-300',
      disabled && 'opacity-50 cursor-not-allowed'
    )

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      if (type === 'number') {
        onChange(parseInt(e.target.value) || 0)
      } else {
        onChange(e.target.value)
      }
    }

    const renderInput = () => {
      switch (type) {
        case 'select':
          return (
            <select
              value={value}
              onChange={handleChange}
              className={baseInputClassName}
              disabled={disabled}
            >
              {options.map(option => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          )

        case 'textarea':
          return (
            <textarea
              value={value}
              onChange={handleChange}
              rows={rows}
              className={baseInputClassName}
              placeholder={placeholder}
              disabled={disabled}
            />
          )

        case 'number':
          return (
            <input
              type="number"
              value={value}
              onChange={handleChange}
              min={min}
              max={max}
              className={baseInputClassName}
              disabled={disabled}
            />
          )

        case 'date':
          return (
            <input
              type="date"
              value={value}
              onChange={handleChange}
              min={min as string}
              max={max as string}
              className={baseInputClassName}
              disabled={disabled}
            />
          )

        default:
          // text, email, tel
          return (
            <input
              type={type}
              value={value}
              onChange={handleChange}
              className={baseInputClassName}
              placeholder={placeholder}
              disabled={disabled}
            />
          )
      }
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInput()}
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
