ALTER TABLE public.maintenance_requests
ADD COLUMN IF NOT EXISTS self_repair_requested boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS self_repair_decision text,
ADD COLUMN IF NOT EXISTS repair_method text,
ADD COLUMN IF NOT EXISTS third_party_name text,
ADD COLUMN IF NOT EXISTS photo_requested boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tenant_repair_status text,
ADD COLUMN IF NOT EXISTS tenant_provided_photos text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'maintenance_requests_self_repair_decision_check'
    ) THEN
        ALTER TABLE public.maintenance_requests
        ADD CONSTRAINT maintenance_requests_self_repair_decision_check
            CHECK (self_repair_decision IN ('pending', 'approved', 'rejected') OR self_repair_decision IS NULL);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'maintenance_requests_repair_method_check'
    ) THEN
        ALTER TABLE public.maintenance_requests
        ADD CONSTRAINT maintenance_requests_repair_method_check
            CHECK (repair_method IN ('landlord', 'third_party', 'self_repair') OR repair_method IS NULL);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'maintenance_requests_tenant_repair_status_check'
    ) THEN
        ALTER TABLE public.maintenance_requests
        ADD CONSTRAINT maintenance_requests_tenant_repair_status_check
            CHECK (tenant_repair_status IN ('not_started', 'personnel_arrived', 'repairing', 'done') OR tenant_repair_status IS NULL);
    END IF;
END $$;
