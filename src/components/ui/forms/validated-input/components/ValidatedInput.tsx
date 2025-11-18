'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ValidatedInputProps } from '../types'
import { getInputState } from '../utils/getInputState'
import { getStateClasses } from '../utils/getStateClasses'
import { useValidatedInputState } from '../hooks/useValidatedInputState'
import { useSuggestions } from '../hooks/useSuggestions'
import { InputLabel } from './InputLabel'
import { InputField } from './InputField'
import { StatusIcon } from './StatusIcon'
import { SuggestionsList } from './SuggestionsList'
import { ValidationMessages } from './ValidationMessages'
import { CharacterCount } from './CharacterCount'

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
  const { internalValue, handleChange } = useValidatedInputState(value, type)
  const { showSuggestions, handleFocus, handleBlur, handleSuggestionClick } = useSuggestions({
    suggestions,
    onFocus,
    onBlur,
    onChange,
    onSuggestionSelect,
  })

  const inputState = getInputState(error, warning, success, isValidating)
  const baseClasses = getStateClasses(inputState, className)

  return (
    <div className="relative">
      <InputLabel htmlFor={id} label={label} required={required} />

      <div className="relative">
        {/* 前綴 */}
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 select-none">
            {prefix}
          </span>
        )}

        {/* 輸入框 */}
        <div className={cn(prefix && 'pl-8', suffix && 'pr-12')}>
          <InputField
            id={id}
            type={type}
            value={internalValue}
            onChange={e => handleChange(e, onChange)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            autoComplete={autoComplete}
            rows={rows}
            inputState={inputState}
            error={error}
            warning={warning}
            success={success}
            helpText={helpText}
            baseClasses={baseClasses}
          />
        </div>

        {/* 狀態圖標和後綴 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {suffix && !isValidating && <span className="text-gray-500 select-none">{suffix}</span>}
          <StatusIcon inputState={inputState} />
        </div>

        {/* 建議列表 */}
        <SuggestionsList
          show={showSuggestions}
          suggestions={suggestions}
          onSelect={handleSuggestionClick}
        />
      </div>

      {/* 輔助資訊區域 */}
      <div className="mt-1 space-y-1">
        <ValidationMessages
          id={id}
          error={error}
          warning={warning}
          success={success}
          helpText={helpText}
        />

        {/* 字數統計 */}
        <div className="flex justify-between items-center">
          <div />
          <CharacterCount
            value={internalValue}
            maxLength={maxLength || 0}
            type={type}
            showCharCount={showCharCount}
          />
        </div>
      </div>
    </div>
  )
}
