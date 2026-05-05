-- Enhance move_out_requests table to support full workflow
ALTER TABLE move_out_requests
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS denied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS denial_reason TEXT,
  ADD COLUMN IF NOT EXISTS inspection_date DATE,
  ADD COLUMN IF NOT EXISTS inspection_notes TEXT,
  ADD COLUMN IF NOT EXISTS inspection_photos TEXT[],
  ADD COLUMN IF NOT EXISTS deposit_deductions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deposit_refund_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS checklist_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checklist_data JSONB DEFAULT '{}'::jsonb;

-- Ensure JSONB columns have default values if they are null
UPDATE move_out_requests SET deposit_deductions = '{}'::jsonb WHERE deposit_deductions IS NULL;
UPDATE move_out_requests SET checklist_data = '{}'::jsonb WHERE checklist_data IS NULL;
