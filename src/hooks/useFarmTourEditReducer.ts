/**
 * Farm Tour Edit Reducer Hook
 *
 * 整合載入狀態和圖片管理的 useReducer
 * 提供類型安全的農場體驗活動編輯狀態管理
 */

import { useReducer, useCallback } from 'react'

export interface FarmTourEditState {
  // 載入狀態
  loading: boolean
  initialLoading: boolean

  // 活動 ID
  activityId: string

  // 圖片管理
  uploadedImages: string[]
  existingImages: string[]
  imageDeleted: boolean
}

export type FarmTourEditAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVITY_ID'; payload: string }
  | { type: 'SET_UPLOADED_IMAGES'; payload: string[] }
  | { type: 'SET_EXISTING_IMAGES'; payload: string[] }
  | { type: 'SET_IMAGE_DELETED'; payload: boolean }
  | { type: 'ADD_UPLOADED_IMAGE'; payload: string }
  | { type: 'CLEAR_UPLOADED_IMAGES' }
  | { type: 'DELETE_EXISTING_IMAGE' }
  | { type: 'LOAD_ACTIVITY_SUCCESS'; payload: { id: string; image?: string } }
  | { type: 'RESET' }

const initialState: FarmTourEditState = {
  loading: false,
  initialLoading: true,
  activityId: '',
  uploadedImages: [],
  existingImages: [],
  imageDeleted: false,
}

function farmTourEditReducer(
  state: FarmTourEditState,
  action: FarmTourEditAction
): FarmTourEditState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload }

    case 'SET_ACTIVITY_ID':
      return { ...state, activityId: action.payload }

    case 'SET_UPLOADED_IMAGES':
      return { ...state, uploadedImages: action.payload }

    case 'SET_EXISTING_IMAGES':
      return { ...state, existingImages: action.payload }

    case 'SET_IMAGE_DELETED':
      return { ...state, imageDeleted: action.payload }

    case 'ADD_UPLOADED_IMAGE':
      return {
        ...state,
        uploadedImages: [...state.uploadedImages, action.payload],
      }

    case 'CLEAR_UPLOADED_IMAGES':
      return { ...state, uploadedImages: [] }

    case 'DELETE_EXISTING_IMAGE':
      return {
        ...state,
        imageDeleted: true,
        existingImages: [],
      }

    case 'LOAD_ACTIVITY_SUCCESS': {
      // 載入活動資料成功
      const { id, image } = action.payload
      const existingImages: string[] = []

      // 設定現有圖片（如果不是 emoji 且是有效 URL）
      if (image && !image.match(/^[\u{1f300}-\u{1f9ff}]$/u) && image.startsWith('http')) {
        existingImages.push(image)
      }

      return {
        ...state,
        activityId: id,
        existingImages,
        initialLoading: false,
      }
    }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useFarmTourEditReducer() {
  const [state, dispatch] = useReducer(farmTourEditReducer, initialState)

  // 提供方便的 helper functions
  const actions = {
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    setInitialLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_INITIAL_LOADING', payload: loading })
    }, []),

    setActivityId: useCallback((id: string) => {
      dispatch({ type: 'SET_ACTIVITY_ID', payload: id })
    }, []),

    setUploadedImages: useCallback((images: string[]) => {
      dispatch({ type: 'SET_UPLOADED_IMAGES', payload: images })
    }, []),

    setExistingImages: useCallback((images: string[]) => {
      dispatch({ type: 'SET_EXISTING_IMAGES', payload: images })
    }, []),

    setImageDeleted: useCallback((deleted: boolean) => {
      dispatch({ type: 'SET_IMAGE_DELETED', payload: deleted })
    }, []),

    addUploadedImage: useCallback((url: string) => {
      dispatch({ type: 'ADD_UPLOADED_IMAGE', payload: url })
    }, []),

    clearUploadedImages: useCallback(() => {
      dispatch({ type: 'CLEAR_UPLOADED_IMAGES' })
    }, []),

    deleteExistingImage: useCallback(() => {
      dispatch({ type: 'DELETE_EXISTING_IMAGE' })
    }, []),

    loadActivitySuccess: useCallback((id: string, image?: string) => {
      dispatch({ type: 'LOAD_ACTIVITY_SUCCESS', payload: { id, image } })
    }, []),

    reset: useCallback(() => {
      dispatch({ type: 'RESET' })
    }, []),
  }

  return { state, actions, dispatch }
}
