import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixInquiryTypes() {
  try {
    console.log('🔧 開始修復詢價單類型...');
    
    // 1. 檢查修復前統計
    const { data: allInquiries } = await supabase
      .from('inquiries')
      .select('id, inquiry_type, customer_name, created_at');
    
    const stats = {
      total: allInquiries?.length || 0,
      product: allInquiries?.filter(i => i.inquiry_type === 'product').length || 0,
      farm_tour: allInquiries?.filter(i => i.inquiry_type === 'farm_tour').length || 0,
      null_type: allInquiries?.filter(i => i.inquiry_type === null).length || 0
    };
    
    console.log('📊 修復前統計:', stats);
    
    // 2. 查找包含產品項目的詢價單
    const { data: inquiriesWithItems } = await supabase
      .from('inquiry_items')
      .select('inquiry_id');
    
    const uniqueInquiryIds = [...new Set(inquiriesWithItems?.map(item => item.inquiry_id) || [])];
    console.log('📦 包含產品項目的詢價單數量:', uniqueInquiryIds.length);
    
    // 3. 更新包含產品項目的詢價單為 'product' 類型
    if (uniqueInquiryIds.length > 0) {
      const { data: updateResult, error } = await supabase
        .from('inquiries')
        .update({ 
          inquiry_type: 'product',
          updated_at: new Date().toISOString()
        })
        .in('id', uniqueInquiryIds)
        .or('inquiry_type.is.null,inquiry_type.neq.product')
        .select('id, inquiry_type, customer_name');
      
      if (error) {
        console.error('❌ 更新失敗:', error);
      } else {
        console.log('✅ 已更新', updateResult?.length || 0, '個詢價單為 product 類型');
        if (updateResult && updateResult.length > 0) {
          console.log('📋 更新的詢價單:', updateResult.map(i => `${i.customer_name}(${i.id.slice(0,8)})`));
        }
      }
    }
    
    // 4. 將其餘 NULL 類型的詢價單設為 'product'
    const { data: nullInquiries } = await supabase
      .from('inquiries')
      .select('id, customer_name')
      .is('inquiry_type', null);
    
    if (nullInquiries && nullInquiries.length > 0) {
      console.log('🔄 處理剩餘的 NULL 類型詢價單:', nullInquiries.length, '個');
      
      const { error: nullUpdateError } = await supabase
        .from('inquiries')
        .update({ 
          inquiry_type: 'product',
          updated_at: new Date().toISOString()
        })
        .is('inquiry_type', null);
        
      if (nullUpdateError) {
        console.error('❌ 更新 NULL 類型失敗:', nullUpdateError);
      } else {
        console.log('✅ 已將', nullInquiries.length, '個 NULL 類型詢價單設為 product');
      }
    }
    
    // 5. 檢查特定詢價單的狀態
    const { data: specificInquiry } = await supabase
      .from('inquiries')
      .select('id, inquiry_type, customer_name, customer_email, created_at')
      .eq('id', '0ed453f8-0961-4b68-9033-fc5cfbde3be7')
      .single();
    
    if (specificInquiry) {
      console.log('🎯 問題詢價單修復後狀態:', {
        id: specificInquiry.id.slice(0, 8) + '...',
        inquiry_type: specificInquiry.inquiry_type,
        customer_name: specificInquiry.customer_name,
        customer_email: specificInquiry.customer_email,
        created_at: new Date(specificInquiry.created_at).toLocaleString('zh-TW')
      });
    }
    
    // 6. 最終統計
    const { data: finalInquiries } = await supabase
      .from('inquiries')
      .select('inquiry_type');
    
    const finalStats = {
      total: finalInquiries?.length || 0,
      product: finalInquiries?.filter(i => i.inquiry_type === 'product').length || 0,
      farm_tour: finalInquiries?.filter(i => i.inquiry_type === 'farm_tour').length || 0,
      null_type: finalInquiries?.filter(i => i.inquiry_type === null).length || 0
    };
    
    console.log('📊 修復後統計:', finalStats);
    console.log('✅ 修復完成！');
    
  } catch (err) {
    console.error('❌ 執行錯誤:', err);
    process.exit(1);
  }
}

fixInquiryTypes();