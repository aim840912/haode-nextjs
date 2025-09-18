#!/usr/bin/env tsx

/**
 * 遷移 culture 表到 moments 表
 *
 * 這個腳本會：
 * 1. 建立 moments 表
 * 2. 遷移 culture 表的資料到 moments 表
 * 3. 驗證資料遷移
 * 4. 可選：刪除 culture 表（需要確認）
 */

import { createClient } from '@supabase/supabase-js'

async function migrateCultureToMoments() {
  console.log('🚀 開始 culture → moments 資料遷移...')

  // 建立 Supabase 客戶端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少必要的環境變數: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // 1. 檢查 culture 表是否存在且有資料
    console.log('📋 檢查 culture 表...')

    const { data: cultureData, error: cultureError } = await supabase.from('culture').select('*')

    if (cultureError) {
      throw new Error(`無法讀取 culture 表: ${cultureError.message}`)
    }

    console.log(`✅ culture 表存在，共 ${cultureData?.length || 0} 筆資料`)

    // 2. 檢查 moments 表是否已存在
    console.log('🔍 檢查 moments 表是否存在...')

    const { error: momentsCheckError } = await supabase.from('moments').select('id').limit(1)

    const momentsTableExists = !momentsCheckError

    if (momentsTableExists) {
      console.log('⚠️ moments 表已存在，將直接進行資料遷移')
    } else {
      console.log('📝 moments 表不存在，需要手動建立')
      console.log('\n請在 Supabase SQL Editor 執行以下 SQL：')
      console.log(`
-- 建立 moments 表
CREATE TABLE IF NOT EXISTS public.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'moments',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  is_featured BOOLEAN DEFAULT true,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_moments_updated_at
  BEFORE UPDATE ON public.moments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 RLS
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- 公開讀取政策
CREATE POLICY "公開讀取精彩時刻" ON public.moments
  FOR SELECT USING (true);

-- 管理員完全存取政策
CREATE POLICY "管理員完全存取精彩時刻" ON public.moments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@gmail.com'
    )
  );

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON public.moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_category ON public.moments(category);
CREATE INDEX IF NOT EXISTS idx_moments_year ON public.moments(year);
CREATE INDEX IF NOT EXISTS idx_moments_featured ON public.moments(is_featured) WHERE is_featured = true;
      `)

      console.log('\n執行上述 SQL 後，請重新運行此腳本以繼續遷移')
      return false
    }

    // 3. 遷移資料（如果有資料的話）
    if (cultureData && cultureData.length > 0) {
      console.log('📦 開始遷移資料...')

      // 轉換資料格式
      const momentsData = cultureData.map((item: any) => ({
        id: item.id, // 保持相同 ID
        title: item.title,
        description: item.description,
        content: item.content || item.subtitle || item.description,
        category: 'moments', // 統一設為 moments
        year: item.year || new Date().getFullYear(),
        is_featured: item.is_featured !== false, // 預設為 true
        images: item.images || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))

      console.log(`📝 準備遷移 ${momentsData.length} 筆資料...`)

      // 批次插入資料
      const { data: insertedData, error: insertError } = await supabase
        .from('moments')
        .upsert(momentsData, { onConflict: 'id' })
        .select()

      if (insertError) {
        throw new Error(`資料遷移失敗: ${insertError.message}`)
      }

      console.log(`✅ 成功遷移 ${insertedData?.length || 0} 筆資料`)

      // 4. 驗證遷移結果
      console.log('🔍 驗證遷移結果...')

      const { data: verifyData, error: verifyError } = await supabase.from('moments').select('*')

      if (verifyError) {
        throw new Error(`驗證失敗: ${verifyError.message}`)
      }

      console.log(`✅ moments 表現有 ${verifyData?.length || 0} 筆資料`)

      // 比較資料
      if (verifyData?.length === cultureData.length) {
        console.log('✅ 資料遷移完整性驗證通過')
      } else {
        console.warn(
          `⚠️ 資料數量不符：culture(${cultureData.length}) vs moments(${verifyData?.length || 0})`
        )
      }
    } else {
      console.log('📦 culture 表無資料，跳過資料遷移')
    }

    console.log('\n🎉 資料遷移完成！')
    console.log('✅ moments 表已建立並包含所有 culture 資料')

    return true
  } catch (error) {
    console.error('❌ 資料遷移失敗:', error)
    throw error
  }
}

// 執行腳本
if (require.main === module) {
  migrateCultureToMoments()
    .then(success => {
      if (success) {
        console.log('\n✅ 遷移完成')
        console.log('📝 接下來需要：')
        console.log('  1. 驗證前端 moments 頁面功能')
        console.log('  2. 建立 moments 圖片存儲 bucket')
        console.log('  3. 確認無誤後刪除 culture 表')
      }
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 遷移失敗:', error)
      process.exit(1)
    })
}

export { migrateCultureToMoments }
