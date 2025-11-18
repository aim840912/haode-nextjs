import React from 'react'
import { InputFieldProps } from '../types'

/**
 * 輸入框元件
 */
export const InputField = React.memo(function InputField({
  id,
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  disabled,
  maxLength,
  autoComplete,
  rows,
  baseClasses,
  error,
  warning,
  success,
  helpText,
}: InputFieldProps) {
  const inputProps = {
    id,
    value,
    onChange,
    onFocus,
    onBlur,
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
})
