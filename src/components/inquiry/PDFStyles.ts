import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 12,
    fontFamily: 'Times-Roman',
  },
  
  // 頁首樣式
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
  },
  
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
    textAlign: 'center',
  },
  
  companyNameEn: {
    fontSize: 12,
    color: '#8B4513',
    marginBottom: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // 標題樣式
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333333',
  },
  
  inquiryNumber: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666666',
  },
  
  // 資訊區塊樣式
  infoSection: {
    marginBottom: 15,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#8B4513',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 3,
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  
  infoLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#555555',
  },
  
  infoValue: {
    flex: 1,
    color: '#333333',
  },
  
  // 表格樣式
  table: {
    marginVertical: 15,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    borderLeftWidth: 1,
    borderLeftColor: '#DDDDDD',
    borderRightWidth: 1,
    borderRightColor: '#DDDDDD',
    paddingVertical: 6,
    paddingHorizontal: 5,
    minHeight: 30,
  },
  
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  tableCellText: {
    fontSize: 10,
    color: '#333333',
    textAlign: 'left',
  },
  
  // 表格欄位寬度
  col1: { width: '5%' },   // 序號
  col2: { width: '35%' },  // 商品名稱
  col3: { width: '15%' },  // 分類
  col4: { width: '10%' },  // 數量
  col5: { width: '15%' },  // 單價
  col6: { width: '20%' },  // 小計
  
  // 總計區域
  totalSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#8B4513',
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  
  // 備註區域
  notesSection: {
    marginTop: 20,
  },
  
  notesContent: {
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 3,
    marginTop: 5,
  },
  
  notesText: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 1.4,
  },
  
  // 頁尾樣式
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    textAlign: 'center',
  },
  
  footerText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  
  // 狀態標籤
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 10,
  },
  
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // 狀態顏色
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  
  statusQuoted: {
    backgroundColor: '#3B82F6',
  },
  
  statusConfirmed: {
    backgroundColor: '#10B981',
  },
  
  statusCompleted: {
    backgroundColor: '#6B7280',
  },
  
  statusCancelled: {
    backgroundColor: '#EF4444',
  },
});