-- Fix failed edit on transactions: add missing updated_at column that a trigger expects
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
