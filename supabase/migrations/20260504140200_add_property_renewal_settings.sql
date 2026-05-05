-- Migration: Add renewal_settings to properties
-- Description: Stores property-specific renewal policies (rent adjustments, rule changes, memos)

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS renewal_settings jsonb DEFAULT '{
  "base_rent_adjustment": 0,
  "adjustment_type": "percentage",
  "new_rules": [],
  "landlord_memo": "",
  "is_enabled": true
}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.properties.renewal_settings IS 'Stores renewal policy configuration including rent adjustments and rule updates.';
