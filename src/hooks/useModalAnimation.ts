import { useState, useEffect, useCallback } from 'react'

export interface ModalAnimationState {
  isVisible: boolean
  isAnimating: boolean
  shouldRender: boolean
}

export interface ModalAnimationControls {
  open: () => void
  close: () => Promise<void>
  backdropClasses: string
  contentClasses: string
}

/**
 * Modal 動畫管理 Hook
 *
 * 提供優雅的進入和離開動畫：
 * - 背景淡入淡出 + 模糊效果
 * - Modal 縮放動畫 (scale + opacity)
 * - 確保動畫完成後才從 DOM 移除
 */
export const useModalAnimation = (
  isOpen: boolean,
  duration: number = 300
): ModalAnimationState & ModalAnimationControls => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // 開啟 Modal 動畫
  const open = useCallback(() => {
    setShouldRender(true)
    setIsAnimating(true)

    // 確保 DOM 更新後再開始動畫
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // 動畫完成後更新狀態
    setTimeout(() => {
      setIsAnimating(false)
    }, duration)
  }, [duration])

  // 關閉 Modal 動畫
  const close = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      setIsAnimating(true)
      setIsVisible(false)

      setTimeout(() => {
        setShouldRender(false)
        setIsAnimating(false)
        resolve()
      }, duration)
    })
  }, [duration])

  // 響應外部 isOpen 變化
  useEffect(() => {
    if (isOpen && !shouldRender) {
      open()
    } else if (!isOpen && shouldRender) {
      close()
    }
  }, [isOpen, shouldRender, open, close])

  // 背景遮罩樣式
  const backdropClasses = `
    fixed inset-0 z-50 flex items-center justify-center p-4
    transition-all duration-${duration} ease-out
    ${
      isVisible
        ? 'bg-black/60 backdrop-blur-sm opacity-100'
        : 'bg-black/0 backdrop-blur-none opacity-0'
    }
  `
    .trim()
    .replace(/\s+/g, ' ')

  // Modal 內容樣式
  const contentClasses = `
    relative w-full max-w-4xl max-h-[95vh]
    transition-all duration-${duration} ease-out
    ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
  `
    .trim()
    .replace(/\s+/g, ' ')

  return {
    isVisible,
    isAnimating,
    shouldRender,
    open,
    close,
    backdropClasses,
    contentClasses,
  }
}

/**
 * ESC 鍵關閉 Modal Hook
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [callback, isActive])
}

/**
 * Focus Trap Hook - 確保 Tab 鍵只在 Modal 內循環
 */
export const useFocusTrap = (isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return

    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const modal = document.querySelector('[data-modal="true"]') as HTMLElement

    if (!modal) return

    const firstFocusableElement = modal.querySelector(focusableElements) as HTMLElement
    const focusableContent = modal.querySelectorAll(focusableElements)
    const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement

    // 初始 focus
    if (firstFocusableElement) {
      firstFocusableElement.focus()
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive])
}
