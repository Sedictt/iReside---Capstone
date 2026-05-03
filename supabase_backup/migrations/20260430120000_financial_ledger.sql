-- Financial Ledger & Expenses Migration

BEGIN;

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('maintenance', 'utilities', 'taxes', 'other')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date_incurred DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Landlords can manage their own expenses"
    ON public.expenses
    FOR ALL
    USING (auth.uid() = landlord_id);

-- Optional: Seed some data for the active landlord
-- Landlord 1: 11111111-1111-1111-1111-111111111111
-- Property 1 (Maple Grove): aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1

INSERT INTO public.expenses (id, landlord_id, property_id, category, amount, date_incurred, description) VALUES
    ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f101', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'maintenance', 2500.00, '2024-05-01', 'Plumbing repair for Unit 101'),
    ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f102', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'utilities', 4500.00, '2024-05-15', 'Common area electricity bill')
ON CONFLICT (id) DO NOTHING;

COMMIT;
