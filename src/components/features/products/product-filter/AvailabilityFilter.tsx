'use client'

import { FilterState } from '@/hooks/useProductFilter'

interface AvailabilityFilterProps {
  availability: FilterState['availability']
  onAvailabilityChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const availabilityOptions = [
  { value: 'all', label: '全部' },
  { value: 'in_stock', label: '有庫存' },
  { value: 'out_of_stock', label: '缺貨' },
] as const

export function AvailabilityFilter({
  availability,
  onAvailabilityChange,
}: AvailabilityFilterProps) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">庫存狀態</h3>
      <div className="space-y-2">
        {availabilityOptions.map(option => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name="availability"
              value={option.value}
              checked={availability === option.value}
              onChange={onAvailabilityChange}
              className="text-amber-600 focus:ring-amber-500 mr-2"
            />
            <span className="text-sm text-gray-900">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
