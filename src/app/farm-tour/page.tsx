'use client'

import { useState } from 'react'
import type { FarmTourActivity } from '@/types/farmTour'
import SocialLinks from '@/components/features/social/SocialLinks'
import { useAuth } from '@/contexts/AuthContext'
import { FarmTourPageLoader } from '@/components/ui/loading/PageLoader'
import { useSiteSetting } from '@/hooks/useSiteSettings'
import { SETTING_KEYS } from '@/types/siteSettings'
import { useFarmTourActivities } from './hooks/useFarmTourActivities'
import { useFarmTourForm } from './hooks/useFarmTourForm'
import { BookingModal } from './components/BookingModal'
import { ActivityCard } from './components/ActivityCard'
import {
  PartyPopper,
  Users,
  Leaf,
  Sparkles,
  Flame,
  Zap,
  Calendar,
  Banknote,
  Users2,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  Circle,
  Award,
  Star,
  CheckCircle,
  Heart,
  Clock,
  Car,
  Info,
} from 'lucide-react'

// 農場設施
const farmFacilities = [
  {
    name: '品茶亭',
    description: '傳統竹造涼亭，提供農場自產茶品品嚐',
    features: ['茶藝設備', '山景視野', '文化體驗'],
  },
  {
    name: '採果區域',
    description: '分區種植不同水果，依季節開放採摘體驗',
    features: ['紅肉李區', '季節水果', '有機栽培'],
  },
  {
    name: '停車場',
    description: '可容納30台汽車的免費停車空間',
    features: ['免費停車', '遊覽車位', '無障礙設施'],
  },
]

export default function FarmTourPage() {
  const [selectedActivity, setSelectedActivity] = useState<FarmTourActivity | null>(null)
  const [activeTab, setActiveTab] = useState('activities')
  const [showPromoBar, setShowPromoBar] = useState(true)
  const [viewCount] = useState(Math.floor(Math.random() * 200) + 300) // 模擬今日瀏覽人次
  const [todayBookings] = useState(Math.floor(Math.random() * 10) + 5) // 今日預約組數

  const { user } = useAuth()

  const { setting: heroBgSetting, loading: heroBgLoading } = useSiteSetting(
    SETTING_KEYS.FARM_TOUR_HERO_BG
  )

  const heroBackground =
    !heroBgLoading && heroBgSetting ? heroBgSetting.value : '/images/hero/farm-tour.jpg'

  // ✅ 使用 Custom Hooks
  const { seasonalActivities, loading, error } = useFarmTourActivities()
  const {
    formData,
    fieldErrors,
    isSubmitting,
    submitError,
    handleFormChange,
    handleFieldBlur,
    handleSubmit,
    resetForm,
  } = useFarmTourForm(user)

  // UI 事件處理函數
  const openBookingModal = (activity: FarmTourActivity) => {
    setSelectedActivity(activity)
  }

  const closeModal = () => {
    setSelectedActivity(null)
    resetForm() // ✅ 使用 Hook 的 resetForm
  }

  const scrollToContent = () => {
    const element = document.getElementById('content-section')
    if (element) {
      const offset = 80 // 留出頂部空間
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      })
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    // 延遲一下確保 DOM 更新
    setTimeout(() => scrollToContent(), 100)
  }

  // 載入狀態
  if (loading) {
    return <FarmTourPageLoader />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 限時優惠橫幅 */}
      {showPromoBar && (
        <div className="fixed top-[var(--header-height)] left-0 right-0 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold flex items-center gap-2">
                <PartyPopper className="w-5 h-5" />
                季節限定
              </span>
              <span className="text-sm md:text-base">
                紅肉李採果體驗 7 折優惠中！僅剩 15 個名額
              </span>
            </div>
            <button
              onClick={() => setShowPromoBar(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)] overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1f2937',
        }}
      >
        {/* 漸層遮罩確保文字可讀性 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70 z-10"></div>

        {/* 裝飾性浮動元素 */}
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        {/* Hero 內容 */}
        <div className="relative z-20 px-6">
          {/* 今日瀏覽統計 */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/30">
            <Users className="w-4 h-4 text-white/90" />
            <span className="text-sm text-white/90">今日瀏覽</span>
            <span className="text-lg font-bold text-white">{viewCount}</span>
            <span className="text-sm text-white/90">人次</span>
          </div>

          <div className="text-center max-w-7xl mx-auto mb-8">
            <h1 className="text-6xl md:text-8xl font-light text-white mb-6 drop-shadow-2xl">
              豪德觀光果園
            </h1>
            <p className="text-xl md:text-3xl text-white/95 max-w-3xl mx-auto drop-shadow-lg mb-4 font-light flex items-center justify-center gap-3">
              <Leaf className="w-8 h-8" />
              走進山間果園，體驗四季農情
            </p>
            <p className="text-lg md:text-xl text-amber-300 font-medium drop-shadow-md flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              季節限定體驗・親子同樂首選・嘉義梅山秘境
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => handleTabClick('activities')}
                className="bg-white/90 backdrop-blur-sm text-amber-900 border-2 border-white/50 px-8 py-4 rounded-full hover:bg-white/95 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                季節體驗活動
              </button>
            </div>

            {/* Management Buttons */}
            {user && user.role === 'admin' && (
              <div className="flex flex-col md:flex-row gap-3">
                <a
                  href="/admin/farm-tour"
                  className="px-6 py-3 bg-white/90 backdrop-blur-sm text-green-700 border-2 border-white/50 rounded-full text-sm hover:bg-white/95 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  果園管理
                </a>
                <a
                  href="/admin/farm-tour/add"
                  className="px-6 py-3 bg-white/90 backdrop-blur-sm text-amber-700 border-2 border-white/50 rounded-full text-sm hover:bg-white/95 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                >
                  新增體驗
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <div id="content-section" className="max-w-7xl mx-auto px-6 py-16">
        {/* Navigation Tabs */}
        <div className="flex mb-12 bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'activities'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            季節體驗活動
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'facilities'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            農場設施
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'info' ? 'bg-amber-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            參觀資訊
          </button>
        </div>

        {/* 季節體驗活動 */}
        {activeTab === 'activities' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-light text-amber-900 mb-4 md:mb-0">四季農園體驗</h2>
              <div className="flex items-center gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Circle className="w-3 h-3 text-green-600 animate-pulse fill-current" />
                  <span className="text-sm text-gray-700">
                    今日已有 <strong className="text-green-600">{todayBookings}</strong> 組預約
                  </span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">載入體驗活動中...</div>
              </div>
            ) : seasonalActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">目前沒有可預約的體驗活動</div>
                <p className="text-sm text-gray-400">敬請期待更多精彩活動</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {seasonalActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full ${!activity.available ? 'opacity-75' : ''} group`}
                  >
                    {/* Activity Header with Image */}
                    <div className="relative h-56 bg-gradient-to-r from-amber-100 to-orange-100 overflow-hidden">
                      {/* 熱門標籤 */}
                      {index === 0 && (
                        <div className="absolute top-4 left-4 z-20 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Flame className="w-4 h-4" />
                          熱門體驗
                        </div>
                      )}

                      {/* 剩餘名額提示 */}
                      {activity.available && (
                        <div className="absolute top-4 right-4 z-20 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
                          <Zap className="w-4 h-4" />
                          僅剩 {Math.floor(Math.random() * 20) + 5} 個名額
                        </div>
                      )}

                      {/* 圖片層 */}
                      {activity.image && (
                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}

                      {/* 漸層遮罩層 */}
                      {activity.image && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      )}

                      {/* 文字內容層 */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg group-hover:text-amber-300 transition-colors">
                          {activity.title}
                        </h3>
                        <div className="flex justify-center gap-3 flex-wrap">
                          <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {activity.start_month}月 - {activity.end_month}月
                          </span>
                          {Number(activity.price) > 0 && (
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm flex items-center gap-1">
                              <Banknote className="w-4 h-4" />
                              NT$ {activity.price}
                            </span>
                          )}
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                            <Users2 className="w-4 h-4" />
                            親子同樂
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex-grow">
                        {/* Note */}
                        {activity.note && (
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
                            <p className="text-amber-800 font-medium">{activity.note}</p>
                          </div>
                        )}

                        {/* Activities List */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-800 mb-3">活動內容</h4>
                          <div className="space-y-2">
                            {activity.activities.map((act, index) => (
                              <div key={index} className="flex items-center text-sm text-gray-600">
                                <Check className="w-4 h-4 mr-2 text-green-500" />
                                <span>{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional Info */}
                        {Number(activity.price) > 0 && (
                          <div className="mb-6 p-3 bg-green-50 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">
                              體驗費用：NT$ {activity.price}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Booking Button */}
                      <button
                        onClick={() => openBookingModal(activity)}
                        disabled={!activity.available}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors mt-auto ${
                          activity.available
                            ? 'bg-amber-900 text-white hover:bg-amber-800'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {activity.available ? '了解詳情' : '暫停開放'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 農場設施 */}
        {activeTab === 'facilities' && (
          <div>
            <h2 className="text-3xl font-light text-center text-amber-900 mb-12">農場設施導覽</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {farmFacilities.map((facility, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{facility.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-center">{facility.description}</p>
                  <div className="space-y-2">
                    {facility.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <span className="mr-2 text-amber-500">•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 參觀資訊 */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-amber-900 mb-6">參觀資訊</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">農場地址</h4>
                  <p className="text-gray-600">嘉義縣梅山鄉太和村一鄰八號</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">開放時間</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>週二至週日：09:00 - 17:00</p>
                    <p>週一公休（國定假日正常開放）</p>
                    <p className="text-sm text-amber-600">* 體驗活動請電話詢問</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">交通方式</h4>
                  <div className="space-y-2 text-gray-600 text-sm">
                    <p>
                      <strong>自行開車：</strong>國道4號→台3線→東關路
                    </p>
                    <p>
                      <strong>大眾運輸：</strong>台中客運→和平區→農場接駁
                    </p>
                    <p>
                      <strong>團體包車：</strong>可協助安排遊覽車接駁
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">聯絡資訊</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>詢問專線：05-2561843</p>
                    <p>LINE ID：@haudetea</p>
                    <p>信箱：tour@haudetea.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-amber-900 mb-6">參觀須知</h3>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">重要提醒</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 體驗活動請來電詢問詳情</li>
                    <li>• 團體參觀請來電洽詢</li>
                    <li>• 如遇天候不佳，活動可能調整或取消</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                  <h4 className="font-medium text-green-800 mb-2">建議攜帶</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 舒適的運動鞋或登山鞋</li>
                    <li>• 帽子和防曬用品</li>
                    <li>• 水壺（農場有飲水機）</li>
                    <li>• 相機記錄美好時光</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <h4 className="font-medium text-blue-800 mb-2">特別服務</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 免費農場導覽解說</li>
                    <li>• 團體活動客製化規劃</li>
                    <li>• 農產品宅配服務</li>
                    <li>• 企業員工旅遊包套</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  電話詢問
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all">
            {/* 緊急感橫幅 */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 animate-pulse" />
                <span className="font-bold text-sm">
                  熱門體驗！僅剩 {Math.floor(Math.random() * 15) + 5} 個名額
                </span>
              </div>
              <span className="text-xs opacity-90">{todayBookings} 組已預約</span>
            </div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-2">
                    {selectedActivity.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Circle className="w-3 h-3 text-green-500 fill-current" />
                      即時確認
                    </span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <Users2 className="w-4 h-4" />
                      適合全家
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-8 h-8 text-amber-600" />
                      <div>
                        <p className="text-xs text-gray-600">體驗期間</p>
                        <p className="font-bold text-amber-800">
                          {selectedActivity.start_month}月 - {selectedActivity.end_month}月
                        </p>
                      </div>
                    </div>
                    {Number(selectedActivity.price) > 0 && (
                      <div className="flex items-center gap-2">
                        <Banknote className="w-8 h-8 text-amber-600" />
                        <div>
                          <p className="text-xs text-gray-600">體驗費用</p>
                          <p className="font-bold text-amber-800">NT$ {selectedActivity.price}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedActivity.note && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <p className="text-amber-700 text-sm flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5" />
                        <span>{selectedActivity.note}</span>
                      </p>
                    </div>
                  )}
                </div>

                {!user && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 text-sm">
                      請先登入以提交預約詢問。
                      <a href="/login" className="underline ml-1">
                        點此登入
                      </a>
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">預約資訊</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-700 mb-1 font-medium">參觀日期 *</label>
                      <input
                        type="date"
                        value={formData.visit_date}
                        onChange={e => handleFormChange('visit_date', e.target.value)}
                        onBlur={e => handleFieldBlur('visit_date', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                          fieldErrors.visit_date
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-amber-200'
                        }`}
                        required
                      />
                      {fieldErrors.visit_date && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.visit_date}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 font-medium">參觀人數</label>
                      <select
                        value={formData.visitor_count}
                        onChange={e => handleFormChange('visitor_count', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                      >
                        <option>1人</option>
                        <option>2人</option>
                        <option>3-5人</option>
                        <option>6-10人</option>
                        <option>團體（11人以上）</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 font-medium">聯絡姓名 *</label>
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={e => handleFormChange('customer_name', e.target.value)}
                        onBlur={e => handleFieldBlur('customer_name', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                          fieldErrors.customer_name
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-amber-200'
                        }`}
                        placeholder="請輸入您的姓名"
                        required
                      />
                      {fieldErrors.customer_name && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.customer_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 font-medium">聯絡電話</label>
                      <input
                        type="tel"
                        value={formData.customer_phone}
                        onChange={e => handleFormChange('customer_phone', e.target.value)}
                        onBlur={e => handleFieldBlur('customer_phone', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                          fieldErrors.customer_phone
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-amber-200'
                        }`}
                        placeholder="選填：如 0912-345-678"
                      />
                      {fieldErrors.customer_phone && (
                        <p className="text-red-500 text-sm mt-1">{fieldErrors.customer_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-gray-700 mb-1 font-medium">Email *</label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={e => handleFormChange('customer_email', e.target.value)}
                      onBlur={e => handleFieldBlur('customer_email', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                        fieldErrors.customer_email
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-amber-200'
                      }`}
                      placeholder="請輸入有效的 Email 地址"
                      required
                    />
                    {fieldErrors.customer_email && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.customer_email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 font-medium">特殊需求或備註</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => handleFormChange('notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 text-gray-900"
                    placeholder="如有素食需求、行動不便或其他特殊需求請註明"
                  ></textarea>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => selectedActivity && handleSubmit(selectedActivity)}
                    disabled={isSubmitting || !user}
                    className="flex-1 bg-amber-900 text-white py-3 rounded-lg hover:bg-amber-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? '提交中...' : '提交預約詢問'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 社會證明區塊 */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">值得信賴的農場體驗</h2>

          {/* 認證標章 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="flex flex-col items-center text-center p-6 bg-green-50 rounded-xl">
              <Award className="w-12 h-12 mb-3 text-green-600" />
              <h3 className="font-bold text-gray-800 mb-1">有機認證</h3>
              <p className="text-sm text-gray-600">通過有機農業認證</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-amber-50 rounded-xl">
              <Star className="w-12 h-12 mb-3 text-amber-500" />
              <h3 className="font-bold text-gray-800 mb-1">觀光農場</h3>
              <p className="text-sm text-gray-600">合格觀光果園</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl">
              <CheckCircle className="w-12 h-12 mb-3 text-blue-600" />
              <h3 className="font-bold text-gray-800 mb-1">食安把關</h3>
              <p className="text-sm text-gray-600">嚴格品質控管</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-purple-50 rounded-xl">
              <Heart className="w-12 h-12 mb-3 text-purple-600" />
              <h3 className="font-bold text-gray-800 mb-1">親子友善</h3>
              <p className="text-sm text-gray-600">適合全家同樂</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ 區塊 */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">常見問題</h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  農場的開放時間是？
                </span>
                <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-4 text-gray-600">
                <p>週二至週日：09:00 - 17:00</p>
                <p>週一公休（國定假日正常開放）</p>
                <p className="mt-2 text-sm text-amber-600">※ 體驗活動請提前電話預約</p>
              </div>
            </details>

            <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-amber-600" />
                  如何前往農場？
                </span>
                <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-4 text-gray-600">
                <p className="mb-2">
                  <strong>自行開車：</strong>國道4號 → 台3線 → 東關路
                </p>
                <p className="mb-2">
                  <strong>大眾運輸：</strong>台中客運 → 和平區 → 農場接駁
                </p>
                <p>
                  <strong>團體包車：</strong>可協助安排遊覽車接駁
                </p>
              </div>
            </details>

            <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-amber-600" />
                  適合帶小孩嗎？
                </span>
                <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-4 text-gray-600">
                <p>非常適合！我們的體驗活動專為親子設計，提供：</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>安全的採果環境</li>
                  <li>適合兒童的活動設計</li>
                  <li>休息區和洗手設施</li>
                  <li>專業導覽解說</li>
                </ul>
              </div>
            </details>

            <details className="bg-white rounded-lg shadow-sm overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  費用包含哪些內容？
                </span>
                <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-4 text-gray-600">
                <p>體驗費用包含：</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>專業導覽解說</li>
                  <li>採果體驗（可帶走一定數量）</li>
                  <li>農場茶飲品嚐</li>
                  <li>免費停車</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-green-600 to-amber-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">體驗山間農情，感受自然之美</h2>
          <p className="text-green-100 mb-8 text-lg">
            歡迎來到豪德觀光果園，在這裡您可以親近土地、體驗農作、品味自然
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <a
              href="tel:05-2561843"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              電話詢問
            </a>
            <a
              href="https://line.me/R/ti/p/@haudetea"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              LINE 諮詢
            </a>
            <button
              onClick={() => handleTabClick('info')}
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              查看地圖
            </button>
          </div>
        </div>
      </div>

      {/* 浮動 CTA 按鈕 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a
          href="tel:05-2561843"
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
          title="電話詢問"
        >
          <Phone className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 group-hover:ml-2 whitespace-nowrap">
            立即撥打
          </span>
        </a>
        <a
          href="https://line.me/R/ti/p/@haudetea"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#06C755] hover:bg-[#05b34c] text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
          title="LINE 諮詢"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 group-hover:ml-2 whitespace-nowrap">
            LINE 諮詢
          </span>
        </a>
      </div>
    </div>
  )
}
