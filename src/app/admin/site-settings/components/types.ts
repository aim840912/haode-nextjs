import { SiteSettingsState, SiteSettingsActions } from '@/hooks/useSiteSettingsReducer'

export interface SectionProps {
  state: SiteSettingsState
  actions: SiteSettingsActions
}

export interface UploadedImage {
  url?: string
  preview?: string
  storage_url?: string
}
