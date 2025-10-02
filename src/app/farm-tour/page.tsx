'use client'

import { useState } from 'react'
import type { FarmTourActivity } from '@/types/farmTour'
import { useAuth } from '@/contexts/AuthContext'
import { FarmTourPageLoader } from '@/components/ui/loading/PageLoader'
import { useSiteSetting } from '@/hooks/useSiteSettings'
import { SETTING_KEYS } from '@/types/siteSettings'
import { useFarmTourActivities } from './hooks/useFarmTourActivities'
import { useFarmTourForm } from './hooks/useFarmTourForm'
import { BookingModal } from './components/BookingModal'
import { PromoBar } from './components/PromoBar'
import { HeroSection } from './components/HeroSection'
import { ActivitiesSection } from './components/ActivitiesSection'
import { FacilitiesSection } from './components/FacilitiesSection'
import { InfoSection } from './components/InfoSection'
import { TrustSection } from './components/TrustSection'
import { FAQSection } from './components/FAQSection'
import { ContactCTA } from './components/ContactCTA'
import { FloatingCTA } from './components/FloatingCTA'

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
    validateAllFields,
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
      <PromoBar show={showPromoBar} onClose={() => setShowPromoBar(false)} />

      {/* Hero Section */}
      <HeroSection
        heroBackground={heroBackground}
        viewCount={viewCount}
        onActivityClick={() => handleTabClick('activities')}
        isAdmin={user?.role === 'admin'}
      />

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
          <ActivitiesSection
            activities={seasonalActivities}
            loading={loading}
            todayBookings={todayBookings}
            onActivityClick={openBookingModal}
          />
        )}

        {/* 農場設施 */}
        {activeTab === 'facilities' && <FacilitiesSection facilities={farmFacilities} />}

        {/* 參觀資訊 */}
        {activeTab === 'info' && <InfoSection />}
      </div>

      {/* Booking Modal */}
      {selectedActivity && (
        <BookingModal
          activity={selectedActivity}
          user={user}
          formData={formData}
          fieldErrors={fieldErrors}
          todayBookings={todayBookings}
          onClose={closeModal}
          onFormChange={handleFormChange}
          onFieldBlur={handleFieldBlur}
          validateAllFields={validateAllFields}
        />
      )}

      {/* 社會證明區塊 */}
      <TrustSection />

      {/* FAQ 區塊 */}
      <FAQSection />

      {/* Contact CTA */}
      <ContactCTA onMapClick={() => handleTabClick('info')} />

      {/* 浮動 CTA 按鈕 */}
      <FloatingCTA />
    </div>
  )
}
