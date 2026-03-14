-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::application_status,
  message text,
  monthly_income numeric,
  employment_status text,
  move_in_date date,
  documents ARRAY NOT NULL DEFAULT '{}'::text[],
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversation_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.landlord_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  phone text NOT NULL,
  identity_document_url text,
  ownership_document_url text,
  liveness_document_url text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::application_status,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT landlord_applications_pkey PRIMARY KEY (id),
  CONSTRAINT landlord_applications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.landlord_statistics_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL,
  format text NOT NULL CHECK (format = ANY (ARRAY['csv'::text, 'pdf'::text])),
  report_range text NOT NULL,
  mode text NOT NULL CHECK (mode = ANY (ARRAY['Simplified'::text, 'Detailed'::text])),
  include_expanded_kpis boolean NOT NULL DEFAULT false,
  row_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT landlord_statistics_exports_pkey PRIMARY KEY (id),
  CONSTRAINT landlord_statistics_exports_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.leases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::lease_status,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric NOT NULL,
  security_deposit numeric NOT NULL DEFAULT 0,
  terms jsonb,
  tenant_signature text,
  landlord_signature text,
  signed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leases_pkey PRIMARY KEY (id),
  CONSTRAINT leases_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT leases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id),
  CONSTRAINT leases_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.maintenance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::maintenance_status,
  priority USER-DEFINED NOT NULL DEFAULT 'medium'::maintenance_priority,
  category text,
  images ARRAY NOT NULL DEFAULT '{}'::text[],
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_requests_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT maintenance_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id),
  CONSTRAINT maintenance_requests_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'text'::message_type,
  content text NOT NULL,
  metadata jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.move_out_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  reason text,
  requested_date date NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::move_out_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT move_out_requests_pkey PRIMARY KEY (id),
  CONSTRAINT move_out_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id),
  CONSTRAINT move_out_requests_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id),
  CONSTRAINT move_out_requests_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.payment_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  label text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT 'rent'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_items_pkey PRIMARY KEY (id),
  CONSTRAINT payment_items_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  amount numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  method USER-DEFINED,
  description text,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  reference_number text,
  landlord_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id),
  CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'tenant'::user_role,
  avatar_url text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  business_name text,
  business_permits ARRAY NOT NULL DEFAULT '{}'::text[],
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Valenzuela'::text,
  description text,
  type USER-DEFINED NOT NULL DEFAULT 'apartment'::property_type,
  lat double precision,
  lng double precision,
  amenities ARRAY NOT NULL DEFAULT '{}'::text[],
  house_rules ARRAY NOT NULL DEFAULT '{}'::text[],
  images ARRAY NOT NULL DEFAULT '{}'::text[],
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.saved_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_properties_pkey PRIMARY KEY (id),
  CONSTRAINT saved_properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT saved_properties_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  name text NOT NULL,
  floor integer NOT NULL DEFAULT 1,
  status USER-DEFINED NOT NULL DEFAULT 'vacant'::unit_status,
  rent_amount numeric NOT NULL,
  sqft integer,
  beds integer NOT NULL DEFAULT 1,
  baths integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);