/**
 * Site Settings Reducer Hook
 *
 * 將分散的 17 個 useState 整合為單一 useReducer
 * 提供類型安全的狀態管理和更新邏輯
 */

import { useReducer, useCallback, useMemo } from 'react'

export interface SiteSettingsState {
  // UI 狀態
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null

  // 首頁輪播圖片
  homeHeroImages: string[]

  // 農場導覽背景
  farmTourHeroBg: string

  // 特色卡片圖片
  featureCard1Image: string
  featureCard2Image: string
  featureCard3Image: string
  featureCard4Image: string

  // 季節圖片
  seasonSpringImage: string
  seasonSummerImage: string
  seasonAutumnImage: string
  seasonWinterImage: string

  // 農場導覽內容
  farmFacilities: string
  farmFaqs: string
  farmVisitInfo: string
  farmVisitNotes: string

  // 首頁最新消息 - 當季推薦卡片
  newsSeasonalRecommendationEnabled: string
  newsSeasonalRecommendationTitle: string
  newsSeasonalRecommendationIcon: string
  newsSeasonalRecommendationDescription: string
  newsSeasonalRecommendationLinkUrl: string
  newsSeasonalRecommendationLinkText: string

  // 首頁最新消息 - 農場活動卡片
  newsFarmActivityEnabled: string
  newsFarmActivityTitle: string
  newsFarmActivityIcon: string
  newsFarmActivityDescription: string
  newsFarmActivityLinkUrl: string
  newsFarmActivityLinkText: string
}

export type SiteSettingsAction =
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_MESSAGE'; payload: { type: 'success' | 'error'; text: string } | null }
  | { type: 'CLEAR_MESSAGE' }
  | { type: 'SET_HOME_HERO_IMAGES'; payload: string[] }
  | { type: 'ADD_HOME_HERO_IMAGE'; payload: string }
  | { type: 'REMOVE_HOME_HERO_IMAGE'; payload: number }
  | { type: 'SET_FARM_TOUR_HERO_BG'; payload: string }
  | { type: 'SET_FEATURE_CARD_IMAGE'; payload: { index: 1 | 2 | 3 | 4; url: string } }
  | {
      type: 'SET_SEASON_IMAGE'
      payload: { season: 'spring' | 'summer' | 'autumn' | 'winter'; url: string }
    }
  | {
      type: 'SET_FARM_CONTENT'
      payload: { field: 'facilities' | 'faqs' | 'visitInfo' | 'visitNotes'; value: string }
    }
  | { type: 'LOAD_ALL_SETTINGS'; payload: Partial<SiteSettingsState> }
  | { type: 'RESET' }

const initialState: SiteSettingsState = {
  saving: false,
  message: null,
  homeHeroImages: [],
  farmTourHeroBg: '',
  featureCard1Image: '',
  featureCard2Image: '',
  featureCard3Image: '',
  featureCard4Image: '',
  seasonSpringImage: '',
  seasonSummerImage: '',
  seasonAutumnImage: '',
  seasonWinterImage: '',
  farmFacilities: '',
  farmFaqs: '',
  farmVisitInfo: '',
  farmVisitNotes: '',
  newsSeasonalRecommendationEnabled: '',
  newsSeasonalRecommendationTitle: '',
  newsSeasonalRecommendationIcon: '',
  newsSeasonalRecommendationDescription: '',
  newsSeasonalRecommendationLinkUrl: '',
  newsSeasonalRecommendationLinkText: '',
  newsFarmActivityEnabled: '',
  newsFarmActivityTitle: '',
  newsFarmActivityIcon: '',
  newsFarmActivityDescription: '',
  newsFarmActivityLinkUrl: '',
  newsFarmActivityLinkText: '',
}

function siteSettingsReducer(
  state: SiteSettingsState,
  action: SiteSettingsAction
): SiteSettingsState {
  switch (action.type) {
    case 'SET_SAVING':
      return { ...state, saving: action.payload }

    case 'SET_MESSAGE':
      return { ...state, message: action.payload }

    case 'CLEAR_MESSAGE':
      return { ...state, message: null }

    case 'SET_HOME_HERO_IMAGES':
      return { ...state, homeHeroImages: action.payload }

    case 'ADD_HOME_HERO_IMAGE':
      return {
        ...state,
        homeHeroImages: [...state.homeHeroImages, action.payload],
      }

    case 'REMOVE_HOME_HERO_IMAGE':
      return {
        ...state,
        homeHeroImages: state.homeHeroImages.filter((_, index) => index !== action.payload),
      }

    case 'SET_FARM_TOUR_HERO_BG':
      return { ...state, farmTourHeroBg: action.payload }

    case 'SET_FEATURE_CARD_IMAGE': {
      const key = `featureCard${action.payload.index}Image` as keyof SiteSettingsState
      return { ...state, [key]: action.payload.url }
    }

    case 'SET_SEASON_IMAGE': {
      const seasonMap = {
        spring: 'seasonSpringImage',
        summer: 'seasonSummerImage',
        autumn: 'seasonAutumnImage',
        winter: 'seasonWinterImage',
      }
      const key = seasonMap[action.payload.season] as keyof SiteSettingsState
      return { ...state, [key]: action.payload.url }
    }

    case 'SET_FARM_CONTENT': {
      const fieldMap = {
        facilities: 'farmFacilities',
        faqs: 'farmFaqs',
        visitInfo: 'farmVisitInfo',
        visitNotes: 'farmVisitNotes',
      }
      const key = fieldMap[action.payload.field] as keyof SiteSettingsState
      return { ...state, [key]: action.payload.value }
    }

    case 'LOAD_ALL_SETTINGS':
      return { ...state, ...action.payload }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// 導出 actions 物件的類型，供其他元件使用
export type SiteSettingsActions = {
  setSaving: (saving: boolean) => void
  showMessage: (type: 'success' | 'error', text: string) => void
  clearMessage: () => void
  setHomeHeroImages: (images: string[]) => void
  addHomeHeroImage: (url: string) => void
  removeHomeHeroImage: (index: number) => void
  setFarmTourHeroBg: (url: string) => void
  setFeatureCardImage: (index: 1 | 2 | 3 | 4, url: string) => void
  setSeasonImage: (season: 'spring' | 'summer' | 'autumn' | 'winter', url: string) => void
  setFarmContent: (field: 'facilities' | 'faqs' | 'visitInfo' | 'visitNotes', value: string) => void
  loadAllSettings: (settings: Partial<SiteSettingsState>) => void
  reset: () => void
}

export function useSiteSettingsReducer() {
  const [state, dispatch] = useReducer(siteSettingsReducer, initialState)

  // 提供方便的 helper functions
  // 使用 useMemo 確保 actions 物件引用穩定，避免無限重新渲染
  const actions = useMemo<SiteSettingsActions>(
    () => ({
      setSaving: (saving: boolean) => {
        dispatch({ type: 'SET_SAVING', payload: saving })
      },

      showMessage: (type: 'success' | 'error', text: string) => {
        dispatch({ type: 'SET_MESSAGE', payload: { type, text } })
        setTimeout(() => {
          dispatch({ type: 'CLEAR_MESSAGE' })
        }, 5000)
      },

      clearMessage: () => {
        dispatch({ type: 'CLEAR_MESSAGE' })
      },

      setHomeHeroImages: (images: string[]) => {
        dispatch({ type: 'SET_HOME_HERO_IMAGES', payload: images })
      },

      addHomeHeroImage: (url: string) => {
        dispatch({ type: 'ADD_HOME_HERO_IMAGE', payload: url })
      },

      removeHomeHeroImage: (index: number) => {
        dispatch({ type: 'REMOVE_HOME_HERO_IMAGE', payload: index })
      },

      setFarmTourHeroBg: (url: string) => {
        dispatch({ type: 'SET_FARM_TOUR_HERO_BG', payload: url })
      },

      setFeatureCardImage: (index: 1 | 2 | 3 | 4, url: string) => {
        dispatch({ type: 'SET_FEATURE_CARD_IMAGE', payload: { index, url } })
      },

      setSeasonImage: (season: 'spring' | 'summer' | 'autumn' | 'winter', url: string) => {
        dispatch({ type: 'SET_SEASON_IMAGE', payload: { season, url } })
      },

      setFarmContent: (
        field: 'facilities' | 'faqs' | 'visitInfo' | 'visitNotes',
        value: string
      ) => {
        dispatch({ type: 'SET_FARM_CONTENT', payload: { field, value } })
      },

      loadAllSettings: (settings: Partial<SiteSettingsState>) => {
        dispatch({ type: 'LOAD_ALL_SETTINGS', payload: settings })
      },

      reset: () => {
        dispatch({ type: 'RESET' })
      },
    }),
    [] // 空依賴陣列，確保 actions 引用永不變化
  )

  return { state, actions, dispatch }
}
