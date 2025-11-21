-- Migration: 移除未使用的資料表
-- 日期: 2025-11-21
-- 說明: 清理專案中未使用的資料表，保持資料庫架構整潔
--
-- 移除的資料表：
-- 1. culture - 完全未使用，無任何程式碼引用，0 筆資料
-- 2. product_images - 已被 images 統一架構取代，資料已遷移
-- 3. location_id_mapping - 遷移輔助表，UUID 遷移已完成，0 筆資料

-- =====================================================
-- 1. 刪除 culture 表
-- =====================================================
-- 此表從未在應用程式中使用，僅存在於類型定義中
DROP TABLE IF EXISTS public.culture CASCADE;

-- =====================================================
-- 2. 刪除 product_images 表
-- =====================================================
-- 此表已被統一的 images 表取代
-- images 表使用 module='products' 和 entity_id 來管理產品圖片
-- 驗證：原有 1 筆資料已存在於 images 表中
DROP TABLE IF EXISTS public.product_images CASCADE;

-- =====================================================
-- 3. 刪除 location_id_mapping 表
-- =====================================================
-- 此表是 UUID 遷移的輔助對應表
-- locations 表已成功遷移至 UUID，此表不再需要
DROP TABLE IF EXISTS public.location_id_mapping CASCADE;

-- =====================================================
-- 更新 schema 註解
-- =====================================================
COMMENT ON SCHEMA public IS 'Standard public schema - cleaned unused tables (culture, product_images, location_id_mapping) on 2025-11-21';
