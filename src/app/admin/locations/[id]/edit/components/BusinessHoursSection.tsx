import TimeRangePicker from '@/components/ui/form/TimeRangePicker'
import WeekdaySelector from '@/components/ui/form/WeekdaySelector'

interface BusinessHoursSectionProps {
  hours: string
  closedDays: string[]
  onHoursChange: (value: string) => void
  onClosedDaysChange: (value: string[]) => void
  errors?: Record<string, string>
}

export function BusinessHoursSection({
  hours,
  closedDays,
  onHoursChange,
  onClosedDaysChange,
  errors = {},
}: BusinessHoursSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">營業時間</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 營業時間 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            營業時間 <span className="text-red-500">*</span>
          </label>
          <TimeRangePicker value={hours} onChange={onHoursChange} />
          {errors.hours && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hours}</p>
          )}
        </div>

        {/* 公休日 */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            公休日
          </label>
          <WeekdaySelector value={closedDays} onChange={onClosedDaysChange} />
          {errors.closedDays && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.closedDays}</p>
          )}
        </div>
      </div>
    </div>
  )
}
