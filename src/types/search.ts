export interface SearchResult {
  id: string
  title: string
  description: string
  type: 'product' | 'news' | 'review' | 'farmTour' | 'location'
  url: string
  category?: string
  image?: string
  price?: number
  rating?: number
  relevanceScore: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  processingTime: number
}

export interface SearchFilters {
  type?: SearchResult['type'][]
  category?: string[]
  priceRange?: [number, number]
  minRating?: number
}

export interface SearchParams {
  q: string
  filters?: SearchFilters
  limit?: number
  offset?: number
}