/**
 * Rate Limiting 監控服務
 * 
 * 提供 rate limiting 的統計、分析和監控功能：
 * - 實時統計超限事件
 * - 惡意 IP 識別和自動封鎖
 * - 監控報告生成
 * - 效能分析和建議
 */

import { kv } from '@vercel/kv';
import { auditLogService } from './auditLogService';
import { AuditAction } from '@/types/audit';

/**
 * Rate Limiting 統計資料介面
 */
export interface RateLimitStats {
  /** 總請求數 */
  totalRequests: number;
  /** 被限制的請求數 */
  limitedRequests: number;
  /** 限制率 (%) */
  limitRate: number;
  /** 最近 24 小時的統計 */
  last24Hours: {
    requests: number;
    limited: number;
    rate: number;
  };
  /** 最近 1 小時的統計 */
  lastHour: {
    requests: number;
    limited: number;
    rate: number;
  };
  /** 活躍的被封鎖 IP 數量 */
  blockedIPs: number;
  /** 最常觸發限制的 IP */
  topOffendingIPs: Array<{
    ip: string;
    violations: number;
    lastViolation: string;
  }>;
}

/**
 * 封鎖原因
 */
export enum BlockReason {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MANUAL_BLOCK = 'manual_block',
  ANTI_DDOS = 'anti_ddos'
}

/**
 * IP 封鎖資訊
 */
export interface IPBlockInfo {
  ip: string;
  reason: BlockReason;
  blockedAt: string;
  expiresAt: string;
  violationCount: number;
  lastViolation: string;
  userAgent?: string;
  country?: string;
}

/**
 * 監控警報
 */
export interface MonitoringAlert {
  id: string;
  type: 'high_violation_rate' | 'suspicious_ip' | 'ddos_attempt' | 'system_overload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  triggeredAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

/**
 * Rate Limiting 監控服務類別
 */
export class RateLimitMonitoringService {
  private static readonly STATS_KEY_PREFIX = 'rate_limit_stats:';
  private static readonly BLOCK_KEY_PREFIX = 'ip_block:';
  private static readonly VIOLATION_KEY_PREFIX = 'violations:';
  private static readonly ALERT_KEY_PREFIX = 'monitoring_alert:';

  /**
   * 記錄 rate limiting 事件
   */
  async recordRateLimitEvent(
    ip: string,
    path: string,
    strategy: string,
    limited: boolean,
    details: Record<string, any> = {}
  ): Promise<void> {
    const now = Date.now();
    const hourKey = `${RateLimitMonitoringService.STATS_KEY_PREFIX}hour:${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `${RateLimitMonitoringService.STATS_KEY_PREFIX}day:${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    
    try {
      // 更新統計計數器
      await Promise.all([
        kv.hincrby(hourKey, 'total_requests', 1),
        kv.hincrby(dayKey, 'total_requests', 1),
        kv.expire(hourKey, 2 * 60 * 60), // 2 小時 TTL
        kv.expire(dayKey, 48 * 60 * 60)  // 48 小時 TTL
      ]);

      if (limited) {
        // 更新限制統計
        await Promise.all([
          kv.hincrby(hourKey, 'limited_requests', 1),
          kv.hincrby(dayKey, 'limited_requests', 1),
          this.recordViolation(ip, path, strategy, details)
        ]);

        // 檢查是否需要自動封鎖
        await this.checkAutoBlock(ip, details);
      }

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to record event:', error);
    }
  }

  /**
   * 記錄違反事件
   */
  private async recordViolation(
    ip: string,
    path: string,
    strategy: string,
    details: Record<string, any>
  ): Promise<void> {
    const violationKey = `${RateLimitMonitoringService.VIOLATION_KEY_PREFIX}${ip}`;
    const now = new Date().toISOString();

    try {
      // 增加違反計數
      const count = await kv.hincrby(violationKey, 'count', 1);
      
      // 更新最後違反時間
      await kv.hset(violationKey, {
        last_violation: now,
        last_path: path,
        last_strategy: strategy,
        user_agent: details.userAgent || 'unknown'
      });

      // 設置過期時間（24 小時）
      await kv.expire(violationKey, 24 * 60 * 60);

      // 記錄到審計日誌
      if (count % 5 === 0) { // 每 5 次違反記錄一次
        await auditLogService.log({
          action: 'rate_limit_violation_milestone' as AuditAction,
          resource_type: 'rate_limiter' as any,
          resource_id: ip,
          user_id: null,
          user_email: 'system',
          resource_details: {
            ip,
            path,
            strategy,
            violationCount: count,
            ...details
          },
          metadata: {
            severity: count > 50 ? 'high' : count > 20 ? 'medium' : 'low',
            alert: count > 50
          }
        });
      }

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to record violation:', error);
    }
  }

  /**
   * 檢查是否需要自動封鎖 IP
   */
  private async checkAutoBlock(ip: string, details: Record<string, any>): Promise<void> {
    try {
      const violationKey = `${RateLimitMonitoringService.VIOLATION_KEY_PREFIX}${ip}`;
      const violationData = await kv.hgetall(violationKey);
      
      if (!violationData || !violationData.count) return;

      const violationCount = parseInt(violationData.count as string);
      const threshold = this.getAutoBlockThreshold(details);

      if (violationCount >= threshold) {
        await this.blockIP(
          ip, 
          BlockReason.RATE_LIMIT_EXCEEDED, 
          this.getBlockDuration(violationCount),
          {
            violationCount,
            autoBlocked: true,
            lastViolation: violationData.last_violation as string,
            userAgent: violationData.user_agent as string
          }
        );

        // 創建高優先級警報
        await this.createAlert({
          type: 'suspicious_ip',
          severity: 'high',
          message: `IP ${ip} 已自動封鎖，違反次數: ${violationCount}`,
          details: {
            ip,
            violationCount,
            threshold,
            autoBlocked: true,
            userAgent: violationData.user_agent
          }
        });
      }

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to check auto block:', error);
    }
  }

  /**
   * 封鎖 IP
   */
  async blockIP(
    ip: string,
    reason: BlockReason,
    durationMs: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const blockKey = `${RateLimitMonitoringService.BLOCK_KEY_PREFIX}${ip}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMs);

    const blockInfo: IPBlockInfo = {
      ip,
      reason,
      blockedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      violationCount: metadata.violationCount || 0,
      lastViolation: metadata.lastViolation || now.toISOString(),
      userAgent: metadata.userAgent,
      country: metadata.country
    };

    try {
      // 存儲封鎖資訊
      await kv.hset(blockKey, blockInfo as any);
      await kv.expire(blockKey, Math.ceil(durationMs / 1000));

      // 記錄到審計日誌
      await auditLogService.log({
        action: 'ip_blocked' as AuditAction,
        resource_type: 'security' as any,
        resource_id: ip,
        user_id: null,
        user_email: 'system',
        resource_details: {
          ...blockInfo,
          ...metadata
        },
        metadata: {
          severity: 'high',
          alert: true
        }
      });

      console.warn(`[Rate Limit Monitor] IP ${ip} blocked for ${reason}, expires: ${expiresAt.toISOString()}`);

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to block IP:', error);
    }
  }

  /**
   * 檢查 IP 是否被封鎖
   */
  async isIPBlocked(ip: string): Promise<IPBlockInfo | null> {
    const blockKey = `${RateLimitMonitoringService.BLOCK_KEY_PREFIX}${ip}`;
    
    try {
      const blockData = await kv.hgetall(blockKey);
      
      if (!blockData || !blockData.ip) {
        return null;
      }

      const blockInfo = blockData as unknown as IPBlockInfo;
      
      // 檢查是否已過期
      if (new Date() > new Date(blockInfo.expiresAt)) {
        await kv.del(blockKey);
        return null;
      }

      return blockInfo;

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to check IP block:', error);
      return null;
    }
  }

  /**
   * 解除 IP 封鎖
   */
  async unblockIP(ip: string, reason: string = 'manual_unblock'): Promise<void> {
    const blockKey = `${RateLimitMonitoringService.BLOCK_KEY_PREFIX}${ip}`;
    
    try {
      const blockInfo = await kv.hgetall(blockKey);
      
      if (blockInfo && blockInfo.ip) {
        await kv.del(blockKey);
        
        // 記錄解封事件
        await auditLogService.log({
          action: 'ip_unblocked' as AuditAction,
          resource_type: 'security' as any,
          resource_id: ip,
          user_id: null,
          user_email: 'system',
          resource_details: {
            ip,
            reason,
            originalBlockReason: blockInfo.reason,
            unblockedAt: new Date().toISOString()
          },
          metadata: {
            severity: 'medium'
          }
        });

        console.info(`[Rate Limit Monitor] IP ${ip} unblocked: ${reason}`);
      }

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to unblock IP:', error);
    }
  }

  /**
   * 獲取統計資料
   */
  async getStats(): Promise<RateLimitStats> {
    const now = Date.now();
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const currentDay = Math.floor(now / (24 * 60 * 60 * 1000));

    try {
      const [hourStats, dayStats, blockedIPs, topOffenders] = await Promise.all([
        kv.hgetall(`${RateLimitMonitoringService.STATS_KEY_PREFIX}hour:${currentHour}`),
        kv.hgetall(`${RateLimitMonitoringService.STATS_KEY_PREFIX}day:${currentDay}`),
        this.getBlockedIPsCount(),
        this.getTopOffendingIPs()
      ]);

      const hourRequests = parseInt(hourStats?.total_requests as string) || 0;
      const hourLimited = parseInt(hourStats?.limited_requests as string) || 0;
      const dayRequests = parseInt(dayStats?.total_requests as string) || 0;
      const dayLimited = parseInt(dayStats?.limited_requests as string) || 0;

      return {
        totalRequests: dayRequests,
        limitedRequests: dayLimited,
        limitRate: dayRequests > 0 ? (dayLimited / dayRequests) * 100 : 0,
        last24Hours: {
          requests: dayRequests,
          limited: dayLimited,
          rate: dayRequests > 0 ? (dayLimited / dayRequests) * 100 : 0
        },
        lastHour: {
          requests: hourRequests,
          limited: hourLimited,
          rate: hourRequests > 0 ? (hourLimited / hourRequests) * 100 : 0
        },
        blockedIPs,
        topOffendingIPs: topOffenders
      };

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to get stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * 創建監控警報
   */
  private async createAlert(alert: Omit<MonitoringAlert, 'id' | 'triggeredAt' | 'resolved'>): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alertData: MonitoringAlert = {
      id: alertId,
      triggeredAt: new Date().toISOString(),
      resolved: false,
      ...alert
    };

    try {
      const alertKey = `${RateLimitMonitoringService.ALERT_KEY_PREFIX}${alertId}`;
      await kv.hset(alertKey, alertData as any);
      await kv.expire(alertKey, 7 * 24 * 60 * 60); // 保留 7 天

      // 記錄到審計日誌
      await auditLogService.log({
        action: 'monitoring_alert_created' as AuditAction,
        resource_type: 'monitoring' as any,
        resource_id: alertId,
        user_id: null,
        user_email: 'system',
        resource_details: alertData,
        metadata: {
          severity: alert.severity,
          alert: alert.severity === 'critical' || alert.severity === 'high'
        }
      });

      console.warn(`[Rate Limit Monitor] Alert created: ${alert.type} - ${alert.message}`);

    } catch (error) {
      console.error('[Rate Limit Monitor] Failed to create alert:', error);
    }
  }

  /**
   * 獲取自動封鎖閾值
   */
  private getAutoBlockThreshold(details: Record<string, any>): number {
    // 根據不同情境設定不同閾值
    if (details.path?.includes('/api/auth/')) return 10; // 認證 API 更嚴格
    if (details.path?.includes('/api/payment/')) return 5; // 支付 API 最嚴格
    if (details.path?.includes('/api/admin/')) return 50; // 管理 API 較寬鬆
    return 25; // 預設閾值
  }

  /**
   * 獲取封鎖持續時間
   */
  private getBlockDuration(violationCount: number): number {
    // 基於違反次數的遞增封鎖時間
    if (violationCount >= 100) return 24 * 60 * 60 * 1000; // 24 小時
    if (violationCount >= 50) return 4 * 60 * 60 * 1000;   // 4 小時
    if (violationCount >= 25) return 60 * 60 * 1000;       // 1 小時
    return 15 * 60 * 1000; // 15 分鐘
  }

  /**
   * 獲取被封鎖的 IP 數量
   */
  private async getBlockedIPsCount(): Promise<number> {
    try {
      // 這是一個簡化的實作，實際上應該掃描所有 block keys
      // 在生產環境中可能需要維護一個單獨的計數器
      const keys = await kv.keys(`${RateLimitMonitoringService.BLOCK_KEY_PREFIX}*`);
      return keys.length;
    } catch {
      return 0;
    }
  }

  /**
   * 獲取違反次數最多的 IP
   */
  private async getTopOffendingIPs(): Promise<Array<{ ip: string; violations: number; lastViolation: string }>> {
    try {
      // 這是簡化實作，實際應該從索引中獲取
      const keys = await kv.keys(`${RateLimitMonitoringService.VIOLATION_KEY_PREFIX}*`);
      const results = [];

      for (const key of keys.slice(0, 10)) { // 只取前 10 個
        const data = await kv.hgetall(key);
        if (data && data.count) {
          results.push({
            ip: key.replace(RateLimitMonitoringService.VIOLATION_KEY_PREFIX, ''),
            violations: parseInt(data.count as string),
            lastViolation: data.last_violation as string || 'unknown'
          });
        }
      }

      return results.sort((a, b) => b.violations - a.violations);
    } catch {
      return [];
    }
  }

  /**
   * 獲取空統計資料
   */
  private getEmptyStats(): RateLimitStats {
    return {
      totalRequests: 0,
      limitedRequests: 0,
      limitRate: 0,
      last24Hours: { requests: 0, limited: 0, rate: 0 },
      lastHour: { requests: 0, limited: 0, rate: 0 },
      blockedIPs: 0,
      topOffendingIPs: []
    };
  }
}

// 創建全域監控服務實例
export const rateLimitMonitor = new RateLimitMonitoringService();

// 導出便利函數
export async function recordRateLimitEvent(
  ip: string,
  path: string,
  strategy: string,
  limited: boolean,
  details: Record<string, any> = {}
): Promise<void> {
  return rateLimitMonitor.recordRateLimitEvent(ip, path, strategy, limited, details);
}

export async function isIPBlocked(ip: string): Promise<IPBlockInfo | null> {
  return rateLimitMonitor.isIPBlocked(ip);
}

export async function blockIP(
  ip: string,
  reason: BlockReason,
  durationMs: number,
  metadata: Record<string, any> = {}
): Promise<void> {
  return rateLimitMonitor.blockIP(ip, reason, durationMs, metadata);
}

export async function unblockIP(ip: string, reason?: string): Promise<void> {
  return rateLimitMonitor.unblockIP(ip, reason);
}

export async function getRateLimitStats(): Promise<RateLimitStats> {
  return rateLimitMonitor.getStats();
}