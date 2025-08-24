import { NewsItem, NewsService } from '@/types/news'
import { supabase, supabaseAdmin } from '@/lib/supabase-auth'

export class SupabaseNewsService implements NewsService {
  async getNews(): Promise<NewsItem[]> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('publish_date', { ascending: false })
      
      if (error) {
        console.error('Error fetching news:', error)
        throw new Error('Failed to fetch news')
      }
      
      return data?.map(this.transformFromDB) || []
    } catch (error) {
      console.error('Error in getNews:', error)
      return []
    }
  }

  async getNewsById(id: string): Promise<NewsItem | null> {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      
      return this.transformFromDB(data)
    } catch (error) {
      console.error('Error fetching news by id:', error)
      return null
    }
  }

  async addNews(newsData: Omit<NewsItem, 'id' | 'publishedAt'>): Promise<NewsItem> {
    const insertData = {
      title: newsData.title,
      summary: newsData.summary,
      content: newsData.content,
      category: newsData.category,
      tags: newsData.tags,
      image_url: newsData.imageUrl,
      author: newsData.author || '豪德農場',
      featured: newsData.featured || false,
      is_published: true,  // 修正：總是設為 true（已發布）
      publish_date: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin!
      .from('news')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error adding news:', error)
      throw new Error('Failed to add news')
    }

    return this.transformFromDB(data)
  }

  async updateNews(id: string, newsData: Partial<Omit<NewsItem, 'id' | 'publishedAt'>>): Promise<NewsItem> {
    const dbUpdateData: Record<string, any> = {}
    
    if (newsData.title !== undefined) dbUpdateData.title = newsData.title
    if (newsData.summary !== undefined) dbUpdateData.summary = newsData.summary
    if (newsData.content !== undefined) dbUpdateData.content = newsData.content
    if (newsData.category !== undefined) dbUpdateData.category = newsData.category
    if (newsData.tags !== undefined) dbUpdateData.tags = newsData.tags
    if (newsData.imageUrl !== undefined) {
      dbUpdateData.image_url = newsData.imageUrl
    }
    if (newsData.author !== undefined) dbUpdateData.author = newsData.author
    if (newsData.featured !== undefined) dbUpdateData.featured = newsData.featured

    const { data, error } = await supabaseAdmin!
      .from('news')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating news:', error)
      throw new Error('Failed to update news')
    }
    
    if (!data) throw new Error('News not found')
    return this.transformFromDB(data)
  }

  async deleteNews(id: string): Promise<void> {
    const { error } = await supabaseAdmin!
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting news:', error)
      throw new Error('Failed to delete news')
    }
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    try {
      if (!query.trim()) return []

      const searchTerm = `%${query.toLowerCase()}%`
      
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order('publish_date', { ascending: false })
      
      if (error) throw error
      
      const newsItems = data?.map(this.transformFromDB) || []
      
      // 按相關性排序
      return newsItems.sort((a: any, b: any) => {
        const queryLower = query.toLowerCase()
        const getRelevanceScore = (item: NewsItem) => {
          const title = item.title.toLowerCase()
          const summary = item.summary.toLowerCase()
          const content = item.content.toLowerCase()
          
          if (title.includes(queryLower)) return 3
          if (summary.includes(queryLower)) return 2
          if (content.includes(queryLower)) return 1
          return 0
        }
        
        return getRelevanceScore(b) - getRelevanceScore(a)
      })
    } catch (error) {
      console.error('Error searching news:', error)
      return []
    }
  }

  private transformFromDB(dbNews: Record<string, any>): NewsItem {
    return {
      id: dbNews.id,
      title: dbNews.title,
      summary: dbNews.summary,
      content: dbNews.content,
      author: dbNews.author || '豪德農場', // 使用資料庫的 author
      publishedAt: dbNews.publish_date,
      category: dbNews.category,
      tags: dbNews.tags || [],
      image: '', // 不再使用 emoji，保留欄位相容性
      imageUrl: dbNews.image_url,
      featured: dbNews.featured || false // 使用資料庫的 featured
    }
  }
}

export const supabaseNewsService = new SupabaseNewsService()