/**
 * 網站設定類型定義
 */

export type SettingType = 'string' | 'number' | 'boolean' | 'json' | 'image' | 'images_array'

export interface SiteSetting {
  id: string
  key: string
  value: string
  type: SettingType
  description: string | null
  created_at: string
  updated_at: string
}

export interface SiteSettingInput {
  key: string
  value: string
  type: SettingType
  description?: string
}

export interface SiteSettingUpdate {
  value: string
  type?: SettingType
  description?: string
}

export interface HomePageSettings {
  hero_images: string[]
  hero_title?: string
  hero_subtitle?: string
}

export interface FarmTourPageSettings {
  hero_background_image: string
  hero_title?: string
  hero_subtitle?: string
}

/**
 * 農場設施項目
 */
export interface FacilityItem {
  name: string
  description: string
  features: string[]
}

/**
 * 常見問題項目
 */
export interface FAQItem {
  question: string
  answer: string
  icon: 'clock' | 'car' | 'users' | 'banknote'
}

/**
 * 開放時間資訊
 */
export interface OpeningHours {
  weekdays: string
  closed: string
  note: string
}

/**
 * 交通方式
 */
export interface TransportationItem {
  type: string
  route: string
}

/**
 * 聯絡資訊
 */
export interface ContactInfo {
  phone: string
  line: string
  email: string
}

/**
 * 參觀資訊
 */
export interface VisitInfoData {
  address: string
  opening_hours: OpeningHours
  transportation: TransportationItem[]
  contact: ContactInfo
}

/**
 * 參觀須知
 */
export interface VisitNotesData {
  important: string[]
  recommended_items: string[]
  special_services: string[]
}

export const SETTING_KEYS = {
  HOME_HERO_IMAGES: 'home.hero_images',
  HOME_HERO_TITLE: 'home.hero_title',
  HOME_HERO_SUBTITLE: 'home.hero_subtitle',
  HOME_FEATURE_CARD_1_IMAGE: 'home.feature_card_1_image',
  HOME_FEATURE_CARD_2_IMAGE: 'home.feature_card_2_image',
  HOME_FEATURE_CARD_3_IMAGE: 'home.feature_card_3_image',
  HOME_FEATURE_CARD_4_IMAGE: 'home.feature_card_4_image',
  HOME_SEASON_SPRING_IMAGE: 'home.season_spring_image',
  HOME_SEASON_SUMMER_IMAGE: 'home.season_summer_image',
  HOME_SEASON_AUTUMN_IMAGE: 'home.season_autumn_image',
  HOME_SEASON_WINTER_IMAGE: 'home.season_winter_image',
  // 首頁最新消息 - 當季推薦卡片
  HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED: 'home.news.seasonal_recommendation.enabled',
  HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE: 'home.news.seasonal_recommendation.title',
  HOME_NEWS_SEASONAL_RECOMMENDATION_ICON: 'home.news.seasonal_recommendation.icon',
  HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION: 'home.news.seasonal_recommendation.description',
  HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL: 'home.news.seasonal_recommendation.link_url',
  HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT: 'home.news.seasonal_recommendation.link_text',
  // 首頁最新消息 - 農場活動卡片
  HOME_NEWS_FARM_ACTIVITY_ENABLED: 'home.news.farm_activity.enabled',
  HOME_NEWS_FARM_ACTIVITY_TITLE: 'home.news.farm_activity.title',
  HOME_NEWS_FARM_ACTIVITY_ICON: 'home.news.farm_activity.icon',
  HOME_NEWS_FARM_ACTIVITY_DESCRIPTION: 'home.news.farm_activity.description',
  HOME_NEWS_FARM_ACTIVITY_LINK_URL: 'home.news.farm_activity.link_url',
  HOME_NEWS_FARM_ACTIVITY_LINK_TEXT: 'home.news.farm_activity.link_text',
  FARM_TOUR_HERO_BG: 'farm_tour.hero_background',
  FARM_TOUR_HERO_TITLE: 'farm_tour.hero_title',
  FARM_TOUR_HERO_SUBTITLE: 'farm_tour.hero_subtitle',
  FARM_TOUR_FACILITIES: 'farm_tour.facilities',
  FARM_TOUR_FAQS: 'farm_tour.faqs',
  FARM_TOUR_VISIT_INFO: 'farm_tour.visit_info',
  FARM_TOUR_VISIT_NOTES: 'farm_tour.visit_notes',
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]
