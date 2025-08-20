import { NewsItem, NewsService } from '@/types/news'
import { promises as fs } from 'fs'
import path from 'path'

export class JsonNewsService implements NewsService {
  private readonly filePath = path.join(process.cwd(), 'src/data/news.json')

  async getNews(): Promise<NewsItem[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading news:', error)
      return []
    }
  }

  async addNews(newsData: Omit<NewsItem, 'id' | 'publishedAt'>): Promise<NewsItem> {
    const news = await this.getNews()
    const newNews: NewsItem = {
      ...newsData,
      id: Date.now().toString(),
      publishedAt: new Date().toISOString()
    }
    
    news.unshift(newNews) // 新新聞放在最前面
    await this.saveNews(news)
    return newNews
  }

  async updateNews(id: string, newsData: Partial<Omit<NewsItem, 'id' | 'publishedAt'>>): Promise<NewsItem> {
    const news = await this.getNews()
    const index = news.findIndex(n => n.id === id)
    
    if (index === -1) {
      throw new Error('News not found')
    }

    const updatedNews = {
      ...news[index],
      ...newsData
    }
    
    news[index] = updatedNews
    await this.saveNews(news)
    return updatedNews
  }

  async deleteNews(id: string): Promise<void> {
    const news = await this.getNews()
    const filteredNews = news.filter(n => n.id !== id)
    await this.saveNews(filteredNews)
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    const news = await this.getNews()
    return news.find(n => n.id === id) || null
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    const news = await this.getNews()
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    
    return news
      .filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        item.summary.toLowerCase().includes(searchTerm) ||
        item.content.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => {
        // 計算相關性分數
        const getRelevanceScore = (item: NewsItem) => {
          const title = item.title.toLowerCase()
          const summary = item.summary.toLowerCase()
          const content = item.content.toLowerCase()
          const tags = item.tags.join(' ').toLowerCase()
          
          if (title.includes(searchTerm)) return 4
          if (tags.includes(searchTerm)) return 3
          if (summary.includes(searchTerm)) return 2
          if (content.includes(searchTerm)) return 1
          return 0
        }
        
        const scoreB = getRelevanceScore(b)
        const scoreA = getRelevanceScore(a)
        
        if (scoreB !== scoreA) {
          return scoreB - scoreA
        }
        
        // 相同分數時，按發布時間排序
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })
  }

  private async saveNews(news: NewsItem[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(news, null, 2), 'utf-8')
  }
}

// 使用 Supabase 資料庫服務以支援 Storage 整合
import { supabaseNewsService } from './supabaseNewsService'
export const newsService: NewsService = supabaseNewsService