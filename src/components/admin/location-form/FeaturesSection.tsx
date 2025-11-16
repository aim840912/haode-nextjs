interface FeaturesSectionProps {
  features: string[]
  onFeatureUpdate: (index: number, value: string) => void
  onFeatureAdd: () => void
  onFeatureRemove: (index: number) => void
  errors?: Record<string, string>
}

export function FeaturesSection({
  features,
  onFeatureUpdate,
  onFeatureAdd,
  onFeatureRemove,
  errors = {},
}: FeaturesSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">門市特色</h2>
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={feature}
              onChange={e => onFeatureUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
              placeholder="例如：提供試吃服務"
            />
            {features.length > 1 && (
              <button
                type="button"
                onClick={() => onFeatureRemove(index)}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                刪除
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onFeatureAdd}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
        >
          + 新增特色
        </button>
        {errors.features && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.features}</p>
        )}
      </div>
    </div>
  )
}
