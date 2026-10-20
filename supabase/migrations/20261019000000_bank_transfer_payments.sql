-- Bank transfer as a payment method
--
-- GCash caps a single transfer at PHP 50,000, which move-in payments (advance +
-- deposit) and multi-month advances often exceed. Landlords can now save one
-- bank account next to their GCash wallet, and tenants can pay into it (InstaPay,
-- PESONet or an over-the-counter deposit) and upload proof, exactly like GCash.
--
--   payment_intent_method        gains 'bank_transfer' (tenant proof submissions)
--   landlord_payment_destinations accepts provider 'bank_transfer' and stores the
--                                 bank's name; UNIQUE (landlord_id, provider)
--                                 already limits it to one bank account each.
--
-- payment_method already includes 'bank_transfer', and the destination RLS
-- policies do not depend on the provider, so neither needs a change.

ALTER TYPE public.payment_intent_method ADD VALUE IF NOT EXISTS 'bank_transfer';

ALTER TABLE public.landlord_payment_destinations
  ADD COLUMN IF NOT EXISTS bank_name text;

ALTER TABLE public.landlord_payment_destinations
  DROP CONSTRAINT IF EXISTS landlord_payment_destinations_provider_check;

ALTER TABLE public.landlord_payment_destinations
  ADD CONSTRAINT landlord_payment_destinations_provider_check
  CHECK (provider IN ('gcash', 'bank_transfer'));

-- A bank destination is useless to tenants without the bank's name.
ALTER TABLE public.landlord_payment_destinations
  DROP CONSTRAINT IF EXISTS landlord_payment_destinations_bank_name_check;

ALTER TABLE public.landlord_payment_destinations
  ADD CONSTRAINT landlord_payment_destinations_bank_name_check
  CHECK (provider <> 'bank_transfer' OR length(btrim(coalesce(bank_name, ''))) > 0);
