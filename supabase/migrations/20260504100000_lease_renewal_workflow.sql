-- Lease Renewal Workflow Migration
-- Created: 2026-05-04

-- 1. Create renewal_status enum
DO $$ BEGIN
    CREATE TYPE public.renewal_status AS ENUM ('pending', 'approved', 'rejected', 'signed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create renewal_requests table
CREATE TABLE IF NOT EXISTS public.renewal_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    current_lease_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    landlord_id uuid NOT NULL,
    proposed_start_date date,
    proposed_end_date date,
    proposed_monthly_rent numeric(12,2),
    proposed_security_deposit numeric(12,2),
    terms_json jsonb,
    status public.renewal_status NOT NULL DEFAULT 'pending'::public.renewal_status,
    landlord_notes text,
    new_lease_id uuid,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    CONSTRAINT renewal_requests_pkey PRIMARY KEY (id),
    CONSTRAINT renewal_requests_current_lease_id_fkey FOREIGN KEY (current_lease_id) REFERENCES public.leases(id) ON DELETE CASCADE,
    CONSTRAINT renewal_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT renewal_requests_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT renewal_requests_new_lease_id_fkey FOREIGN KEY (new_lease_id) REFERENCES public.leases(id) ON DELETE SET NULL
);

-- Create partial unique index to ensure only one pending renewal exists per lease
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_renewal ON public.renewal_requests (current_lease_id) WHERE (status = 'pending');

-- 3. Add renewal_window_days to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS renewal_window_days integer NOT NULL DEFAULT 90;

-- 4. Create indexes on renewal_requests
CREATE INDEX IF NOT EXISTS idx_renewal_requests_landlord_id ON public.renewal_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_tenant_id ON public.renewal_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_lease_id ON public.renewal_requests(current_lease_id);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_status ON public.renewal_requests(status);
CREATE INDEX IF NOT EXISTS idx_renewal_requests_created_at ON public.renewal_requests(created_at DESC);

-- 5. Add notification types to existing enum
DO $$ BEGIN
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lease_renewal_available';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lease_renewal_request';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lease_renewal_approved';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lease_renewal_rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

-- 6. Create function to check renewal window and create notifications
CREATE OR REPLACE FUNCTION public.check_renewal_windows()
RETURNS void AS $$
DECLARE
    lease_record RECORD;
BEGIN
    FOR lease_record IN
        SELECT 
            l.id as lease_id,
            l.tenant_id,
            l.landlord_id,
            l.end_date,
            p.renewal_window_days
        FROM public.leases l
        JOIN public.properties p ON p.id = (SELECT property_id FROM public.units WHERE id = l.unit_id)
        WHERE 
            l.status = 'active'
            AND l.end_date > CURRENT_DATE
            AND l.end_date <= CURRENT_DATE + (p.renewal_window_days || ' days')::interval
            AND NOT EXISTS (
                SELECT 1 FROM public.renewal_requests rr 
                WHERE rr.current_lease_id = l.id 
                AND rr.status IN ('pending', 'approved')
            )
            AND NOT EXISTS (
                SELECT 1 FROM public.notifications n
                WHERE n.user_id = l.tenant_id
                AND n.type = 'lease_renewal_available'
                AND n.data->>'lease_id' = l.id::text
            )
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            lease_record.tenant_id,
            'lease_renewal_available',
            'Lease Renewal Available',
            'Your lease renewal window is now open. You can request a renewal.',
            jsonb_build_object('lease_id', lease_record.lease_id, 'end_date', lease_record.end_date)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
