'use client';

import { useMemo } from 'react';
import { InquiryWithItems, InquiryStatus, InquiryUtils } from '@/types/inquiry';

export interface StatusFlowStep {
  status: InquiryStatus;
  isCompleted: boolean;
  isActive: boolean;
  timestamp?: string;
  description: string;
  estimatedDuration?: string;
}

interface UseInquiryStatusFlowOptions {
  inquiry: InquiryWithItems;
  showEstimatedTimes?: boolean;
  showDescriptions?: boolean;
}

export function useInquiryStatusFlow({
  inquiry,
  showEstimatedTimes = true,
  showDescriptions = true
}: UseInquiryStatusFlowOptions) {
  
  // 所有可能的狀態流程
  const allStatuses: InquiryStatus[] = ['pending', 'quoted', 'confirmed', 'completed', 'cancelled'];
  
  // 狀態描述對應
  const statusDescriptions = useMemo(() => ({
    pending: inquiry.inquiry_type === 'product' 
      ? '我們已收到您的詢價，正在處理中...' 
      : '我們已收到您的預約詢問，正在安排中...',
    quoted: inquiry.inquiry_type === 'product'
      ? '已提供詳細報價，請查看並確認'
      : '已回覆預約詳情，請確認時間安排',
    confirmed: inquiry.inquiry_type === 'product'
      ? '訂單已確認，正在準備您的商品'
      : '預約已確認，期待您的蒞臨！',
    completed: inquiry.inquiry_type === 'product'
      ? '訂單已完成，感謝您的購買！'
      : '參觀已完成，感謝您的蒞臨！',
    cancelled: `此${inquiry.inquiry_type === 'product' ? '詢問單' : '預約'}已取消`
  }), [inquiry.inquiry_type]);

  // 預估處理時間
  const estimatedDurations = useMemo(() => ({
    pending: '24小時內',
    quoted: '等待客戶確認',
    confirmed: inquiry.inquiry_type === 'product' ? '3-5個工作天' : '按預約時間',
    completed: '已完成',
    cancelled: '已取消'
  }), [inquiry.inquiry_type]);

  // 生成狀態流程步驟
  const statusFlowSteps = useMemo((): StatusFlowStep[] => {
    const currentStatusIndex = allStatuses.indexOf(inquiry.status);
    
    // 如果是已取消狀態，只顯示 pending 和 cancelled
    if (inquiry.status === 'cancelled') {
      return [
        {
          status: 'pending',
          isCompleted: true,
          isActive: false,
          timestamp: inquiry.created_at,
          description: showDescriptions ? statusDescriptions.pending : '',
          estimatedDuration: showEstimatedTimes ? estimatedDurations.pending : undefined
        },
        {
          status: 'cancelled',
          isCompleted: true,
          isActive: true,
          timestamp: inquiry.updated_at,
          description: showDescriptions ? statusDescriptions.cancelled : '',
          estimatedDuration: showEstimatedTimes ? estimatedDurations.cancelled : undefined
        }
      ];
    }

    // 正常流程：pending → quoted → confirmed → completed
    const normalFlow: InquiryStatus[] = ['pending', 'quoted', 'confirmed', 'completed'];
    
    return normalFlow.map((status, index) => {
      const isCompleted = normalFlow.indexOf(inquiry.status) >= index;
      const isActive = inquiry.status === status;
      
      // 根據狀態決定時間戳記
      let timestamp: string | undefined;
      if (status === 'pending') {
        timestamp = inquiry.created_at;
      } else if (status === 'quoted' && inquiry.replied_at) {
        timestamp = inquiry.replied_at;
      } else if (status === inquiry.status) {
        timestamp = inquiry.updated_at;
      }

      return {
        status,
        isCompleted,
        isActive,
        timestamp,
        description: showDescriptions ? statusDescriptions[status] : '',
        estimatedDuration: showEstimatedTimes ? estimatedDurations[status] : undefined
      };
    });
  }, [inquiry, showDescriptions, showEstimatedTimes, statusDescriptions, estimatedDurations, allStatuses]);

  // 計算整體進度百分比
  const progressPercentage = useMemo(() => {
    if (inquiry.status === 'cancelled') return 100; // 取消狀態視為已完成流程
    
    const normalFlow: InquiryStatus[] = ['pending', 'quoted', 'confirmed', 'completed'];
    const currentIndex = normalFlow.indexOf(inquiry.status);
    
    if (currentIndex === -1) return 0;
    
    return Math.round(((currentIndex + 1) / normalFlow.length) * 100);
  }, [inquiry.status]);

  // 取得下一個狀態
  const nextStatus = useMemo(() => {
    return InquiryUtils.getAvailableStatusTransitions(inquiry.status)[0] || null;
  }, [inquiry.status]);

  // 取得預估完成時間
  const estimatedCompletionTime = useMemo(() => {
    if (inquiry.status === 'completed' || inquiry.status === 'cancelled') {
      return null;
    }

    const createdDate = new Date(inquiry.created_at);
    let estimatedDays = 0;

    switch (inquiry.status) {
      case 'pending':
        estimatedDays = inquiry.inquiry_type === 'product' ? 7 : 3; // 產品詢價需要更長處理時間
        break;
      case 'quoted':
        estimatedDays = 3; // 等待客戶確認
        break;
      case 'confirmed':
        estimatedDays = inquiry.inquiry_type === 'product' ? 5 : 1;
        break;
      default:
        return null;
    }

    const estimatedDate = new Date(createdDate);
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
    
    return estimatedDate;
  }, [inquiry.status, inquiry.inquiry_type, inquiry.created_at]);

  // 格式化預估完成時間
  const formattedEstimatedCompletion = useMemo(() => {
    if (!estimatedCompletionTime) return null;
    
    return estimatedCompletionTime.toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  }, [estimatedCompletionTime]);

  // 取得目前狀態的說明
  const currentStatusDescription = useMemo(() => {
    return statusDescriptions[inquiry.status];
  }, [inquiry.status, statusDescriptions]);

  // 檢查是否需要關注
  const needsAttention = useMemo(() => {
    return InquiryUtils.needsAttention(inquiry);
  }, [inquiry]);

  // 取得回覆時間
  const responseTime = useMemo(() => {
    return InquiryUtils.formatResponseTime(inquiry);
  }, [inquiry]);

  return {
    statusFlowSteps,
    progressPercentage,
    nextStatus,
    estimatedCompletionTime,
    formattedEstimatedCompletion,
    currentStatusDescription,
    needsAttention,
    responseTime,
    isCompleted: inquiry.status === 'completed',
    isCancelled: inquiry.status === 'cancelled'
  };
}