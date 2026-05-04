-- Update tenant_intake_invites application_type constraint to support existing tenants onboarding
BEGIN;

ALTER TABLE public.tenant_intake_invites
DROP CONSTRAINT IF EXISTS tenant_intake_invites_application_type_check;

ALTER TABLE public.tenant_intake_invites
ADD CONSTRAINT tenant_intake_invites_application_type_check
CHECK (application_type IN ('online', 'face_to_face', 'existing_tenant'));

COMMIT;
