interface SpecialtiesSectionProps {
  specialties: string[]
  onSpecialtyUpdate: (index: number, value: string) => void
  onSpecialtyAdd: () => void
  onSpecialtyRemove: (index: number) => void
  errors?: Record<string, string>
}

export function SpecialtiesSection({
  specialties,
  onSpecialtyUpdate,
  onSpecialtyAdd,
  onSpecialtyRemove,
  errors = {},
}: SpecialtiesSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">特色產品</h2>
      <div className="space-y-3">
        {specialties.map((specialty, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={specialty}
              onChange={e => onSpecialtyUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
              placeholder="例如：梅山紅肉李"
            />
            {specialties.length > 1 && (
              <button
                type="button"
                onClick={() => onSpecialtyRemove(index)}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                刪除
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onSpecialtyAdd}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
        >
          + 新增產品
        </button>
        {errors.specialties && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.specialties}</p>
        )}
      </div>
    </div>
  )
}
