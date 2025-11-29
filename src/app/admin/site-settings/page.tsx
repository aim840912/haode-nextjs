'use client'

import { useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { Save, RefreshCw, ArrowLeft } from 'lucide-react'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { useLoadingManager } from '@/hooks/useLoadingManager'
import { useSiteSettingsReducer } from '@/hooks/useSiteSettingsReducer'
import { fetchAllSiteSettings } from '@/lib/api/site-settings-api'
import { upsertSiteSettingsBatchAction } from '@/app/actions/site-settings'
import { SETTING_KEYS, type SettingType } from '@/types/siteSettings'
import { FarmTourBackgroundSection } from './components/FarmTourBackgroundSection'
import { FarmTourFAQSection } from './components/FarmTourFAQSection'
import { FeatureCardsSection } from './components/FeatureCardsSection'
import { HomeHeroSection } from './components/HomeHeroSection'
import { NewsCardsSection } from './components/NewsCardsSection'
import { SeasonImagesSection } from './components/SeasonImagesSection'

interface Setting {
  key: string
  value: string
  type: string
  description: string | null
}

/**
 * 清理和驗證圖片 URL
 * - 移除轉義字元
 * - 驗證 URL 格式
 * - 返回有效 URL 或空字串
 */
function cleanImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''

  // 移除轉義字元
  let cleaned = url.replace(/\\/g, '')

  // 移除前後空白
  cleaned = cleaned.trim()

  // 驗證格式：必須以 / 或 http 開頭
  if (cleaned.startsWith('/') || cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned
  }

  // 無效格式返回空字串
  return ''
}

export default function SiteSettingsPage() {
  // ✅ 使用 useReducer 替換 17 個 useState
  const { state, actions } = useSiteSettingsReducer()
  const [isPending, startTransition] = useTransition()

  // 使用 useLoadingManager 管理載入狀態
  const { isLoading: loading, execute } = useLoadingManager({
    module: 'SiteSettingsPage',
    initialLoading: true,
  })

  const loadSettings = useCallback(async () => {
    await execute(
      async () => {
        const data = await fetchAllSiteSettings()

        const settingsMap: Record<string, Setting> = {}
        data.forEach((setting: Setting) => {
          settingsMap[setting.key] = setting
        })

        // 準備要載入的設定
        const settingsToLoad: Record<string, unknown> = {}

        // 首頁輪播圖片
        if (settingsMap[SETTING_KEYS.HOME_HERO_IMAGES]) {
          try {
            const images = JSON.parse(settingsMap[SETTING_KEYS.HOME_HERO_IMAGES].value)
            const cleanedImages = (Array.isArray(images) ? images : [])
              .map(cleanImageUrl)
              .filter(Boolean)
            settingsToLoad.homeHeroImages = cleanedImages
          } catch {
            settingsToLoad.homeHeroImages = []
          }
        }

        // 農場導覽背景
        if (settingsMap[SETTING_KEYS.FARM_TOUR_HERO_BG]) {
          settingsToLoad.farmTourHeroBg = cleanImageUrl(
            settingsMap[SETTING_KEYS.FARM_TOUR_HERO_BG].value
          )
        }

        // 特色卡片圖片
        if (settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE]) {
          settingsToLoad.featureCard1Image = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE].value
          )
        }
        if (settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE]) {
          settingsToLoad.featureCard2Image = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE].value
          )
        }
        if (settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE]) {
          settingsToLoad.featureCard3Image = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE].value
          )
        }
        if (settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE]) {
          settingsToLoad.featureCard4Image = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE].value
          )
        }

        // 季節圖片
        if (settingsMap[SETTING_KEYS.HOME_SEASON_SPRING_IMAGE]) {
          settingsToLoad.seasonSpringImage = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_SEASON_SPRING_IMAGE].value
          )
        }
        if (settingsMap[SETTING_KEYS.HOME_SEASON_SUMMER_IMAGE]) {
          settingsToLoad.seasonSummerImage = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_SEASON_SUMMER_IMAGE].value
          )
        }
        if (settingsMap[SETTING_KEYS.HOME_SEASON_AUTUMN_IMAGE]) {
          settingsToLoad.seasonAutumnImage = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_SEASON_AUTUMN_IMAGE].value
          )
        }
        if (settingsMap[SETTING_KEYS.HOME_SEASON_WINTER_IMAGE]) {
          settingsToLoad.seasonWinterImage = cleanImageUrl(
            settingsMap[SETTING_KEYS.HOME_SEASON_WINTER_IMAGE].value
          )
        }

        // 載入農場導覽內容
        if (settingsMap[SETTING_KEYS.FARM_TOUR_FACILITIES]) {
          settingsToLoad.farmFacilities = settingsMap[SETTING_KEYS.FARM_TOUR_FACILITIES].value
        }
        if (settingsMap[SETTING_KEYS.FARM_TOUR_FAQS]) {
          settingsToLoad.farmFaqs = settingsMap[SETTING_KEYS.FARM_TOUR_FAQS].value
        }
        if (settingsMap[SETTING_KEYS.FARM_TOUR_VISIT_INFO]) {
          settingsToLoad.farmVisitInfo = settingsMap[SETTING_KEYS.FARM_TOUR_VISIT_INFO].value
        }
        if (settingsMap[SETTING_KEYS.FARM_TOUR_VISIT_NOTES]) {
          settingsToLoad.farmVisitNotes = settingsMap[SETTING_KEYS.FARM_TOUR_VISIT_NOTES].value
        }

        // 載入首頁最新消息 - 當季推薦卡片
        if (settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED]) {
          settingsToLoad.newsSeasonalRecommendationEnabled =
            settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE]) {
          settingsToLoad.newsSeasonalRecommendationTitle =
            settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON]) {
          settingsToLoad.newsSeasonalRecommendationIcon =
            settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION]) {
          settingsToLoad.newsSeasonalRecommendationDescription =
            settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL]) {
          settingsToLoad.newsSeasonalRecommendationLinkUrl =
            settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT]) {
          settingsToLoad.newsSeasonalRecommendationLinkText =
            settingsMap[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT].value
        }

        // 載入首頁最新消息 - 農場活動卡片
        if (settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED]) {
          settingsToLoad.newsFarmActivityEnabled =
            settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE]) {
          settingsToLoad.newsFarmActivityTitle =
            settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON]) {
          settingsToLoad.newsFarmActivityIcon =
            settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION]) {
          settingsToLoad.newsFarmActivityDescription =
            settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL]) {
          settingsToLoad.newsFarmActivityLinkUrl =
            settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL].value
        }
        if (settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT]) {
          settingsToLoad.newsFarmActivityLinkText =
            settingsMap[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT].value
        }

        // 一次性載入所有設定
        actions.loadAllSettings(settingsToLoad)
      },
      {
        logAction: 'loadSettings',
        onError: err => actions.showMessage('error', err.message),
      }
    )
  }, [execute, actions])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    actions.setSaving(true)
    startTransition(async () => {
      try {
        const updates: Array<{ key: string; value: string; type: SettingType }> = [
          {
            key: SETTING_KEYS.HOME_HERO_IMAGES,
            value: JSON.stringify(state.homeHeroImages),
            type: 'json' as SettingType,
          },
          {
            key: SETTING_KEYS.FARM_TOUR_HERO_BG,
            value: state.farmTourHeroBg,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE,
            value: state.featureCard1Image,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE,
            value: state.featureCard2Image,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE,
            value: state.featureCard3Image,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE,
            value: state.featureCard4Image,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_SEASON_SPRING_IMAGE,
            value: state.seasonSpringImage,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_SEASON_SUMMER_IMAGE,
            value: state.seasonSummerImage,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_SEASON_AUTUMN_IMAGE,
            value: state.seasonAutumnImage,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_SEASON_WINTER_IMAGE,
            value: state.seasonWinterImage,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.FARM_TOUR_FACILITIES,
            value: state.farmFacilities,
            type: 'json' as SettingType,
          },
          {
            key: SETTING_KEYS.FARM_TOUR_FAQS,
            value: state.farmFaqs,
            type: 'json' as SettingType,
          },
          {
            key: SETTING_KEYS.FARM_TOUR_VISIT_INFO,
            value: state.farmVisitInfo,
            type: 'json' as SettingType,
          },
          {
            key: SETTING_KEYS.FARM_TOUR_VISIT_NOTES,
            value: state.farmVisitNotes,
            type: 'json' as SettingType,
          },
          // 首頁最新消息 - 當季推薦卡片
          {
            key: SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED,
            value: state.newsSeasonalRecommendationEnabled,
            type: 'boolean' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE,
            value: state.newsSeasonalRecommendationTitle,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON,
            value: state.newsSeasonalRecommendationIcon,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION,
            value: state.newsSeasonalRecommendationDescription,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL,
            value: state.newsSeasonalRecommendationLinkUrl,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT,
            value: state.newsSeasonalRecommendationLinkText,
            type: 'string' as SettingType,
          },
          // 首頁最新消息 - 農場活動卡片
          {
            key: SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED,
            value: state.newsFarmActivityEnabled,
            type: 'boolean' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE,
            value: state.newsFarmActivityTitle,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON,
            value: state.newsFarmActivityIcon,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION,
            value: state.newsFarmActivityDescription,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL,
            value: state.newsFarmActivityLinkUrl,
            type: 'string' as SettingType,
          },
          {
            key: SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT,
            value: state.newsFarmActivityLinkText,
            type: 'string' as SettingType,
          },
        ].filter(update => update.value && update.value.trim() !== '' && update.value !== '[]')

        // 使用 Server Action 批次儲存
        const result = await upsertSiteSettingsBatchAction(updates)

        if (result.success) {
          actions.showMessage('success', result.message || '設定已成功儲存')
          await loadSettings()
        } else {
          actions.showMessage('error', result.error?.message || '儲存失敗')
        }
      } catch (err) {
        actions.showMessage('error', err instanceof Error ? err.message : '儲存失敗')
      } finally {
        actions.setSaving(false)
      }
    })
  }

  if (loading) {
    return (
      <AdminProtection>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">載入設定中...</p>
          </div>
        </div>
      </AdminProtection>
    )
  }

  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    網站設定管理
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    管理首頁和農場體驗頁的圖片
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={loadSettings}
                  disabled={state.saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>重新載入</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={state.saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{state.saving ? '儲存中...' : '儲存變更'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {state.message && (
          <div className="max-w-7xl mx-auto px-6 pt-4">
            <div
              className={`rounded-lg p-4 ${
                state.message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {state.message.text}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <HomeHeroSection state={state} actions={actions} />
          <FarmTourBackgroundSection state={state} actions={actions} />
          <FarmTourFAQSection state={state} actions={actions} />
          <FeatureCardsSection state={state} actions={actions} />
          <SeasonImagesSection state={state} actions={actions} />
          <NewsCardsSection state={state} actions={actions} />
        </div>
      </div>
    </AdminProtection>
  )
}
