/**
 * useToast Hook
 */

import { useContext } from 'react'
import { ToastContext } from '../context/ToastContext'

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast 必須在 ToastProvider 內使用')
  }
  return context
}
