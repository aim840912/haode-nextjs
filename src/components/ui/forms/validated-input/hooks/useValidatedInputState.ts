import { useState, useEffect } from 'react'

/**
 * 管理 ValidatedInput 的內部狀態
 */
export function useValidatedInputState(value: string | number, type: string) {
  const [internalValue, setInternalValue] = useState(value)

  // 同步外部值變化
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  /**
   * 處理值變化
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    onChange: (value: string | number) => void
  ) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value
    setInternalValue(newValue)
    onChange(newValue)
  }

  return {
    internalValue,
    handleChange,
  }
}
