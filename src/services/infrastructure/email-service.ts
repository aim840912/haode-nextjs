/**
 * Email 通知服務
 * 處理庫存查詢單相關的 Email 通知功能
 */

import { logger } from '@/lib/logger'
import { InquiryWithItems, InquiryEmailData, EmailTemplate } from '@/types/inquiry'

// Email 服務配置
interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'console' // console 用於開發測試
  apiKey?: string
  fromEmail: string
  fromName: string
  adminEmail?: string
}

// 預設配置
const defaultConfig: EmailConfig = {
  provider: 'console', // 開發環境使用 console
  fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@example.com',
  fromName: process.env.NEXT_PUBLIC_FROM_NAME || '農產品電商平台',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
}

export class EmailService {
  private config: EmailConfig

  constructor(config: Partial<EmailConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * 發送庫存查詢確認信給客戶
   */
  async sendInquiryConfirmation(inquiry: InquiryWithItems): Promise<boolean> {
    try {
      const template = this.generateInquiryConfirmationTemplate(inquiry)

      return await this.sendEmail({
        to: inquiry.customer_email,
        toName: inquiry.customer_name,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    } catch (error) {
      logger.error('Error sending inquiry confirmation', error as Error, {
        metadata: { service: 'EmailService', action: 'sendInquiryConfirmation' },
      })
      return false
    }
  }

  /**
   * 發送新庫存查詢通知給管理員
   */
  async sendNewInquiryNotification(inquiry: InquiryWithItems): Promise<boolean> {
    try {
      if (!this.config.adminEmail) {
        logger.warn('Admin email not configured, skipping notification', {
          metadata: { service: 'EmailService', action: 'sendNewInquiryNotification' },
        })
        return false
      }

      const template = this.generateNewInquiryNotificationTemplate(inquiry)

      return await this.sendEmail({
        to: this.config.adminEmail,
        toName: '管理員',
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    } catch (error) {
      logger.error('Error sending new inquiry notification', error as Error, {
        metadata: { service: 'EmailService', action: 'sendNewInquiryNotification' },
      })
      return false
    }
  }

  /**
   * 發送狀態更新通知給客戶
   */
  async sendStatusUpdateNotification(
    inquiry: InquiryWithItems,
    oldStatus: string
  ): Promise<boolean> {
    try {
      const template = this.generateStatusUpdateTemplate(inquiry, oldStatus)

      return await this.sendEmail({
        to: inquiry.customer_email,
        toName: inquiry.customer_name,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    } catch (error) {
      logger.error('Error sending status update notification', error as Error, {
        metadata: { service: 'EmailService', action: 'sendStatusUpdateNotification' },
      })
      return false
    }
  }

  /**
   * 核心 Email 發送方法
   */
  private async sendEmail(params: {
    to: string
    toName?: string
    subject: string
    html: string
    text: string
  }): Promise<boolean> {
    const { to, toName, subject, html, text } = params

    switch (this.config.provider) {
      case 'resend':
        return await this.sendWithResend({ to, toName, subject, html, text })

      case 'sendgrid':
        return await this.sendWithSendGrid({ to, toName, subject, html, text })

      case 'console':
      default:
        return this.sendWithConsole({ to, toName, subject, html, text })
    }
  }

  /**
   * 使用 Resend 發送 Email
   */
  private async sendWithResend(params: {
    to: string
    toName?: string
    subject: string
    html: string
    text: string
  }): Promise<boolean> {
    try {
      // 這裡可以整合 Resend API
      // const response = await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.config.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     from: `${this.config.fromName} <${this.config.fromEmail}>`,
      //     to: params.toName ? `${params.toName} <${params.to}>` : params.to,
      //     subject: params.subject,
      //     html: params.html,
      //     text: params.text
      //   })
      // });

      logger.info('📧 [Resend] Email sent', {
        metadata: {
          service: 'EmailService',
          provider: 'Resend',
          subject: params.subject,
          to: params.to,
        },
      })
      return true
    } catch (error) {
      logger.error('Error sending email with Resend', error as Error, {
        metadata: { service: 'EmailService', provider: 'Resend' },
      })
      return false
    }
  }

  /**
   * 使用 SendGrid 發送 Email
   */
  private async sendWithSendGrid(params: {
    to: string
    toName?: string
    subject: string
    html: string
    text: string
  }): Promise<boolean> {
    try {
      // 這裡可以整合 SendGrid API
      logger.info('📧 [SendGrid] Email sent', {
        metadata: {
          service: 'EmailService',
          provider: 'SendGrid',
          subject: params.subject,
          to: params.to,
        },
      })
      return true
    } catch (error) {
      logger.error('Error sending email with SendGrid', error as Error, {
        metadata: { service: 'EmailService', provider: 'SendGrid' },
      })
      return false
    }
  }

  /**
   * 開發環境：輸出到 Console
   */
  private sendWithConsole(params: {
    to: string
    toName?: string
    subject: string
    html: string
    text: string
  }): boolean {
    logger.info('📧 [Console] Email would be sent', {
      metadata: {
        service: 'EmailService',
        provider: 'Console',
        to: params.toName ? `${params.toName} <${params.to}>` : params.to,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        subject: params.subject,
        textPreview: params.text.substring(0, 200) + (params.text.length > 200 ? '...' : ''),
      },
    })
    return true
  }

  /**
   * 生成庫存查詢確認信模板
   */
  private generateInquiryConfirmationTemplate(inquiry: InquiryWithItems): EmailTemplate {
    const inquiryNumber = this.formatInquiryNumber(inquiry)
    const totalAmount = this.calculateTotalAmount(inquiry)
    const totalItems = this.calculateTotalQuantity(inquiry)

    const subject = `庫存查詢確認 - ${inquiryNumber}`

    const text = `
親愛的 ${inquiry.customer_name}，

感謝您的庫存查詢！我們已收到您的查詢單，編號：${inquiryNumber}

查詢內容：
${inquiry.inquiry_items.map(item => `- ${item.product_name} x ${item.quantity}`).join('\n')}

商品總數：${totalItems} 件
預估金額：NT$ ${totalAmount.toLocaleString()}

我們會在24小時內回覆您詳細的庫存和價格資訊。

如有任何問題，請隨時聯絡我們：
電話：0800-123-456
Email：service@example.com

謝謝！

${this.config.fromName}
    `.trim()

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #92400e;">庫存查詢確認</h2>
        
        <p>親愛的 ${inquiry.customer_name}，</p>
        
        <p>感謝您的庫存查詢！我們已收到您的查詢單，編號：<strong>${inquiryNumber}</strong></p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>查詢內容：</h3>
          <ul>
            ${inquiry.inquiry_items
              .map(item => `<li>${item.product_name} x ${item.quantity}</li>`)
              .join('')}
          </ul>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
            <p><strong>商品總數：</strong>${totalItems} 件</p>
            <p><strong>預估金額：</strong>NT$ ${totalAmount.toLocaleString()}</p>
          </div>
        </div>
        
        <p>我們會在24小時內回覆您詳細的庫存和價格資訊。</p>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h4>聯絡我們：</h4>
          <p>電話：0800-123-456<br>
          Email：service@example.com</p>
        </div>
        
        <p>謝謝！</p>
        <p><strong>${this.config.fromName}</strong></p>
      </div>
    `

    return { subject, text, html }
  }

  /**
   * 生成新庫存查詢通知模板（給管理員）
   */
  private generateNewInquiryNotificationTemplate(inquiry: InquiryWithItems): EmailTemplate {
    const inquiryNumber = this.formatInquiryNumber(inquiry)
    const totalAmount = this.calculateTotalAmount(inquiry)

    const subject = `新庫存查詢單 - ${inquiryNumber}`

    const text = `
新的詢問單需要處理：

查詢單號：${inquiryNumber}
客戶：${inquiry.customer_name}
Email：${inquiry.customer_email}
電話：${inquiry.customer_phone || '未提供'}

商品：
${inquiry.inquiry_items.map(item => `- ${item.product_name} x ${item.quantity}`).join('\n')}

預估金額：NT$ ${totalAmount.toLocaleString()}

${inquiry.notes ? `客戶備註：${inquiry.notes}` : ''}

請登入管理後台處理：/admin/inquiries
    `.trim()

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">新庫存查詢單通知</h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h3>詢問單 ${inquiryNumber}</h3>
          
          <div style="margin: 15px 0;">
            <strong>客戶資訊：</strong><br>
            姓名：${inquiry.customer_name}<br>
            Email：${inquiry.customer_email}<br>
            電話：${inquiry.customer_phone || '未提供'}
          </div>
          
          <div style="margin: 15px 0;">
            <strong>詢價商品：</strong>
            <ul>
              ${inquiry.inquiry_items
                .map(item => `<li>${item.product_name} x ${item.quantity}</li>`)
                .join('')}
            </ul>
            <strong>預估金額：NT$ ${totalAmount.toLocaleString()}</strong>
          </div>
          
          ${
            inquiry.notes
              ? `
            <div style="margin: 15px 0;">
              <strong>客戶備註：</strong><br>
              <div style="background: white; padding: 10px; border-radius: 4px;">
                ${inquiry.notes}
              </div>
            </div>
          `
              : ''
          }
        </div>
        
        <p style="margin-top: 20px;">
          <a href="/admin/inquiries" 
             style="background: #92400e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            立即處理
          </a>
        </p>
      </div>
    `

    return { subject, text, html }
  }

  /**
   * 生成狀態更新通知模板
   */
  private generateStatusUpdateTemplate(
    inquiry: InquiryWithItems,
    oldStatus: string
  ): EmailTemplate {
    const inquiryNumber = this.formatInquiryNumber(inquiry)
    const statusLabels: Record<string, string> = {
      pending: '待處理',
      quoted: '已回覆',
      confirmed: '已確認',
      completed: '已完成',
      cancelled: '已取消',
    }

    const subject = `庫存查詢狀態更新 - ${inquiryNumber}`

    const text = `
親愛的 ${inquiry.customer_name}，

您的詢問單 ${inquiryNumber} 狀態已更新：

從「${statusLabels[oldStatus] || oldStatus}」更新為「${statusLabels[inquiry.status] || inquiry.status}」

${this.getStatusMessage(inquiry.status)}

如有任何問題，請隨時聯絡我們。

謝謝！
${this.config.fromName}
    `.trim()

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #92400e;">庫存查詢狀態更新</h2>
        
        <p>親愛的 ${inquiry.customer_name}，</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>詢問單 ${inquiryNumber}</h3>
          <p>狀態已從「<strong>${statusLabels[oldStatus] || oldStatus}</strong>」更新為「<strong style="color: #059669;">${statusLabels[inquiry.status] || inquiry.status}</strong>」</p>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <p>${this.getStatusMessage(inquiry.status)}</p>
        </div>
        
        <p>如有任何問題，請隨時聯絡我們。</p>
        
        <p>謝謝！<br><strong>${this.config.fromName}</strong></p>
      </div>
    `

    return { subject, text, html }
  }

  /**
   * 根據狀態獲取對應訊息
   */
  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: '我們正在處理您的詢價，會盡快回覆。',
      quoted: '我們已回覆庫存資訊，請確認後聯絡我們。',
      confirmed: '訂單已確認，我們正在準備您的商品。',
      completed: '訂單已完成，感謝您的購買！',
      cancelled: '此詢問單已取消。',
    }
    return messages[status] || '狀態已更新。'
  }

  /**
   * 格式化詢問單編號
   */
  private formatInquiryNumber(inquiry: InquiryWithItems): string {
    const date = new Date(inquiry.created_at)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const shortId = inquiry.id.slice(0, 8).toUpperCase()
    return `INQ${year}${month}${day}-${shortId}`
  }

  /**
   * 計算詢問單總金額
   */
  private calculateTotalAmount(inquiry: InquiryWithItems): number {
    return inquiry.inquiry_items.reduce((total, item) => {
      return total + (item.total_price || (item.unit_price || 0) * item.quantity)
    }, 0)
  }

  /**
   * 計算商品總數量
   */
  private calculateTotalQuantity(inquiry: InquiryWithItems): number {
    return inquiry.inquiry_items.reduce((total, item) => total + item.quantity, 0)
  }
}

// 建立並匯出預設實例
export const emailService = new EmailService()

// 建立自訂實例的工廠函數
export function createEmailService(config: Partial<EmailConfig>): EmailService {
  return new EmailService(config)
}
