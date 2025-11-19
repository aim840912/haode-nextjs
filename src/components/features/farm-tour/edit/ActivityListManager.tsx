/**
 * Activity List Manager Component
 *
 * 活動項目管理元件
 * 提供動態新增、移除、編輯活動項目的功能
 */

interface ActivityListManagerProps {
  activities: string[]
  onActivitiesChange: (activities: string[]) => void
}

export function ActivityListManager({ activities, onActivitiesChange }: ActivityListManagerProps) {
  const addActivityField = () => {
    onActivitiesChange([...activities, ''])
  }

  const removeActivityField = (index: number) => {
    onActivitiesChange(activities.filter((_, i) => i !== index))
  }

  const updateActivityField = (index: number, value: string) => {
    onActivitiesChange(activities.map((activity, i) => (i === index ? value : activity)))
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">活動內容</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
          活動項目
        </label>
        {activities.map((activity, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={activity}
              onChange={e => updateActivityField(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
              placeholder="輸入活動項目"
            />
            {activities.length > 1 && (
              <button
                type="button"
                onClick={() => removeActivityField(index)}
                className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addActivityField}
          className="mt-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
        >
          + 新增項目
        </button>
      </div>
    </div>
  )
}
