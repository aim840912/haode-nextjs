import { cn } from '@/lib/utils/cn'

interface FormMessageProps {
  message: string | null
  type: 'error' | 'success'
}

export const FormMessage = ({ message, type }: FormMessageProps) => {
  if (!message) return null

  const isError = type === 'error'
  const bgColor = isError ? 'bg-red-50' : 'bg-green-50'
  const borderColor = isError ? 'border-red-200' : 'border-green-200'
  const textColor = isError ? 'text-red-800' : 'text-green-800'
  const iconColor = isError ? 'text-red-400' : 'text-green-400'

  return (
    <div className={cn('mb-4 p-4 border rounded-md', bgColor, borderColor)}>
      <div className="flex">
        <div className="flex-shrink-0">
          {isError ? (
            <svg className={cn('h-5 w-5', iconColor)} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className={cn('h-5 w-5', iconColor)} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className={cn('text-sm font-medium', textColor)}>{message}</p>
        </div>
      </div>
    </div>
  )
}
