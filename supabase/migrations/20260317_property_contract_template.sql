ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS contract_template jsonb;
