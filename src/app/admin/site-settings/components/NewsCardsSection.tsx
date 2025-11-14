import { Newspaper } from 'lucide-react'
import { SectionProps } from './types'

export function NewsCardsSection({ state, actions }: SectionProps) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Newspaper className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">首頁最新消息卡片設定</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        管理首頁「最新消息」區域的當季推薦和農場活動卡片內容
      </p>

      <div className="space-y-8">
        {/* 當季推薦卡片 */}
        <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            1. 當季推薦卡片
          </h3>

          <div className="space-y-4">
            {/* 啟用/停用 */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.newsSeasonalRecommendationEnabled === 'true'}
                  onChange={e => {
                    actions.loadAllSettings({
                      newsSeasonalRecommendationEnabled: e.target.checked ? 'true' : 'false',
                    })
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  啟用此卡片
                </span>
              </label>
            </div>

            {/* 標題 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                卡片標題
              </label>
              <input
                type="text"
                value={state.newsSeasonalRecommendationTitle}
                onChange={e =>
                  actions.loadAllSettings({ newsSeasonalRecommendationTitle: e.target.value })
                }
                placeholder="當季推薦"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            {/* 圖示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                卡片圖示
              </label>
              <select
                value={state.newsSeasonalRecommendationIcon}
                onChange={e =>
                  actions.loadAllSettings({ newsSeasonalRecommendationIcon: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              >
                <option value="sprout">Sprout (新芽)</option>
                <option value="apple">Apple (蘋果)</option>
                <option value="wheat">Wheat (小麥)</option>
                <option value="leaf">Leaf (葉子)</option>
              </select>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                卡片描述
              </label>
              <textarea
                value={state.newsSeasonalRecommendationDescription}
                onChange={e =>
                  actions.loadAllSettings({
                    newsSeasonalRecommendationDescription: e.target.value,
                  })
                }
                placeholder="春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            {/* 連結 URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                連結 URL
              </label>
              <input
                type="text"
                value={state.newsSeasonalRecommendationLinkUrl}
                onChange={e =>
                  actions.loadAllSettings({
                    newsSeasonalRecommendationLinkUrl: e.target.value,
                  })
                }
                placeholder="/products"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            {/* 連結文字 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                連結文字
              </label>
              <input
                type="text"
                value={state.newsSeasonalRecommendationLinkText}
                onChange={e =>
                  actions.loadAllSettings({
                    newsSeasonalRecommendationLinkText: e.target.value,
                  })
                }
                placeholder="查看產品 →"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* 農場活動卡片 */}
        <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            2. 農場活動卡片
          </h3>

          <div className="space-y-4">
            {/* 啟用/停用 */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.newsFarmActivityEnabled === 'true'}
                  onChange={e => {
                    actions.loadAllSettings({
                      newsFarmActivityEnabled: e.target.checked ? 'true' : 'false',
                    })
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  啟用此卡片
                </span>
              </label>
            </div>

            {/* 標題 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                卡片標題
              </label>
              <input
                type="text"
                value={state.newsFarmActivityTitle}
                onChange={e => actions.loadAllSettings({ newsFarmActivityTitle: e.target.value })}
                placeholder="農場活動"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            {/* 圖示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                卡片圖示
              </label>
              <select
                value={state.newsFarmActivityIcon}
                onChange={e => actions.loadAllSettings({ newsFarmActivityIcon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              >
                <option value="party-popper">Party Popper (慶祝)</option>
                <option value="calendar">Calendar (日曆)</option>
                <option value="users">Users (使用者)</option>
                <option value="sparkles">Sparkles (閃亮)</option>
              </select>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                卡片描述
              </label>
              <textarea
                value={state.newsFarmActivityDescription}
                onChange={e =>
                  actions.loadAllSettings({ newsFarmActivityDescription: e.target.value })
                }
                placeholder="週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            {/* 連結 URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                連結 URL
              </label>
              <input
                type="text"
                value={state.newsFarmActivityLinkUrl}
                onChange={e => actions.loadAllSettings({ newsFarmActivityLinkUrl: e.target.value })}
                placeholder="/farm-tour"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            {/* 連結文字 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                連結文字
              </label>
              <input
                type="text"
                value={state.newsFarmActivityLinkText}
                onChange={e =>
                  actions.loadAllSettings({ newsFarmActivityLinkText: e.target.value })
                }
                placeholder="立即預約 →"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* 提示訊息 */}
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-600 rounded-r-lg">
          <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">💡 使用提示</h4>
          <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
            <li>• 取消勾選「啟用此卡片」可隱藏該卡片</li>
            <li>• 圖示選項會影響卡片左上角顯示的 SVG 圖示</li>
            <li>• 修改後請點擊上方「儲存變更」按鈕</li>
            <li>• 儲存後首頁會立即更新顯示</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
