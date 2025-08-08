import { NewsItem, NewsService } from '@/types/news'
import { promises as fs } from 'fs'
import path from 'path'

class JsonNewsService implements NewsService {
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

  private async saveNews(news: NewsItem[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(news, null, 2), 'utf-8')
  }
}

// 將來改成資料庫時，只需要替換這行
export const newsService: NewsService = new JsonNewsService()