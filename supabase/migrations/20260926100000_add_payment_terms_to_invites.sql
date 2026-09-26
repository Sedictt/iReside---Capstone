-- Add payment_terms column to tenant_intake_invites
-- Stores configured move-in payment terms (advanceMonths, securityDepositMonths, customAdvanceAmount, customSecurityDepositAmount)

ALTER TABLE public.tenant_intake_invites
ADD COLUMN IF NOT EXISTS payment_terms jsonb DEFAULT NULL;

COMMENT ON COLUMN public.tenant_intake_invites.payment_terms IS 
'Configured move-in payment terms: advanceMonths, securityDepositMonths, customAdvanceAmount, customSecurityDepositAmount';
