-- Add MercadoPago fields to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- Expand status to include aguardando_pagamento
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('aguardando_pagamento', 'pendente', 'processando', 'enviado', 'entregue', 'cancelado'));

-- Update RPC to allow aguardando_pagamento
CREATE OR REPLACE FUNCTION update_order_status(order_id UUID, new_status TEXT, new_tracking TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (SELECT is_admin FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE orders
  SET status = new_status,
      tracking_code = COALESCE(new_tracking, tracking_code),
      updated_at = now()
  WHERE id = order_id;
END;
$$;
