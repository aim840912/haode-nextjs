/**
 * Dev Notes Reducer Hook
 *
 * 將分散的 7 個 useState 整合為單一 useReducer
 * 提供類型安全的開發筆記狀態管理和更新邏輯
 */

import { useReducer, useCallback } from 'react'
import { DevNote, DevNoteStats, DevNoteType, DevNoteStatus, DevNotePriority } from '@/types/devNote'

export interface DevNotesState {
  // 資料
  notes: DevNote[]
  stats: DevNoteStats | null
  loading: boolean

  // 篩選器
  typeFilter: DevNoteType | 'all'
  statusFilter: DevNoteStatus | 'all'
  priorityFilter: DevNotePriority | 'all'

  // UI 狀態
  showCreateModal: boolean
}

export type DevNotesAction =
  | { type: 'SET_NOTES'; payload: DevNote[] }
  | { type: 'SET_STATS'; payload: DevNoteStats | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPE_FILTER'; payload: DevNoteType | 'all' }
  | { type: 'SET_STATUS_FILTER'; payload: DevNoteStatus | 'all' }
  | { type: 'SET_PRIORITY_FILTER'; payload: DevNotePriority | 'all' }
  | { type: 'SET_SHOW_CREATE_MODAL'; payload: boolean }
  | { type: 'LOAD_DATA_START' }
  | { type: 'LOAD_DATA_SUCCESS'; payload: { notes: DevNote[]; stats: DevNoteStats } }
  | { type: 'LOAD_DATA_ERROR' }
  | { type: 'RESET_FILTERS' }
  | { type: 'RESET' }

const initialState: DevNotesState = {
  notes: [],
  stats: null,
  loading: true,
  typeFilter: 'all',
  statusFilter: 'all',
  priorityFilter: 'all',
  showCreateModal: false,
}

function devNotesReducer(state: DevNotesState, action: DevNotesAction): DevNotesState {
  switch (action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.payload }

    case 'SET_STATS':
      return { ...state, stats: action.payload }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_TYPE_FILTER':
      return { ...state, typeFilter: action.payload }

    case 'SET_STATUS_FILTER':
      return { ...state, statusFilter: action.payload }

    case 'SET_PRIORITY_FILTER':
      return { ...state, priorityFilter: action.payload }

    case 'SET_SHOW_CREATE_MODAL':
      return { ...state, showCreateModal: action.payload }

    case 'LOAD_DATA_START':
      return { ...state, loading: true }

    case 'LOAD_DATA_SUCCESS':
      return {
        ...state,
        notes: action.payload.notes,
        stats: action.payload.stats,
        loading: false,
      }

    case 'LOAD_DATA_ERROR':
      return { ...state, loading: false }

    case 'RESET_FILTERS':
      return {
        ...state,
        typeFilter: 'all',
        statusFilter: 'all',
        priorityFilter: 'all',
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useDevNotesReducer() {
  const [state, dispatch] = useReducer(devNotesReducer, initialState)

  // 提供方便的 helper functions
  const actions = {
    setNotes: useCallback((notes: DevNote[]) => {
      dispatch({ type: 'SET_NOTES', payload: notes })
    }, []),

    setStats: useCallback((stats: DevNoteStats | null) => {
      dispatch({ type: 'SET_STATS', payload: stats })
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    setTypeFilter: useCallback((filter: DevNoteType | 'all') => {
      dispatch({ type: 'SET_TYPE_FILTER', payload: filter })
    }, []),

    setStatusFilter: useCallback((filter: DevNoteStatus | 'all') => {
      dispatch({ type: 'SET_STATUS_FILTER', payload: filter })
    }, []),

    setPriorityFilter: useCallback((filter: DevNotePriority | 'all') => {
      dispatch({ type: 'SET_PRIORITY_FILTER', payload: filter })
    }, []),

    setShowCreateModal: useCallback((show: boolean) => {
      dispatch({ type: 'SET_SHOW_CREATE_MODAL', payload: show })
    }, []),

    loadDataStart: useCallback(() => {
      dispatch({ type: 'LOAD_DATA_START' })
    }, []),

    loadDataSuccess: useCallback((notes: DevNote[], stats: DevNoteStats) => {
      dispatch({ type: 'LOAD_DATA_SUCCESS', payload: { notes, stats } })
    }, []),

    loadDataError: useCallback(() => {
      dispatch({ type: 'LOAD_DATA_ERROR' })
    }, []),

    resetFilters: useCallback(() => {
      dispatch({ type: 'RESET_FILTERS' })
    }, []),

    reset: useCallback(() => {
      dispatch({ type: 'RESET' })
    }, []),
  }

  return { state, actions, dispatch }
}
