'use client'

import { useState, useMemo } from 'react'
import { FarmTourPageLoader } from '@/components/ui/loading/PageLoader'
import { useAuth } from '@/contexts/AuthContext'
import { useFarmTourActivities } from '@/hooks/farm-tour/useFarmTourActivities'
import { useFarmTourForm } from '@/hooks/farm-tour/useFarmTourForm'
import { useSiteSetting } from '@/hooks/useSiteSettings'
import type { FarmTourActivity } from '@/types/farmTour'
import {
  SETTING_KEYS,
  type FacilityItem,
  type FAQItem,
  type VisitInfoData,
  type VisitNotesData,
} from '@/types/siteSettings'
import { ActivitiesSection } from './components/ActivitiesSection'
import { BookingModal } from './components/BookingModal'
import { ContactCTA } from './components/ContactCTA'
import { FacilitiesSection } from './components/FacilitiesSection'
import { FAQSection } from './components/FAQSection'
import { FloatingCTA } from './components/FloatingCTA'
import { HeroSection } from './components/HeroSection'
import { InfoSection } from './components/InfoSection'
import { TrustSection } from './components/TrustSection'

// 預設農場設施（向下相容）
const DEFAULT_FACILITIES: FacilityItem[] = [
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

// 預設常見問題（向下相容）
const DEFAULT_FAQS: FAQItem[] = [
  {
    question: '農場的開放時間是？',
    answer: '週二至週日：09:00 - 17:00\n週一公休（國定假日正常開放）\n※ 體驗活動請提前電話預約',
    icon: 'clock',
  },
  {
    question: '如何前往農場？',
    answer:
      '自行開車：國道4號 → 台3線 → 東關路\n大眾運輸：台中客運 → 和平區 → 農場接駁\n團體包車：可協助安排遊覽車接駁',
    icon: 'car',
  },
  {
    question: '適合帶小孩嗎？',
    answer:
      '非常適合！我們的體驗活動專為親子設計，提供：\n• 安全的採果環境\n• 適合兒童的活動設計\n• 休息區和洗手設施\n• 專業導覽解說',
    icon: 'users',
  },
  {
    question: '費用包含哪些內容？',
    answer:
      '體驗費用包含：\n• 專業導覽解說\n• 採果體驗（可帶走一定數量）\n• 農場茶飲品嚐\n• 免費停車',
    icon: 'banknote',
  },
]

// 預設參觀資訊（向下相容）
const DEFAULT_VISIT_INFO: VisitInfoData = {
  address: '嘉義縣梅山鄉太和村一鄰八號',
  opening_hours: {
    weekdays: '週二至週日：09:00 - 17:00',
    closed: '週一公休（國定假日正常開放）',
    note: '* 體驗活動請電話詢問',
  },
  transportation: [
    { type: '自行開車', route: '國道4號→台3線→東關路' },
    { type: '大眾運輸', route: '台中客運→和平區→農場接駁' },
    { type: '團體包車', route: '可協助安排遊覽車接駁' },
  ],
  contact: {
    phone: '05-2561843',
    line: '@haudetea',
    email: 'tour@haudetea.com',
  },
}

// 預設參觀須知（向下相容）
const DEFAULT_VISIT_NOTES: VisitNotesData = {
  important: ['體驗活動請來電詢問詳情', '團體參觀請來電洽詢', '如遇天候不佳，活動可能調整或取消'],
  recommended_items: [
    '舒適的運動鞋或登山鞋',
    '帽子和防曬用品',
    '水壺（農場有飲水機）',
    '相機記錄美好時光',
  ],
  special_services: [
    '免費農場導覽解說',
    '團體活動客製化規劃',
    '農產品宅配服務',
    '企業員工旅遊包套',
  ],
}

export default function FarmTourPage() {
  const [selectedActivity, setSelectedActivity] = useState<FarmTourActivity | null>(null)
  const [activeTab, setActiveTab] = useState('activities')

  const { user } = useAuth()

  // 載入 Hero 背景圖片
  const { setting: heroBgSetting, loading: heroBgLoading } = useSiteSetting(
    SETTING_KEYS.FARM_TOUR_HERO_BG
  )

  // 載入農場設施
  const { setting: facilitiesSetting } = useSiteSetting(SETTING_KEYS.FARM_TOUR_FACILITIES)

  // 載入常見問題
  const { setting: faqsSetting } = useSiteSetting(SETTING_KEYS.FARM_TOUR_FAQS)

  // 載入參觀資訊
  const { setting: visitInfoSetting } = useSiteSetting(SETTING_KEYS.FARM_TOUR_VISIT_INFO)

  // 載入參觀須知
  const { setting: visitNotesSetting } = useSiteSetting(SETTING_KEYS.FARM_TOUR_VISIT_NOTES)

  const heroBackground =
    !heroBgLoading && heroBgSetting ? heroBgSetting.value : '/images/hero/farm-tour.jpg'

  // 解析 JSON 資料並提供預設值
  const facilities = useMemo<FacilityItem[]>(() => {
    if (!facilitiesSetting?.value) return DEFAULT_FACILITIES
    try {
      return JSON.parse(facilitiesSetting.value)
    } catch {
      return DEFAULT_FACILITIES
    }
  }, [facilitiesSetting])

  const faqs = useMemo<FAQItem[]>(() => {
    if (!faqsSetting?.value) return DEFAULT_FAQS
    try {
      return JSON.parse(faqsSetting.value)
    } catch {
      return DEFAULT_FAQS
    }
  }, [faqsSetting])

  const visitInfo = useMemo<VisitInfoData>(() => {
    if (!visitInfoSetting?.value) return DEFAULT_VISIT_INFO
    try {
      return JSON.parse(visitInfoSetting.value)
    } catch {
      return DEFAULT_VISIT_INFO
    }
  }, [visitInfoSetting])

  const visitNotes = useMemo<VisitNotesData>(() => {
    if (!visitNotesSetting?.value) return DEFAULT_VISIT_NOTES
    try {
      return JSON.parse(visitNotesSetting.value)
    } catch {
      return DEFAULT_VISIT_NOTES
    }
  }, [visitNotesSetting])

  // ✅ 使用 Custom Hooks
  const { seasonalActivities, loading } = useFarmTourActivities()
  const { formData, fieldErrors, handleFormChange, handleFieldBlur, resetForm, validateAllFields } =
    useFarmTourForm(user)

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <HeroSection
        heroBackground={heroBackground}
        onActivityClick={() => handleTabClick('activities')}
        isAdmin={user?.role === 'admin'}
      />

      <div id="content-section" className="max-w-7xl mx-auto px-6 py-16">
        {/* Navigation Tabs */}
        <div className="flex mb-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'activities'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            季節體驗活動
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'facilities'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            農場設施
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'info'
                ? 'bg-amber-900 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
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
            onActivityClick={openBookingModal}
          />
        )}

        {/* 農場設施 */}
        {activeTab === 'facilities' && <FacilitiesSection facilities={facilities} />}

        {/* 參觀資訊 */}
        {activeTab === 'info' && <InfoSection visitInfo={visitInfo} visitNotes={visitNotes} />}
      </div>

      {/* Booking Modal */}
      {selectedActivity && (
        <BookingModal
          activity={selectedActivity}
          user={user}
          formData={formData}
          fieldErrors={fieldErrors}
          onClose={closeModal}
          onFormChange={handleFormChange}
          onFieldBlur={handleFieldBlur}
          validateAllFields={validateAllFields}
        />
      )}

      {/* 社會證明區塊 */}
      <TrustSection />

      {/* FAQ 區塊 */}
      <FAQSection faqs={faqs} />

      {/* Contact CTA */}
      <ContactCTA onMapClick={() => handleTabClick('info')} />

      {/* 浮動 CTA 按鈕 */}
      <FloatingCTA />
    </div>
  )
}
