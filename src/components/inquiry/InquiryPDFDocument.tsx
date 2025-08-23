import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { InquiryWithItems, InquiryUtils, INQUIRY_STATUS_LABELS } from '@/types/inquiry';
import { pdfStyles } from './PDFStyles';

interface InquiryPDFDocumentProps {
  inquiry: InquiryWithItems;
}

export const InquiryPDFDocument: React.FC<InquiryPDFDocumentProps> = ({ inquiry }) => {
  // 格式化金額
  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 取得狀態樣式
  const getStatusStyle = (status: string) => {
    const baseStyle = [pdfStyles.statusBadge];
    switch (status) {
      case 'pending':
        return [...baseStyle, pdfStyles.statusPending];
      case 'quoted':
        return [...baseStyle, pdfStyles.statusQuoted];
      case 'confirmed':
        return [...baseStyle, pdfStyles.statusConfirmed];
      case 'completed':
        return [...baseStyle, pdfStyles.statusCompleted];
      case 'cancelled':
        return [...baseStyle, pdfStyles.statusCancelled];
      default:
        return [...baseStyle, pdfStyles.statusPending];
    }
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* 頁首 */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>豪德茶業</Text>
          <Text style={pdfStyles.companyNameEn}>HAUDE TEA</Text>
        </View>

        {/* 標題和詢價單編號 */}
        <Text style={pdfStyles.title}>詢價單</Text>
        <Text style={pdfStyles.inquiryNumber}>
          編號：{InquiryUtils.formatInquiryNumber(inquiry)}
        </Text>

        {/* 狀態標籤 */}
        <View style={getStatusStyle(inquiry.status)}>
          <Text style={pdfStyles.statusText}>
            {INQUIRY_STATUS_LABELS[inquiry.status as keyof typeof INQUIRY_STATUS_LABELS]}
          </Text>
        </View>

        {/* 客戶資訊 */}
        <View style={pdfStyles.infoSection}>
          <Text style={pdfStyles.sectionTitle}>客戶資訊</Text>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>姓名：</Text>
            <Text style={pdfStyles.infoValue}>{inquiry.customer_name}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Email：</Text>
            <Text style={pdfStyles.infoValue}>{inquiry.customer_email}</Text>
          </View>
          {inquiry.customer_phone && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>電話：</Text>
              <Text style={pdfStyles.infoValue}>{inquiry.customer_phone}</Text>
            </View>
          )}
          {inquiry.delivery_address && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>地址：</Text>
              <Text style={pdfStyles.infoValue}>{inquiry.delivery_address}</Text>
            </View>
          )}
        </View>

        {/* 詢價資訊 */}
        <View style={pdfStyles.infoSection}>
          <Text style={pdfStyles.sectionTitle}>詢價資訊</Text>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>建立日期：</Text>
            <Text style={pdfStyles.infoValue}>{formatDate(inquiry.created_at)}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>更新日期：</Text>
            <Text style={pdfStyles.infoValue}>{formatDate(inquiry.updated_at)}</Text>
          </View>
          {inquiry.preferred_delivery_date && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>希望到貨：</Text>
              <Text style={pdfStyles.infoValue}>
                {formatDate(inquiry.preferred_delivery_date)}
              </Text>
            </View>
          )}
        </View>

        {/* 商品清單標題 */}
        <View style={pdfStyles.infoSection}>
          <Text style={pdfStyles.sectionTitle}>商品清單</Text>
        </View>

        {/* 表格標頭 */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <View style={pdfStyles.col1}>
              <Text style={pdfStyles.tableHeaderText}>序號</Text>
            </View>
            <View style={pdfStyles.col2}>
              <Text style={pdfStyles.tableHeaderText}>商品名稱</Text>
            </View>
            <View style={pdfStyles.col3}>
              <Text style={pdfStyles.tableHeaderText}>分類</Text>
            </View>
            <View style={pdfStyles.col4}>
              <Text style={pdfStyles.tableHeaderText}>數量</Text>
            </View>
            <View style={pdfStyles.col5}>
              <Text style={pdfStyles.tableHeaderText}>單價</Text>
            </View>
            <View style={pdfStyles.col6}>
              <Text style={pdfStyles.tableHeaderText}>小計</Text>
            </View>
          </View>

          {/* 表格內容 */}
          {inquiry.inquiry_items.map((item, index) => (
            <View key={item.id} style={pdfStyles.tableRow}>
              <View style={pdfStyles.col1}>
                <Text style={pdfStyles.tableCellText}>{index + 1}</Text>
              </View>
              <View style={pdfStyles.col2}>
                <Text style={pdfStyles.tableCellText}>{item.product_name}</Text>
              </View>
              <View style={pdfStyles.col3}>
                <Text style={pdfStyles.tableCellText}>
                  {item.product_category || '-'}
                </Text>
              </View>
              <View style={pdfStyles.col4}>
                <Text style={pdfStyles.tableCellText}>{item.quantity}</Text>
              </View>
              <View style={pdfStyles.col5}>
                <Text style={pdfStyles.tableCellText}>
                  {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                </Text>
              </View>
              <View style={pdfStyles.col6}>
                <Text style={pdfStyles.tableCellText}>
                  {formatCurrency(item.total_price || (item.unit_price || 0) * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 總計區域 */}
        <View style={pdfStyles.totalSection}>
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>商品總數量：</Text>
            <Text style={pdfStyles.totalValue}>
              {InquiryUtils.calculateTotalQuantity(inquiry)} 件
            </Text>
          </View>
          <View style={pdfStyles.grandTotalRow}>
            <Text style={pdfStyles.grandTotalLabel}>總金額：</Text>
            <Text style={pdfStyles.grandTotalValue}>
              {formatCurrency(InquiryUtils.calculateTotalAmount(inquiry))}
            </Text>
          </View>
        </View>

        {/* 客戶備註 */}
        {inquiry.notes && (
          <View style={pdfStyles.notesSection}>
            <Text style={pdfStyles.sectionTitle}>客戶備註</Text>
            <View style={pdfStyles.notesContent}>
              <Text style={pdfStyles.notesText}>{inquiry.notes}</Text>
            </View>
          </View>
        )}

        {/* 頁尾 */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>感謝您的詢價，我們將儘快為您提供最優惠的報價</Text>
          <Text style={pdfStyles.footerText}>
            如有任何問題，請聯繫我們 | 豪德茶業 HAUDE TEA
          </Text>
          <Text style={pdfStyles.footerText}>
            列印時間：{new Date().toLocaleString('zh-TW')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};