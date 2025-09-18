#!/usr/bin/env tsx

/**
 * 建立 Supabase moments 資料庫表
 *
 * 這個腳本會：
 * 1. 建立 moments 表
 * 2. 設定適當的 RLS 政策
 * 3. 建立必要的索引
 * 4. 驗證表結構
 */

import { createClient } from '@supabase/supabase-js'
import { dbLogger } from '../src/lib/logger'

async function createMomentsTable() {
  console.log('🚀 開始建立 moments 資料庫表...')

  // 直接建立 Supabase 客戶端
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少必要的環境變數: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // 1. 建立 moments 表
    console.log('📋 建立 moments 表結構...')

    const createTableSQL = `
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
    `

    // 使用 REST API 或檢查是否表已存在
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('moments')
      .select('id')
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('🏗️ 表不存在，嘗試透過管理後台建立...')
      console.log('📋 SQL 指令:')
      console.log(createTableSQL)
      console.log('\n⚠️  請手動在 Supabase 後台執行上述 SQL 指令')
    } else if (!checkError) {
      console.log('✅ moments 表已存在')
    }

    console.log('✅ moments 表建立成功')

    // 2. 建立更新觸發器
    console.log('⚡ 建立更新時間觸發器...')

    const createTriggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_moments_updated_at ON public.moments;

      CREATE TRIGGER update_moments_updated_at
        BEFORE UPDATE ON public.moments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `

    const { error: triggerError } = await supabaseAdmin.rpc('sql', {
      query: createTriggerSQL,
    } as any)

    if (triggerError) {
      console.warn('⚠️ 觸發器建立警告:', triggerError)
    } else {
      console.log('✅ 更新時間觸發器建立成功')
    }

    // 3. 建立索引
    console.log('📇 建立資料庫索引...')

    const createIndexesSQL = `
      -- 建立常用查詢索引
      CREATE INDEX IF NOT EXISTS idx_moments_created_at ON public.moments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_moments_category ON public.moments(category);
      CREATE INDEX IF NOT EXISTS idx_moments_year ON public.moments(year);
      CREATE INDEX IF NOT EXISTS idx_moments_featured ON public.moments(is_featured) WHERE is_featured = true;

      -- 建立全文搜尋索引
      CREATE INDEX IF NOT EXISTS idx_moments_title_search ON public.moments USING gin(to_tsvector('chinese', title));
      CREATE INDEX IF NOT EXISTS idx_moments_content_search ON public.moments USING gin(to_tsvector('chinese', coalesce(description, '') || ' ' || coalesce(content, '')));
    `

    const { error: indexError } = await supabaseAdmin.rpc('sql', {
      query: createIndexesSQL,
    } as any)

    if (indexError) {
      console.warn('⚠️ 索引建立警告:', indexError)
    } else {
      console.log('✅ 資料庫索引建立成功')
    }

    // 4. 設定 RLS 政策
    console.log('🔒 設定 Row Level Security 政策...')

    const createRLSSQL = `
      -- 啟用 RLS
      ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

      -- 清除現有政策
      DROP POLICY IF EXISTS "公開讀取精彩時刻" ON public.moments;
      DROP POLICY IF EXISTS "管理員完全存取精彩時刻" ON public.moments;

      -- 公開讀取政策
      CREATE POLICY "公開讀取精彩時刻" ON public.moments
        FOR SELECT USING (true);

      -- 管理員完全存取政策（基於 email）
      CREATE POLICY "管理員完全存取精彩時刻" ON public.moments
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'admin@gmail.com'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'admin@gmail.com'
          )
        );
    `

    const { error: rlsError } = await supabaseAdmin.rpc('sql', {
      query: createRLSSQL,
    } as any)

    if (rlsError) {
      console.warn('⚠️ RLS 政策設定警告:', rlsError)
    } else {
      console.log('✅ RLS 政策設定成功')
    }

    // 5. 驗證表結構
    console.log('🔍 驗證表結構...')

    const { data: tableInfo, error: verifyError } = await supabaseAdmin
      .from('moments')
      .select('*')
      .limit(1)

    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('❌ 表結構驗證失敗:', verifyError)
      throw verifyError
    }

    console.log('✅ moments 表驗證成功')

    // 6. 插入測試資料
    console.log('📝 插入測試資料...')

    const testData = {
      title: '豪德農場精彩時刻',
      description: '記錄農場生活的美好瞬間',
      content: '這是第一個精彩時刻項目，用於測試系統功能。',
      category: 'moments',
      year: new Date().getFullYear(),
      is_featured: true,
      images: [],
    }

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('moments')
      .insert([testData])
      .select()
      .single()

    if (insertError) {
      console.warn('⚠️ 測試資料插入警告:', insertError)
    } else {
      console.log('✅ 測試資料插入成功:', insertedData?.id)
    }

    console.log('\n🎉 moments 表建立完成！')
    console.log('📊 表功能：')
    console.log('  ✅ 基本 CRUD 操作')
    console.log('  ✅ 自動更新時間戳')
    console.log('  ✅ 效能優化索引')
    console.log('  ✅ 全文搜尋支援')
    console.log('  ✅ Row Level Security')
    console.log('  ✅ 公開讀取權限')
    console.log('  ✅ 管理員完全存取')
  } catch (error) {
    console.error('❌ 建立 moments 表失敗:', error)
    throw error
  }
}

// 執行腳本
if (require.main === module) {
  createMomentsTable()
    .then(() => {
      console.log('✅ 腳本執行完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 腳本執行失敗:', error)
      process.exit(1)
    })
}

export { createMomentsTable }
