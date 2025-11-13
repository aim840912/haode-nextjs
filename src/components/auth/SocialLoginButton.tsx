'use client'

import { GoogleIcon, LineIcon, FacebookIcon } from '@/components/ui/icons/SocialIcons'
import { OAuthProvider } from '@/types/oauth'

interface SocialLoginButtonProps {
  provider: OAuthProvider
  onClick: (provider: OAuthProvider) => void
  disabled?: boolean
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: GoogleIcon,
    bgColor: 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
    textColor: 'text-gray-900 dark:text-gray-100',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  line: {
    name: 'LINE',
    icon: LineIcon,
    bgColor: 'bg-[#06C755] hover:bg-[#05b34c]',
    textColor: 'text-white',
    borderColor: 'border-[#06C755]',
  },
  facebook: {
    name: 'Facebook',
    icon: FacebookIcon,
    bgColor: 'bg-[#1877F2] hover:bg-[#166fe5]',
    textColor: 'text-white',
    borderColor: 'border-[#1877F2]',
  },
}

export function SocialLoginButton({ provider, onClick, disabled }: SocialLoginButtonProps) {
  const config = providerConfig[provider]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg
        border ${config.borderColor} ${config.bgColor} ${config.textColor}
        font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Icon className="w-5 h-5" />
      <span>使用 {config.name} 登入</span>
    </button>
  )
}
