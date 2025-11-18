import React from 'react'

interface InputLabelProps {
  htmlFor: string
  label: string
  required?: boolean
}

/**
 * 輸入框標籤元件
 */
export const InputLabel = React.memo(function InputLabel({
  htmlFor,
  label,
  required,
}: InputLabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
})
