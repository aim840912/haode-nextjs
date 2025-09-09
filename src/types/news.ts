export interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  author: string
  publishedAt: string
  category: string
  tags: string[]
  imageUrl?: string
  featured: boolean
}

export interface NewsService {
  getNews(): Promise<NewsItem[]>
  addNews(news: Omit<NewsItem, 'id' | 'publishedAt'>): Promise<NewsItem>
  updateNews(id: string, news: Partial<Omit<NewsItem, 'id' | 'publishedAt'>>): Promise<NewsItem>
  deleteNews(id: string): Promise<void>
  getNewsById(id: string): Promise<NewsItem | null>
  searchNews(query: string): Promise<NewsItem[]>
}
