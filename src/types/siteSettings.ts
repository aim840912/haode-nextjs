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

export const SETTING_KEYS = {
  HOME_HERO_IMAGES: 'home.hero_images',
  HOME_HERO_TITLE: 'home.hero_title',
  HOME_HERO_SUBTITLE: 'home.hero_subtitle',
  FARM_TOUR_HERO_BG: 'farm_tour.hero_background',
  FARM_TOUR_HERO_TITLE: 'farm_tour.hero_title',
  FARM_TOUR_HERO_SUBTITLE: 'farm_tour.hero_subtitle',
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]
