import TimePickerChinese from '@/components/ui/form/TimePickerChinese'
import { formatTimeRange } from '../hooks/useScheduleData'

interface FormData {
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed'
  products: string[]
  description: string
  contact: string
  specialOffer: string
  weatherNote: string
}

interface TimeRange {
  startTime: string
  endTime: string
}

interface ScheduleTimeSelectorProps {
  formData: FormData
  timeRange: TimeRange
  errors: Record<string, string>
  touched: Record<string, boolean>
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleBlur: (fieldName: string) => void
  handleTimeChange: (timeType: 'startTime' | 'endTime', value: string) => void
}

export default function ScheduleTimeSelector({
  formData,
  timeRange,
  errors,
  touched,
  handleInputChange,
  handleBlur,
  handleTimeChange,
}: ScheduleTimeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">日期 *</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          onBlur={() => handleBlur('date')}
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 ${
            touched.date && errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {touched.date && errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">開始時間 *</label>
        <div onBlur={() => handleBlur('startTime')}>
          <TimePickerChinese
            value={timeRange.startTime}
            onChange={time => handleTimeChange('startTime', time)}
            required
            className="w-full"
          />
        </div>
        {touched.startTime && errors.startTime && (
          <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">結束時間 *</label>
        <div onBlur={() => handleBlur('endTime')}>
          <TimePickerChinese
            value={timeRange.endTime}
            onChange={time => handleTimeChange('endTime', time)}
            required
            className="w-full"
          />
        </div>
        {touched.endTime && errors.endTime && (
          <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
        )}
        {timeRange.startTime && timeRange.endTime && !errors.endTime && (
          <div className="mt-2 text-sm text-gray-600">
            時間範圍：{formatTimeRange(timeRange.startTime, timeRange.endTime)}
          </div>
        )}
      </div>
    </div>
  )
}
