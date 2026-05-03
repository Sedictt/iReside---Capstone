alter table public.tenant_intake_invites
    add column if not exists application_type text not null default 'face_to_face',
    add column if not exists required_requirements jsonb not null default '[]'::jsonb;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'tenant_intake_invites_application_type_check'
    ) then
        alter table public.tenant_intake_invites
            add constraint tenant_intake_invites_application_type_check
            check (application_type in ('online', 'face_to_face'));
    end if;
end $$;
