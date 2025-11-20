'use client'

import { useState, useEffect } from 'react'
import { Sprout, Apple, Wheat, Leaf, PartyPopper, Calendar, Users, Sparkles } from 'lucide-react'
import { FeaturesSection } from '@/components/features/home/FeaturesSection'
import { HeroSection } from '@/components/features/home/HeroSection'
import { NewsSection } from '@/components/features/home/NewsSection'
import { ProductsSectionWithErrorBoundary as ProductsSection } from '@/components/features/products/ProductsSection'
import { FarmStructuredData } from '@/components/features/seo/StructuredData'
import { useSiteSetting } from '@/hooks/useSiteSettings'
import { SETTING_KEYS } from '@/types/siteSettings'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [activeFeature, setActiveFeature] = useState(0)

  const { setting: heroImagesSetting, loading: heroImagesLoading } = useSiteSetting(
    SETTING_KEYS.HOME_HERO_IMAGES
  )
  const { setting: featureCard1Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE)
  const { setting: featureCard2Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE)
  const { setting: featureCard3Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE)
  const { setting: featureCard4Setting } = useSiteSetting(SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE)

  // 最新消息 - 當季推薦卡片設定
  const { setting: seasonalRecommendationEnabled } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED
  )
  const { setting: seasonalRecommendationTitle } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE
  )
  const { setting: seasonalRecommendationIcon } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON
  )
  const { setting: seasonalRecommendationDescription } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION
  )
  const { setting: seasonalRecommendationLinkUrl } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL
  )
  const { setting: seasonalRecommendationLinkText } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT
  )

  // 最新消息 - 農場活動卡片設定
  const { setting: farmActivityEnabled } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED
  )
  const { setting: farmActivityTitle } = useSiteSetting(SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE)
  const { setting: farmActivityIcon } = useSiteSetting(SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON)
  const { setting: farmActivityDescription } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION
  )
  const { setting: farmActivityLinkUrl } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL
  )
  const { setting: farmActivityLinkText } = useSiteSetting(
    SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT
  )

  const defaultHeroImages = [
    '/images/hero/scene1.jpg',
    '/images/locations/mountain.jpg',
    '/images/farm-tour/many_people_1.jpg',
  ]

  const heroImages = (() => {
    if (heroImagesLoading || !heroImagesSetting) {
      return defaultHeroImages
    }
    try {
      const parsedImages = JSON.parse(heroImagesSetting.value)
      return Array.isArray(parsedImages) && parsedImages.length > 0
        ? parsedImages
        : defaultHeroImages
    } catch {
      return defaultHeroImages
    }
  })()

  // 翻轉卡片背景圖片
  const featureCardImages = [
    featureCard1Setting?.value || '',
    featureCard2Setting?.value || '',
    featureCard3Setting?.value || '',
    featureCard4Setting?.value || '',
  ]

  // 圖示映射函數
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      sprout: Sprout,
      apple: Apple,
      wheat: Wheat,
      leaf: Leaf,
      'party-popper': PartyPopper,
      calendar: Calendar,
      users: Users,
      sparkles: Sparkles,
    }
    return iconMap[iconName.toLowerCase()] || Sprout
  }

  // 最新消息卡片資料
  const newsCards = {
    seasonalRecommendation: {
      enabled: seasonalRecommendationEnabled?.value === 'true',
      title: seasonalRecommendationTitle?.value || '當季推薦',
      icon: seasonalRecommendationIcon?.value || 'sprout',
      description:
        seasonalRecommendationDescription?.value ||
        '春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中',
      linkUrl: seasonalRecommendationLinkUrl?.value || '/products',
      linkText: seasonalRecommendationLinkText?.value || '查看產品 →',
    },
    farmActivity: {
      enabled: farmActivityEnabled?.value === 'true',
      title: farmActivityTitle?.value || '農場活動',
      icon: farmActivityIcon?.value || 'party-popper',
      description:
        farmActivityDescription?.value || '週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣',
      linkUrl: farmActivityLinkUrl?.value || '/farm-tour',
      linkText: farmActivityLinkText?.value || '立即預約 →',
    },
  }

  // 視差滾動效果
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 背景圖輪播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  // 滾動觸發動畫
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <FarmStructuredData />
      <div className="min-h-screen -mt-[var(--header-height)]">
        <HeroSection
          images={heroImages}
          scrollY={scrollY}
          currentSlide={currentSlide}
          onSlideChange={setCurrentSlide}
        />

        <FeaturesSection
          activeFeature={activeFeature}
          onFeatureClick={setActiveFeature}
          featureImages={featureCardImages}
          isVisible={visibleSections.has('features')}
        />

        <ProductsSection />

        <NewsSection
          newsCards={newsCards}
          getIcon={getIcon}
          isVisible={visibleSections.has('news')}
        />
      </div>
    </>
  )
}
