/**
 * FacilitiesSection 元件
 *
 * 顯示農場設施導覽資訊
 */

interface Facility {
  name: string
  description: string
  features: string[]
}

interface FacilitiesSectionProps {
  /** 農場設施列表 */
  facilities: Facility[]
}

export function FacilitiesSection({ facilities }: FacilitiesSectionProps) {
  return (
    <div>
      <h2 className="text-3xl font-light text-center text-amber-900 dark:text-amber-300 mb-12">
        農場設施導覽
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {facilities.map((facility, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {facility.name}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
              {facility.description}
            </p>
            <div className="space-y-2">
              {facility.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                >
                  <span className="mr-2 text-amber-500 dark:text-amber-400">•</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
