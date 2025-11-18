import { AlertTriangle, AlertCircle, WifiOff } from 'lucide-react'
import { LoadingError as LoadingErrorType } from '@/hooks/useLoadingState'

export function getErrorIcon(error: LoadingErrorType) {
  if (error.code === 'NETWORK_ERROR' || error.message.includes('網路')) {
    return <WifiOff className="w-6 h-6 text-red-500" />
  }
  if (error.code === 'TIMEOUT') {
    return <AlertCircle className="w-6 h-6 text-orange-500" />
  }
  return <AlertTriangle className="w-6 h-6 text-red-500" />
}

export function getErrorTitle(error: LoadingErrorType): string {
  if (error.code === 'NETWORK_ERROR' || error.message.includes('網路')) {
    return '網路連線問題'
  }
  if (error.code === 'TIMEOUT') {
    return '載入逾時'
  }
  if (error.code === 'SERVER_ERROR' || error.code?.toString().startsWith('5')) {
    return '伺服器錯誤'
  }
  if (error.code?.toString().startsWith('4')) {
    return '請求錯誤'
  }
  return '載入失敗'
}

export function getErrorMessage(error: LoadingErrorType): string {
  if (error.code === 'NETWORK_ERROR' || error.message.includes('網路')) {
    return '請檢查您的網路連線，然後重試'
  }
  if (error.code === 'TIMEOUT') {
    return '載入時間過長，請重試或稍後再試'
  }
  if (error.code === 'SERVER_ERROR' || error.code?.toString().startsWith('5')) {
    return '伺服器暫時無法回應，請稍後再試'
  }
  if (error.code?.toString().startsWith('4')) {
    return '請求無效，請重新整理頁面'
  }
  return error.message || '發生未預期的錯誤'
}
