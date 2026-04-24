-- Add 'assigned' to maintenance_status enum
ALTER TYPE public.maintenance_status ADD VALUE IF NOT EXISTS 'assigned' BEFORE 'in_progress';
