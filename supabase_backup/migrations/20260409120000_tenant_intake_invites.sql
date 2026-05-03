alter table public.applications
    add column if not exists invite_id uuid null,
    add column if not exists application_source text not null default 'walk_in_application';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'applications_application_source_check'
    ) then
        alter table public.applications
            add constraint applications_application_source_check
            check (application_source in ('walk_in_application', 'invite_link'));
    end if;
end $$;

create table if not exists public.tenant_intake_invites (
    id uuid primary key default gen_random_uuid(),
    landlord_id uuid not null references public.profiles(id) on delete cascade,
    property_id uuid not null references public.properties(id) on delete cascade,
    unit_id uuid null references public.units(id) on delete cascade,
    mode text not null check (mode in ('property', 'unit')),
    public_token text not null unique,
    token_hash text not null unique,
    status text not null default 'active' check (status in ('active', 'revoked', 'expired', 'consumed')),
    max_uses integer not null default 1 check (max_uses > 0),
    use_count integer not null default 0 check (use_count >= 0),
    expires_at timestamptz null,
    last_used_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.tenant_intake_invite_events (
    id uuid primary key default gen_random_uuid(),
    invite_id uuid not null references public.tenant_intake_invites(id) on delete cascade,
    event_type text not null check (event_type in ('created', 'opened', 'submitted', 'revoked', 'expired', 'consumed')),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'applications_invite_id_fkey'
    ) then
        alter table public.applications
            add constraint applications_invite_id_fkey
            foreign key (invite_id) references public.tenant_intake_invites(id) on delete set null;
    end if;
end $$;

create index if not exists idx_applications_application_source on public.applications(application_source);
create index if not exists idx_applications_invite_id on public.applications(invite_id);
create index if not exists idx_tenant_intake_invites_landlord_id on public.tenant_intake_invites(landlord_id);
create index if not exists idx_tenant_intake_invites_property_id on public.tenant_intake_invites(property_id);
create index if not exists idx_tenant_intake_invites_unit_id on public.tenant_intake_invites(unit_id);
create index if not exists idx_tenant_intake_invites_status on public.tenant_intake_invites(status);
create index if not exists idx_tenant_intake_invite_events_invite_id on public.tenant_intake_invite_events(invite_id);

drop trigger if exists trg_tenant_intake_invites_updated_at on public.tenant_intake_invites;
create trigger trg_tenant_intake_invites_updated_at
before update on public.tenant_intake_invites
for each row execute function public.update_updated_at();

alter table public.tenant_intake_invites enable row level security;
alter table public.tenant_intake_invite_events enable row level security;
