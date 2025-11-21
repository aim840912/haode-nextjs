-- Migration: 新增藍新金流相關欄位
-- 日期: 2025-11-21
-- 說明: 擴充 orders 表的付款欄位，並建立 payment_logs 表用於記錄金流回調

-- =====================================================
-- 1. 擴充 orders 表的付款相關欄位
-- =====================================================
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_trade_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_bank_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS payment_va_account VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_expire_date TIMESTAMPTZ;

-- 新增索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_orders_payment_trade_no
ON public.orders(payment_trade_no);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON public.orders(payment_status);

-- 欄位說明
COMMENT ON COLUMN public.orders.payment_trade_no IS '藍新交易編號';
COMMENT ON COLUMN public.orders.payment_time IS '付款完成時間';
COMMENT ON COLUMN public.orders.payment_bank_code IS 'ATM 銀行代碼';
COMMENT ON COLUMN public.orders.payment_va_account IS 'ATM 虛擬帳號';
COMMENT ON COLUMN public.orders.payment_expire_date IS 'ATM/超商繳費期限';

-- =====================================================
-- 2. 建立 payment_logs 表
-- =====================================================
-- 用於記錄所有金流回調，方便除錯和對帳
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  trade_no VARCHAR(100),
  merchant_order_no VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  message VARCHAR(255),
  amount NUMERIC NOT NULL,
  payment_type VARCHAR(50),
  bank_code VARCHAR(10),
  raw_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id
ON public.payment_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_logs_trade_no
ON public.payment_logs(trade_no);

CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at
ON public.payment_logs(created_at);

-- 欄位說明
COMMENT ON TABLE public.payment_logs IS '金流回調記錄表，用於除錯和對帳';
COMMENT ON COLUMN public.payment_logs.trade_no IS '藍新交易編號';
COMMENT ON COLUMN public.payment_logs.merchant_order_no IS '商店訂單編號';
COMMENT ON COLUMN public.payment_logs.status IS '付款狀態代碼';
COMMENT ON COLUMN public.payment_logs.message IS '付款狀態訊息';
COMMENT ON COLUMN public.payment_logs.payment_type IS '付款方式：CREDIT, VACC, CVS, WEBATM';
COMMENT ON COLUMN public.payment_logs.raw_data IS '完整回調資料（JSON）';
COMMENT ON COLUMN public.payment_logs.ip_address IS '回調來源 IP';

-- =====================================================
-- 3. 啟用 RLS 並設定政策
-- =====================================================
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己訂單的付款記錄
CREATE POLICY "Users can view own payment logs" ON public.payment_logs
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- 管理員可以查看所有付款記錄
CREATE POLICY "Admin can view all payment logs" ON public.payment_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 只有系統（service role）可以新增付款記錄
CREATE POLICY "Service role can insert payment logs" ON public.payment_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 4. 更新付款狀態的函數
-- =====================================================
CREATE OR REPLACE FUNCTION update_order_payment_status(
  p_order_id UUID,
  p_status VARCHAR,
  p_trade_no VARCHAR DEFAULT NULL,
  p_payment_time TIMESTAMPTZ DEFAULT NULL,
  p_bank_code VARCHAR DEFAULT NULL,
  p_va_account VARCHAR DEFAULT NULL,
  p_expire_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.orders
  SET
    payment_status = p_status,
    payment_trade_no = COALESCE(p_trade_no, payment_trade_no),
    payment_time = COALESCE(p_payment_time, payment_time),
    payment_bank_code = COALESCE(p_bank_code, payment_bank_code),
    payment_va_account = COALESCE(p_va_account, payment_va_account),
    payment_expire_date = COALESCE(p_expire_date, payment_expire_date),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$$;

COMMENT ON FUNCTION update_order_payment_status IS '更新訂單付款狀態，用於金流回調處理';
