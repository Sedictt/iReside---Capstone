-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  applicant_id uuid,
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
  emergency_contact_name text,
  emergency_contact_phone text,
  reference_name text,
  reference_phone text,
  compliance_checklist jsonb DEFAULT '{"valid_id": false, "lease_signed": false, "income_verified": false, "inspection_done": false, "payment_received": false, "background_checked": false, "application_completed": false}'::jsonb,
  created_by uuid,
  applicant_name text,
  applicant_phone text,
  applicant_email text,
  employment_info jsonb DEFAULT '{}'::jsonb,
  requirements_checklist jsonb DEFAULT '{}'::jsonb,
  lease_id uuid,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT applications_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id)
);
CREATE TABLE public.community_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE,
  property_id uuid NOT NULL,
  cover_photo_url text,
  photo_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_albums_pkey PRIMARY KEY (id),
  CONSTRAINT community_albums_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_albums_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id)
);
CREATE TABLE public.community_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_comments_pkey PRIMARY KEY (id),
  CONSTRAINT community_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT community_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.community_comments(id)
);
CREATE TABLE public.community_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL,
  url text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_photos_pkey PRIMARY KEY (id),
  CONSTRAINT community_photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.community_albums(id),
  CONSTRAINT community_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  user_id uuid NOT NULL,
  option_index integer NOT NULL CHECK (option_index >= 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT community_poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_role USER-DEFINED NOT NULL,
  type USER-DEFINED NOT NULL,
  title text NOT NULL,
  content text,
  metadata jsonb,
  is_pinned boolean DEFAULT false,
  is_moderated boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  status USER-DEFINED DEFAULT 'published'::post_status_enum,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_posts_pkey PRIMARY KEY (id),
  CONSTRAINT community_posts_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT community_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT community_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT community_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT community_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::report_status_enum,
  moderator_notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT content_reports_pkey PRIMARY KEY (id),
  CONSTRAINT content_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT content_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id),
  CONSTRAINT content_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
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
CREATE TABLE public.geo_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type USER-DEFINED NOT NULL,
  city_name text,
  barangay_name text,
  full_label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT geo_locations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.iris_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT iris_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT iris_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.landlord_inquiry_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT landlord_inquiry_actions_pkey PRIMARY KEY (id),
  CONSTRAINT landlord_inquiry_actions_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.applications(id),
  CONSTRAINT landlord_inquiry_actions_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.landlord_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL UNIQUE,
  landlord_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT landlord_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT landlord_reviews_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id),
  CONSTRAINT landlord_reviews_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id),
  CONSTRAINT landlord_reviews_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id)
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
CREATE TABLE public.lease_signing_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['signing_link_generated'::text, 'signing_link_accessed'::text, 'signing_link_expired'::text, 'signing_link_regenerated'::text, 'tenant_signed'::text, 'landlord_signed'::text, 'lease_activated'::text, 'signing_failed'::text])),
  actor_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lease_signing_audit_pkey PRIMARY KEY (id),
  CONSTRAINT lease_signing_audit_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id),
  CONSTRAINT lease_signing_audit_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id)
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
  signing_mode text CHECK (signing_mode = ANY (ARRAY['in_person'::text, 'remote'::text])),
  tenant_signed_at timestamp with time zone,
  landlord_signed_at timestamp with time zone,
  signing_link_token_hash text,
  signature_lock_version integer NOT NULL DEFAULT 0,
  CONSTRAINT leases_pkey PRIMARY KEY (id),
  CONSTRAINT leases_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id),
  CONSTRAINT leases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id),
  CONSTRAINT leases_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL,
  property_id uuid NOT NULL,
  unit_id uuid,
  scope USER-DEFINED NOT NULL,
  title text NOT NULL,
  rent_amount numeric NOT NULL CHECK (rent_amount >= 0::numeric),
  status USER-DEFINED NOT NULL DEFAULT 'draft'::listing_status,
  views integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id),
  CONSTRAINT listings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT listings_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id)
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
CREATE TABLE public.message_user_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_user_actions_pkey PRIMARY KEY (id),
  CONSTRAINT message_user_actions_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id),
  CONSTRAINT message_user_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.message_user_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  conversation_id uuid,
  category text NOT NULL,
  details text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])),
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_user_reports_pkey PRIMARY KEY (id),
  CONSTRAINT message_user_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public.profiles(id),
  CONSTRAINT message_user_reports_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id),
  CONSTRAINT message_user_reports_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
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
CREATE TABLE public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid,
  session_id text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  view_day date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC'::text))::date,
  CONSTRAINT post_views_pkey PRIMARY KEY (id),
  CONSTRAINT post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.community_posts(id),
  CONSTRAINT post_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  contract_template jsonb,
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
CREATE TABLE public.tenant_product_tour_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['tour_started'::text, 'tour_step_completed'::text, 'tour_skipped'::text, 'tour_completed'::text, 'tour_replayed'::text, 'tour_failed'::text])),
  step_id text,
  trigger_source text NOT NULL CHECK (trigger_source = ANY (ARRAY['onboarding_handoff'::text, 'auto_portal_entry'::text, 'manual'::text, 'resume'::text, 'replay'::text, 'step_progression'::text, 'fallback'::text, 'system'::text])),
  is_replay boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_product_tour_events_pkey PRIMARY KEY (id),
  CONSTRAINT tenant_product_tour_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tenant_product_tour_states (
  tenant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'skipped'::text, 'completed'::text])),
  current_step_index integer NOT NULL DEFAULT 0 CHECK (current_step_index >= 0),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  skipped_at timestamp with time zone,
  skip_suppressed_until timestamp with time zone,
  replay_count integer NOT NULL DEFAULT 0 CHECK (replay_count >= 0),
  last_event_at timestamp with time zone,
  last_route text,
  last_anchor_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tenant_product_tour_states_pkey PRIMARY KEY (tenant_id),
  CONSTRAINT tenant_product_tour_states_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.unit_transfer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  property_id uuid NOT NULL,
  current_unit_id uuid NOT NULL,
  requested_unit_id uuid NOT NULL,
  reason text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::unit_transfer_status,
  landlord_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unit_transfer_requests_pkey PRIMARY KEY (id),
  CONSTRAINT unit_transfer_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id),
  CONSTRAINT unit_transfer_requests_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES public.profiles(id),
  CONSTRAINT unit_transfer_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id),
  CONSTRAINT unit_transfer_requests_current_unit_id_fkey FOREIGN KEY (current_unit_id) REFERENCES public.units(id),
  CONSTRAINT unit_transfer_requests_requested_unit_id_fkey FOREIGN KEY (requested_unit_id) REFERENCES public.units(id),
  CONSTRAINT unit_transfer_requests_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.leases(id)
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