'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Save, RefreshCw, Home, Leaf, ArrowLeft } from 'lucide-react'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { ImageUploader, SingleImageUploader } from '@/components/features/products/ImageUploader'
import { useLoadingManager } from '@/hooks/useLoadingManager'
import { useSiteSettingsReducer } from '@/hooks/useSiteSettingsReducer'
import { fetchAllSiteSettings, upsertSiteSetting } from '@/lib/api/site-settings-api'
import { SETTING_KEYS, type SettingType } from '@/types/siteSettings'

interface UploadedImage {
  url?: string
  preview?: string
  storage_url?: string
}

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
        const settingsToLoad: Record<string, any> = {}

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

  const handleAddHomeHeroImage = (images: UploadedImage[]) => {
    // 從上傳的圖片中提取 URL
    const newUrls = images
      .map(img => img.url || img.preview || img.storage_url)
      .filter(Boolean) as string[]

    newUrls.forEach(url => actions.addHomeHeroImage(url))
  }

  const handleRemoveHomeHeroImage = (index: number) => {
    actions.removeHomeHeroImage(index)
  }

  const handleFarmTourBgUpload = (image: UploadedImage) => {
    // 從上傳的圖片中提取 URL
    const imageUrl = image.url || image.preview || image.storage_url
    if (imageUrl) {
      actions.setFarmTourHeroBg(imageUrl)
    }
  }

  const handleFarmTourBgDelete = () => {
    actions.setFarmTourHeroBg('')
  }

  const handleSave = async () => {
    actions.setSaving(true)
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
      ].filter(update => update.value && update.value.trim() !== '' && update.value !== '[]')

      for (const update of updates) {
        await upsertSiteSetting(update.key, { value: update.value, type: update.type })
      }

      actions.showMessage('success', '設定已成功儲存')
      await loadSettings()
    } catch (err) {
      actions.showMessage('error', err instanceof Error ? err.message : '儲存失敗')
    } finally {
      actions.setSaving(false)
    }
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
          {/* 首頁設定 */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Home className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">首頁輪播圖片</h2>
            </div>

            <div className="space-y-6">
              <ImageUploader
                productId="home-hero"
                module="site-settings"
                onUploadSuccess={handleAddHomeHeroImage}
                onUploadError={error => actions.showMessage('error', error)}
                maxFiles={10}
                allowMultiple={true}
                generateMultipleSizes={false}
                enableCompression={true}
                initialImages={state.homeHeroImages}
                onDeleteInitialImage={url => {
                  const index = state.homeHeroImages.indexOf(url)
                  if (index > -1) {
                    handleRemoveHomeHeroImage(index)
                  }
                }}
              />

              {state.homeHeroImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>尚未新增任何輪播圖片</p>
                  <p className="text-sm mt-1">建議新增 3-5 張圖片，支援拖放上傳</p>
                </div>
              )}
            </div>
          </section>

          {/* 農場體驗頁設定 */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Leaf className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                農場體驗頁面背景圖片
              </h2>
            </div>

            <SingleImageUploader
              productId="farm-tour-hero-bg"
              module="site-settings"
              initialImage={state.farmTourHeroBg}
              onUploadSuccess={handleFarmTourBgUpload}
              onUploadError={error => actions.showMessage('error', error)}
              onDelete={handleFarmTourBgDelete}
              enableDelete={true}
            />

            {state.farmTourHeroBg && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">當前圖片路徑：</p>
                <p className="text-sm text-gray-800 break-all mt-1">{state.farmTourHeroBg}</p>
              </div>
            )}
          </section>

          {/* 農場特色卡片背面圖片設定 */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Leaf className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                農場特色卡片背面圖片
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              管理首頁「農場特色」區域翻轉卡片背面的圖片
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 自然農法卡片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">1. 自然農法</h3>
                <SingleImageUploader
                  productId="feature-card-1"
                  module="site-settings"
                  initialImage={state.featureCard1Image}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setFeatureCardImage(1, imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setFeatureCardImage(1, '')}
                  enableDelete={true}
                />
              </div>

              {/* 品質認證卡片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">2. 品質認證</h3>
                <SingleImageUploader
                  productId="feature-card-2"
                  module="site-settings"
                  initialImage={state.featureCard2Image}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setFeatureCardImage(2, imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setFeatureCardImage(2, '')}
                  enableDelete={true}
                />
              </div>

              {/* 農場體驗卡片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">3. 農場體驗</h3>
                <SingleImageUploader
                  productId="feature-card-3"
                  module="site-settings"
                  initialImage={state.featureCard3Image}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setFeatureCardImage(3, imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setFeatureCardImage(3, '')}
                  enableDelete={true}
                />
              </div>

              {/* 永續經營卡片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">4. 永續經營</h3>
                <SingleImageUploader
                  productId="feature-card-4"
                  module="site-settings"
                  initialImage={state.featureCard4Image}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setFeatureCardImage(4, imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setFeatureCardImage(4, '')}
                  enableDelete={true}
                />
              </div>
            </div>
          </section>

          {/* 四季體驗圖片設定 */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Leaf className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">四季體驗圖片</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              管理首頁「四季體驗」區域的季節圖片
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 春季賞花圖片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">1. 春季賞花</h3>
                <SingleImageUploader
                  productId="season-spring"
                  module="site-settings"
                  initialImage={state.seasonSpringImage}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setSeasonImage('spring', imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setSeasonImage('spring', '')}
                  enableDelete={true}
                />
              </div>

              {/* 夏日採果圖片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">2. 夏日採果</h3>
                <SingleImageUploader
                  productId="season-summer"
                  module="site-settings"
                  initialImage={state.seasonSummerImage}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setSeasonImage('summer', imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setSeasonImage('summer', '')}
                  enableDelete={true}
                />
              </div>

              {/* 秋收體驗圖片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">3. 秋收體驗</h3>
                <SingleImageUploader
                  productId="season-autumn"
                  module="site-settings"
                  initialImage={state.seasonAutumnImage}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setSeasonImage('autumn', imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setSeasonImage('autumn', '')}
                  enableDelete={true}
                />
              </div>

              {/* 冬日品茶圖片 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">4. 冬日品茶</h3>
                <SingleImageUploader
                  productId="season-winter"
                  module="site-settings"
                  initialImage={state.seasonWinterImage}
                  onUploadSuccess={image => {
                    const imageUrl = image.url || image.preview || image.storage_url
                    if (imageUrl) actions.setSeasonImage('winter', imageUrl)
                  }}
                  onUploadError={error => actions.showMessage('error', error)}
                  onDelete={() => actions.setSeasonImage('winter', '')}
                  enableDelete={true}
                />
              </div>
            </div>
          </section>

          {/* 農場導覽內容設定 */}
          <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Leaf className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                農場導覽內容管理
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              管理農場體驗頁面的設施、常見問題、參觀資訊等內容（JSON 格式）
            </p>

            <div className="space-y-6">
              {/* 農場設施 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">1. 農場設施</h3>
                <p className="text-sm text-gray-500 mb-2">
                  設施陣列，每個設施包含 name, description, features 欄位
                </p>
                <textarea
                  value={state.farmFacilities}
                  onChange={e => actions.setFarmContent('facilities', e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='[{"name":"品茶亭","description":"傳統竹造涼亭","features":["茶藝設備","山景視野"]}]'
                />
              </div>

              {/* 常見問題 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">2. 常見問題</h3>
                <p className="text-sm text-gray-500 mb-2">
                  FAQ 陣列，每個問題包含 question, answer, icon (clock/car/users/banknote) 欄位
                </p>
                <textarea
                  value={state.farmFaqs}
                  onChange={e => actions.setFarmContent('faqs', e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='[{"question":"農場的開放時間是？","answer":"週二至週日...","icon":"clock"}]'
                />
              </div>

              {/* 參觀資訊 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">3. 參觀資訊</h3>
                <p className="text-sm text-gray-500 mb-2">
                  包含 address, opening_hours, transportation, contact 欄位的物件
                </p>
                <textarea
                  value={state.farmVisitInfo}
                  onChange={e => actions.setFarmContent('visitInfo', e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='{"address":"嘉義縣梅山鄉...","opening_hours":{...},"transportation":[...],"contact":{...}}'
                />
              </div>

              {/* 參觀須知 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">4. 參觀須知</h3>
                <p className="text-sm text-gray-500 mb-2">
                  包含 important, recommended_items, special_services 三個陣列欄位的物件
                </p>
                <textarea
                  value={state.farmVisitNotes}
                  onChange={e => actions.setFarmContent('visitNotes', e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='{"important":[...],"recommended_items":[...],"special_services":[...]}'
                />
              </div>

              {/* 提示訊息 */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 編輯提示</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 請確保 JSON 格式正確，可使用線上 JSON 驗證工具檢查</li>
                  <li>• 修改後請點擊上方「儲存變更」按鈕</li>
                  <li>• 儲存後前台頁面會立即更新</li>
                  <li>• 換行使用 \n 表示（如 FAQ 答案中）</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminProtection>
  )
}
