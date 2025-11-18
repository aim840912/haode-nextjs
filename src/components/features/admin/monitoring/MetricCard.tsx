import React from 'react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  /** 指標標籤 */
  label: string
  /** 指標數值 */
  value: number | string
  /** 圖示元件 */
  icon: LucideIcon
  /** 圖示顏色 */
  iconColor: 'blue' | 'green' | 'amber' | 'purple'
}

const iconColorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  amber: 'text-amber-500',
  purple: 'text-purple-500',
}

/**
 * 通用的指標卡片元件
 *
 * 用於顯示單一業務指標，包含標籤、數值和圖示
 */
export const MetricCard = React.memo<MetricCardProps>(({ label, value, icon: Icon, iconColor }) => {
  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${iconColorClasses[iconColor]}`} />
      </div>
    </div>
  )
})

MetricCard.displayName = 'MetricCard'
