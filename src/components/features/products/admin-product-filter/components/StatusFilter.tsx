/**
 * 產品狀態篩選元件
 *
 * 包含庫存狀態和上架狀態篩選
 */

import type { AdminFilterState } from '../types'

interface StatusFilterProps {
  availability: AdminFilterState['availability']
  status: AdminFilterState['status']
  onAvailabilityChange: (value: AdminFilterState['availability']) => void
  onStatusChange: (value: AdminFilterState['status']) => void
}

const AVAILABILITY_OPTIONS = [
  { value: 'all' as const, label: '全部' },
  { value: 'in_stock' as const, label: '有庫存' },
  { value: 'out_of_stock' as const, label: '缺貨' },
]

const STATUS_OPTIONS = [
  { value: 'all' as const, label: '全部' },
  { value: 'active' as const, label: '已上架' },
  { value: 'inactive' as const, label: '已下架' },
]

export function StatusFilter({
  availability,
  status,
  onAvailabilityChange,
  onStatusChange,
}: StatusFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 庫存狀態 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">庫存狀態</label>
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="availability"
                value={option.value}
                checked={availability === option.value}
                onChange={e =>
                  onAvailabilityChange(e.target.value as AdminFilterState['availability'])
                }
                className="text-amber-600 focus:ring-amber-500 mr-2"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 上架狀態 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">上架狀態</label>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={status === option.value}
                onChange={e => onStatusChange(e.target.value as AdminFilterState['status'])}
                className="text-amber-600 focus:ring-amber-500 mr-2"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
