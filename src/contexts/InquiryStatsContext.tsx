/**
 * 庫存查詢統計全域狀態管理
 * 單一資料源，避免多個元件重複輪詢
 * 大幅減少 API 請求，節省 Vercel 流量
 */

'use client';

import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useInquiryStats, UseInquiryStatsReturn } from '@/hooks/useInquiryStats';

interface InquiryStatsContextType extends UseInquiryStatsReturn {
  // 額外的 context 特定方法可以在這裡加入
}

const InquiryStatsContext = createContext<InquiryStatsContextType | undefined>(undefined);

interface InquiryStatsProviderProps {
  children: React.ReactNode;
}

export function InquiryStatsProvider({ children }: InquiryStatsProviderProps) {
  // 使用單一 hook 實例，設定較長的輪詢間隔
  const inquiryStats = useInquiryStats(
    process.env.NODE_ENV === 'production' 
      ? 120000  // 生產環境：2 分鐘
      : 300000  // 開發環境：5 分鐘（減少開發時的請求）
  );

  const contextValue: InquiryStatsContextType = {
    ...inquiryStats,
  };

  return (
    <InquiryStatsContext.Provider value={contextValue}>
      {children}
    </InquiryStatsContext.Provider>
  );
}

/**
 * 使用詢價統計的 hook
 * 替代直接使用 useInquiryStats，避免重複輪詢
 */
export function useInquiryStatsContext(): InquiryStatsContextType {
  const context = useContext(InquiryStatsContext);
  
  if (context === undefined) {
    throw new Error('useInquiryStatsContext must be used within an InquiryStatsProvider');
  }
  
  return context;
}

/**
 * 輕量版本的 hook，只返回必要的資料
 * 用於只需要未讀數量的元件
 */
export function useUnreadCount(): number {
  const { stats } = useInquiryStatsContext();
  return stats?.unread_count || 0;
}

/**
 * 檢查是否有未讀詢價的 hook
 */
export function useHasUnread(): boolean {
  const unreadCount = useUnreadCount();
  return unreadCount > 0;
}