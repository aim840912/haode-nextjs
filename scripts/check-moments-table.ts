#!/usr/bin/env tsx

/**
 * 檢查和測試 Supabase moments 資料庫表
 */

import { createClient } from '@supabase/supabase-js'

async function checkMomentsTable() {
  console.log('🔍 檢查 moments 資料庫表...')

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
    // 檢查表是否存在
    console.log('📋 檢查 moments 表是否存在...')

    const { data, error } = await supabase.from('moments').select('*').limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ moments 表不存在')
        console.log('\n📝 請在 Supabase SQL Editor 執行以下 SQL：')
        console.log(`
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
        `)
        return false
      } else {
        console.error('❌ 檢查表時發生錯誤:', error)
        throw error
      }
    }

    console.log('✅ moments 表存在')
    console.log('📊 表中資料數量:', data?.length || 0)

    // 測試插入功能
    console.log('🧪 測試插入功能...')

    const testData = {
      title: '測試精彩時刻',
      description: '這是一個測試項目',
      content: '測試內容',
      category: 'moments',
      year: new Date().getFullYear(),
      is_featured: true,
      images: [],
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('moments')
      .insert([testData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ 插入測試失敗:', insertError)
      throw insertError
    }

    console.log('✅ 插入測試成功:', insertedData.id)

    // 測試查詢功能
    console.log('🔍 測試查詢功能...')

    const { data: queryData, error: queryError } = await supabase
      .from('moments')
      .select('*')
      .eq('id', insertedData.id)
      .single()

    if (queryError) {
      console.error('❌ 查詢測試失敗:', queryError)
      throw queryError
    }

    console.log('✅ 查詢測試成功:', queryData.title)

    // 清理測試資料
    console.log('🧹 清理測試資料...')

    const { error: deleteError } = await supabase.from('moments').delete().eq('id', insertedData.id)

    if (deleteError) {
      console.warn('⚠️ 清理測試資料警告:', deleteError)
    } else {
      console.log('✅ 測試資料清理完成')
    }

    console.log('\n🎉 moments 表檢查完成！')
    console.log('✅ 表存在且功能正常')
    return true
  } catch (error) {
    console.error('❌ 檢查 moments 表失敗:', error)
    throw error
  }
}

// 執行腳本
if (require.main === module) {
  checkMomentsTable()
    .then(exists => {
      if (exists) {
        console.log('✅ 檢查完成 - moments 表可用')
      } else {
        console.log('⚠️ 檢查完成 - 需要建立 moments 表')
      }
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 檢查失敗:', error)
      process.exit(1)
    })
}

export { checkMomentsTable }
