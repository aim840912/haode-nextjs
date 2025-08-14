import fs from 'fs'
import path from 'path'

export interface VisitorData {
  visitor_id: string
  first_visit: string
  last_visit: string
  visit_count: number
  ip_address: string
  user_agent: string
}

export interface VisitorStats {
  total_visits: number
  unique_visitors: string[]
  today_visits: number
  daily_stats: Record<string, number>
  top_visitors: VisitorData[]
  last_updated: string
}

const STATS_FILE_PATH = path.join(process.cwd(), 'src/data/visitor-stats.json')
const VISITORS_FILE_PATH = path.join(process.cwd(), 'src/data/visitors.json')

// 確保目錄存在
function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 讀取訪客統計資料
export function readVisitorStats(): VisitorStats {
  try {
    ensureDirectoryExists(STATS_FILE_PATH)
    
    if (!fs.existsSync(STATS_FILE_PATH)) {
      const defaultStats: VisitorStats = {
        total_visits: 0,
        unique_visitors: [],
        today_visits: 0,
        daily_stats: {},
        top_visitors: [],
        last_updated: new Date().toISOString()
      }
      writeVisitorStats(defaultStats)
      return defaultStats
    }

    const data = fs.readFileSync(STATS_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading visitor stats:', error)
    return {
      total_visits: 0,
      unique_visitors: [],
      today_visits: 0,
      daily_stats: {},
      top_visitors: [],
      last_updated: new Date().toISOString()
    }
  }
}

// 寫入訪客統計資料
export function writeVisitorStats(stats: VisitorStats): void {
  try {
    ensureDirectoryExists(STATS_FILE_PATH)
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing visitor stats:', error)
  }
}

// 讀取所有訪客資料
export function readVisitors(): Record<string, VisitorData> {
  try {
    ensureDirectoryExists(VISITORS_FILE_PATH)
    
    if (!fs.existsSync(VISITORS_FILE_PATH)) {
      return {}
    }

    const data = fs.readFileSync(VISITORS_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading visitors:', error)
    return {}
  }
}

// 寫入所有訪客資料
export function writeVisitors(visitors: Record<string, VisitorData>): void {
  try {
    ensureDirectoryExists(VISITORS_FILE_PATH)
    fs.writeFileSync(VISITORS_FILE_PATH, JSON.stringify(visitors, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing visitors:', error)
  }
}

// 更新或新增訪客記錄
export function updateVisitor(
  visitorId: string, 
  ip: string, 
  userAgent: string,
  isNewVisit: boolean = false
): VisitorData {
  const visitors = readVisitors()
  const now = new Date().toISOString()
  
  if (visitors[visitorId]) {
    // 更新現有訪客
    visitors[visitorId].last_visit = now
    visitors[visitorId].visit_count += 1
  } else {
    // 新訪客
    visitors[visitorId] = {
      visitor_id: visitorId,
      first_visit: now,
      last_visit: now,
      visit_count: 1,
      ip_address: ip,
      user_agent: userAgent
    }
  }
  
  writeVisitors(visitors)
  updateStats(visitors, isNewVisit)
  
  return visitors[visitorId]
}

// 更新統計資料
function updateStats(visitors: Record<string, VisitorData>, isNewVisit: boolean) {
  const stats = readVisitorStats()
  const today = new Date().toISOString().split('T')[0]
  
  // 更新基本統計
  stats.unique_visitors = Object.keys(visitors)
  stats.total_visits = Object.values(visitors).reduce((sum, visitor) => sum + visitor.visit_count, 0)
  
  // 計算今日訪客 (最後訪問是今天的訪客)
  stats.today_visits = Object.values(visitors).filter(visitor => 
    visitor.last_visit.split('T')[0] === today
  ).length
  
  // 更新每日統計
  if (!stats.daily_stats[today]) {
    stats.daily_stats[today] = 0
  }
  if (isNewVisit) {
    stats.daily_stats[today] += 1
  }
  
  // 更新熱門訪客（訪問次數最多的前10名）
  stats.top_visitors = Object.values(visitors)
    .sort((a, b) => b.visit_count - a.visit_count)
    .slice(0, 10)
  
  stats.last_updated = new Date().toISOString()
  
  writeVisitorStats(stats)
}

// 取得每日統計（最近7天）
export function getDailyStats(): Array<{ date: string; visits: number }> {
  const stats = readVisitorStats()
  const result: Array<{ date: string; visits: number }> = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    result.push({
      date: dateStr,
      visits: stats.daily_stats[dateStr] || 0
    })
  }
  
  return result
}