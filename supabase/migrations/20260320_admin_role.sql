-- ============================================================
-- Add 'admin' to user_role enum and set up admin RLS policies
-- ============================================================
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
-- Supabase CLI handles this by running it outside a transaction when
-- the file contains only DDL that requires it.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
