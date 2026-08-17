export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          landlord_id: string
          location_details: string | null
          name: string
          price_per_unit: number | null
          property_id: string
          status: string
          tags: string[] | null
          type: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          landlord_id: string
          location_details?: string | null
          name: string
          price_per_unit?: number | null
          property_id: string
          status?: string
          tags?: string[] | null
          type: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          landlord_id?: string
          location_details?: string | null
          name?: string
          price_per_unit?: number | null
          property_id?: string
          status?: string
          tags?: string[] | null
          type?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenities_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_bookings: {
        Row: {
          amenity_id: string
          booking_date: string
          created_at: string
          end_time: string
          id: string
          landlord_id: string
          notes: string | null
          start_time: string
          status: string
          tenant_id: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          amenity_id: string
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          landlord_id: string
          notes?: string | null
          start_time: string
          status?: string
          tenant_id: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          amenity_id?: string
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          landlord_id?: string
          notes?: string | null
          start_time?: string
          status?: string
          tenant_id?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_bookings_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_payment_audit_events: {
        Row: {
          actor_id: string | null
          actor_role: string
          application_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          payment_request_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role: string
          application_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          payment_request_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          application_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          payment_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_payment_audit_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_payment_audit_events_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "application_payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      application_payment_requests: {
        Row: {
          amount: number
          application_id: string
          bypassed: boolean
          created_at: string
          due_at: string | null
          id: string
          landlord_id: string
          linked_payment_id: string | null
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          payment_note: string | null
          payment_proof_path: string | null
          payment_proof_url: string | null
          reference_number: string | null
          requirement_type: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          application_id: string
          bypassed?: boolean
          created_at?: string
          due_at?: string | null
          id?: string
          landlord_id: string
          linked_payment_id?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          payment_note?: string | null
          payment_proof_path?: string | null
          payment_proof_url?: string | null
          reference_number?: string | null
          requirement_type: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          application_id?: string
          bypassed?: boolean
          created_at?: string
          due_at?: string | null
          id?: string
          landlord_id?: string
          linked_payment_id?: string | null
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          payment_note?: string | null
          payment_proof_path?: string | null
          payment_proof_url?: string | null
          reference_number?: string | null
          requirement_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_payment_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_payment_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_payment_requests_linked_payment_id_fkey"
            columns: ["linked_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_email: string | null
          applicant_id: string | null
          applicant_name: string | null
          applicant_phone: string | null
          application_source: string
          compliance_checklist: Json | null
          created_at: string
          created_by: string | null
          documents: string[]
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_info: Json | null
          employment_status: string | null
          id: string
          invite_id: string | null
          landlord_id: string
          lease_id: string | null
          message: string | null
          monthly_income: number | null
          move_in_date: string | null
          payment_pending_expires_at: string | null
          payment_pending_started_at: string | null
          payment_portal_token_expires_at: string | null
          payment_portal_token_hash: string | null
          reference_name: string | null
          reference_phone: string | null
          requirements_checklist: Json | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["application_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          applicant_email?: string | null
          applicant_id?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          application_source?: string
          compliance_checklist?: Json | null
          created_at?: string
          created_by?: string | null
          documents?: string[]
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_info?: Json | null
          employment_status?: string | null
          id?: string
          invite_id?: string | null
          landlord_id: string
          lease_id?: string | null
          message?: string | null
          monthly_income?: number | null
          move_in_date?: string | null
          payment_pending_expires_at?: string | null
          payment_pending_started_at?: string | null
          payment_portal_token_expires_at?: string | null
          payment_portal_token_hash?: string | null
          reference_name?: string | null
          reference_phone?: string | null
          requirements_checklist?: Json | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string | null
          applicant_id?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          application_source?: string
          compliance_checklist?: Json | null
          created_at?: string
          created_by?: string | null
          documents?: string[]
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_info?: Json | null
          employment_status?: string | null
          id?: string
          invite_id?: string | null
          landlord_id?: string
          lease_id?: string | null
          message?: string | null
          monthly_income?: number | null
          move_in_date?: string | null
          payment_pending_expires_at?: string | null
          payment_pending_started_at?: string | null
          payment_portal_token_expires_at?: string | null
          payment_portal_token_hash?: string | null
          reference_name?: string | null
          reference_phone?: string | null
          requirements_checklist?: Json | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "tenant_intake_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      community_albums: {
        Row: {
          cover_photo_url: string | null
          created_at: string | null
          id: string
          photo_count: number | null
          post_id: string
          property_id: string
          updated_at: string | null
        }
        Insert: {
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string
          photo_count?: number | null
          post_id: string
          property_id: string
          updated_at?: string | null
        }
        Update: {
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string
          photo_count?: number | null
          post_id?: string
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_albums_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_albums_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string | null
          display_order: number
          id: string
          uploaded_by: string
          url: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          uploaded_by: string
          url: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "community_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          author_role: Database["public"]["Enums"]["user_role"]
          content: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          is_moderated: boolean | null
          is_pinned: boolean | null
          metadata: Json | null
          property_id: string
          status: Database["public"]["Enums"]["post_status_enum"] | null
          title: string
          type: Database["public"]["Enums"]["post_type_enum"]
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          author_role: Database["public"]["Enums"]["user_role"]
          content?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_moderated?: boolean | null
          is_pinned?: boolean | null
          metadata?: Json | null
          property_id: string
          status?: Database["public"]["Enums"]["post_status_enum"] | null
          title: string
          type: Database["public"]["Enums"]["post_type_enum"]
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          author_role?: Database["public"]["Enums"]["user_role"]
          content?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          is_moderated?: boolean | null
          is_pinned?: boolean | null
          metadata?: Json | null
          property_id?: string
          status?: Database["public"]["Enums"]["post_status_enum"] | null
          title?: string
          type?: Database["public"]["Enums"]["post_type_enum"]
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: Database["public"]["Enums"]["reaction_type_enum"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_url: string
          id: string
          signed_file_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_url: string
          id?: string
          signed_file_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          signed_file_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string | null
          id: string
          moderator_notes: string | null
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status_enum"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          moderator_notes?: string | null
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          moderator_notes?: string | null
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date_incurred: string
          description: string
          id: string
          landlord_id: string
          property_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date_incurred: string
          description: string
          id?: string
          landlord_id: string
          property_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date_incurred?: string
          description?: string
          id?: string
          landlord_id?: string
          property_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      external_account_tokens: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          profile_id: string
          provider: string
          refresh_token: string | null
          token_expiry: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          profile_id: string
          provider: string
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          provider?: string
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_account_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      iris_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "iris_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_applications: {
        Row: {
          admin_notes: string | null
          business_address: string | null
          business_name: string | null
          business_permit_card_url: string | null
          business_permit_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          identity_document_url: string | null
          liveness_document_url: string | null
          onboarding_completed_at: string | null
          onboarding_token: string | null
          onboarding_token_expires_at: string | null
          ownership_document_url: string | null
          phone: string
          profile_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          verification_checked_at: string | null
          verification_data: Json | null
          verification_notes: string | null
          verification_status: string | null
        }
        Insert: {
          admin_notes?: string | null
          business_address?: string | null
          business_name?: string | null
          business_permit_card_url?: string | null
          business_permit_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          identity_document_url?: string | null
          liveness_document_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_token?: string | null
          onboarding_token_expires_at?: string | null
          ownership_document_url?: string | null
          phone: string
          profile_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          verification_checked_at?: string | null
          verification_data?: Json | null
          verification_notes?: string | null
          verification_status?: string | null
        }
        Update: {
          admin_notes?: string | null
          business_address?: string | null
          business_name?: string | null
          business_permit_card_url?: string | null
          business_permit_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          identity_document_url?: string | null
          liveness_document_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_token?: string | null
          onboarding_token_expires_at?: string | null
          ownership_document_url?: string | null
          phone?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          verification_checked_at?: string | null
          verification_data?: Json | null
          verification_notes?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landlord_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_business_profiles: {
        Row: {
          business_name: string | null
          business_permit_number: string | null
          business_permit_url: string | null
          business_permits: string[]
          created_at: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          business_permit_number?: string | null
          business_permit_url?: string | null
          business_permits?: string[]
          created_at?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          business_permit_number?: string | null
          business_permit_url?: string | null
          business_permits?: string[]
          created_at?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_business_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_inquiry_actions: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          inquiry_id: string
          is_archived: boolean
          is_read: boolean
          landlord_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          inquiry_id: string
          is_archived?: boolean
          is_read?: boolean
          landlord_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          inquiry_id?: string
          is_archived?: boolean
          is_read?: boolean
          landlord_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_inquiry_actions_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_inquiry_actions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_payment_destinations: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          id: string
          is_enabled: boolean
          landlord_id: string
          provider: string
          qr_image_path: string | null
          qr_image_url: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          landlord_id: string
          provider?: string
          qr_image_path?: string | null
          qr_image_url?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          landlord_id?: string
          provider?: string
          qr_image_path?: string | null
          qr_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_payment_destinations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_product_tour_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_replay: boolean
          landlord_id: string
          payload: Json
          session_id: string
          step_id: string | null
          trigger_source: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_replay?: boolean
          landlord_id: string
          payload?: Json
          session_id?: string
          step_id?: string | null
          trigger_source: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_replay?: boolean
          landlord_id?: string
          payload?: Json
          session_id?: string
          step_id?: string | null
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_product_tour_events_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_product_tour_states: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step_index: number
          landlord_id: string
          last_anchor_id: string | null
          last_event_at: string | null
          last_route: string | null
          metadata: Json
          replay_count: number
          skip_suppressed_until: string | null
          skipped_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step_index?: number
          landlord_id: string
          last_anchor_id?: string | null
          last_event_at?: string | null
          last_route?: string | null
          metadata?: Json
          replay_count?: number
          skip_suppressed_until?: string | null
          skipped_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step_index?: number
          landlord_id?: string
          last_anchor_id?: string | null
          last_event_at?: string | null
          last_route?: string | null
          metadata?: Json
          replay_count?: number
          skip_suppressed_until?: string | null
          skipped_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_product_tour_states_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          landlord_id: string
          lease_id: string
          rating: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          landlord_id: string
          lease_id: string
          rating: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          landlord_id?: string
          lease_id?: string
          rating?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landlord_reviews_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_reviews_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: true
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landlord_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_statistics_exports: {
        Row: {
          created_at: string
          format: string
          id: string
          include_expanded_kpis: boolean
          landlord_id: string
          metadata: Json
          mode: string
          report_range: string
          row_count: number
        }
        Insert: {
          created_at?: string
          format: string
          id?: string
          include_expanded_kpis?: boolean
          landlord_id: string
          metadata?: Json
          mode: string
          report_range: string
          row_count?: number
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          include_expanded_kpis?: boolean
          landlord_id?: string
          metadata?: Json
          mode?: string
          report_range?: string
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "landlord_statistics_exports_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_signing_audit: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: unknown
          lease_id: string
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: unknown
          lease_id: string
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          lease_id?: string
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_signing_audit_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          end_date: string
          id: string
          landlord_id: string
          landlord_signature: string | null
          landlord_signed_at: string | null
          monthly_rent: number
          security_deposit: number
          signature_lock_version: number
          signed_at: string | null
          signed_document_path: string | null
          signed_document_url: string | null
          signing_link_token_hash: string | null
          signing_mode: string | null
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          tenant_signature: string | null
          tenant_signed_at: string | null
          terms: Json | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          landlord_id: string
          landlord_signature?: string | null
          landlord_signed_at?: string | null
          monthly_rent: number
          security_deposit?: number
          signature_lock_version?: number
          signed_at?: string | null
          signed_document_path?: string | null
          signed_document_url?: string | null
          signing_link_token_hash?: string | null
          signing_mode?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          tenant_signature?: string | null
          tenant_signed_at?: string | null
          terms?: Json | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          landlord_id?: string
          landlord_signature?: string | null
          landlord_signed_at?: string | null
          monthly_rent?: number
          security_deposit?: number
          signature_lock_version?: number
          signed_at?: string | null
          signed_document_path?: string | null
          signed_document_url?: string | null
          signing_link_token_hash?: string | null
          signing_mode?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string
          tenant_signature?: string | null
          tenant_signed_at?: string | null
          terms?: Json | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          ai_triage_confidence: number | null
          ai_triage_hash: string | null
          ai_triage_priority:
            | Database["public"]["Enums"]["maintenance_priority"]
            | null
          ai_triage_reason: string | null
          ai_triage_sentiment: string | null
          ai_triage_version: string | null
          ai_triaged_at: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          images: string[]
          landlord_id: string
          photo_requested: boolean
          priority: Database["public"]["Enums"]["maintenance_priority"]
          repair_method: string | null
          resolved_at: string | null
          self_repair_decision: string | null
          self_repair_requested: boolean
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string
          tenant_provided_photos: string[]
          tenant_repair_status: string | null
          third_party_name: string | null
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          ai_triage_confidence?: number | null
          ai_triage_hash?: string | null
          ai_triage_priority?:
            | Database["public"]["Enums"]["maintenance_priority"]
            | null
          ai_triage_reason?: string | null
          ai_triage_sentiment?: string | null
          ai_triage_version?: string | null
          ai_triaged_at?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[]
          landlord_id: string
          photo_requested?: boolean
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          repair_method?: string | null
          resolved_at?: string | null
          self_repair_decision?: string | null
          self_repair_requested?: boolean
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string
          tenant_provided_photos?: string[]
          tenant_repair_status?: string | null
          third_party_name?: string | null
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          ai_triage_confidence?: number | null
          ai_triage_hash?: string | null
          ai_triage_priority?:
            | Database["public"]["Enums"]["maintenance_priority"]
            | null
          ai_triage_reason?: string | null
          ai_triage_sentiment?: string | null
          ai_triage_version?: string | null
          ai_triaged_at?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          landlord_id?: string
          photo_requested?: boolean
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          repair_method?: string | null
          resolved_at?: string | null
          self_repair_decision?: string | null
          self_repair_requested?: boolean
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string
          tenant_provided_photos?: string[]
          tenant_repair_status?: string | null
          third_party_name?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      message_moderation_banned_terms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          normalized_term: string
          report_id: string | null
          source: string
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          normalized_term: string
          report_id?: string | null
          source?: string
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          normalized_term?: string
          report_id?: string | null
          source?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_moderation_banned_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_moderation_banned_terms_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "message_user_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      message_user_actions: {
        Row: {
          actor_user_id: string
          archived: boolean
          blocked: boolean
          created_at: string
          id: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          actor_user_id: string
          archived?: boolean
          blocked?: boolean
          created_at?: string
          id?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          actor_user_id?: string
          archived?: boolean
          blocked?: boolean
          created_at?: string
          id?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_user_actions_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_user_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_user_reports: {
        Row: {
          category: string
          conversation_id: string | null
          created_at: string
          details: string
          id: string
          metadata: Json | null
          reporter_user_id: string
          status: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          category: string
          conversation_id?: string | null
          created_at?: string
          details: string
          id?: string
          metadata?: Json | null
          reporter_user_id: string
          status?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          conversation_id?: string | null
          created_at?: string
          details?: string
          id?: string
          metadata?: Json | null
          reporter_user_id?: string
          status?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_user_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_user_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_user_reports_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      move_out_requests: {
        Row: {
          approved_at: string | null
          checklist_completed: boolean | null
          checklist_data: Json | null
          completed_at: string | null
          created_at: string
          denial_reason: string | null
          denied_at: string | null
          deposit_deductions: Json | null
          deposit_refund_amount: number | null
          id: string
          inspection_date: string | null
          inspection_notes: string | null
          inspection_photos: string[] | null
          landlord_id: string
          lease_id: string
          notes: string | null
          reason: string | null
          requested_date: string
          status: Database["public"]["Enums"]["move_out_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          checklist_completed?: boolean | null
          checklist_data?: Json | null
          completed_at?: string | null
          created_at?: string
          denial_reason?: string | null
          denied_at?: string | null
          deposit_deductions?: Json | null
          deposit_refund_amount?: number | null
          id?: string
          inspection_date?: string | null
          inspection_notes?: string | null
          inspection_photos?: string[] | null
          landlord_id: string
          lease_id: string
          notes?: string | null
          reason?: string | null
          requested_date: string
          status?: Database["public"]["Enums"]["move_out_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          checklist_completed?: boolean | null
          checklist_data?: Json | null
          completed_at?: string | null
          created_at?: string
          denial_reason?: string | null
          denied_at?: string | null
          deposit_deductions?: Json | null
          deposit_refund_amount?: number | null
          id?: string
          inspection_date?: string | null
          inspection_notes?: string | null
          inspection_photos?: string[] | null
          landlord_id?: string
          lease_id?: string
          notes?: string | null
          reason?: string | null
          requested_date?: string
          status?: Database["public"]["Enums"]["move_out_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_out_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_requests_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "move_out_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_items: {
        Row: {
          amount: number
          billing_mode:
            | Database["public"]["Enums"]["utility_billing_mode"]
            | null
          category: string
          created_at: string
          id: string
          label: string
          metadata: Json
          payment_id: string
          reading_id: string | null
          sort_order: number
          utility_type: Database["public"]["Enums"]["utility_type"] | null
        }
        Insert: {
          amount: number
          billing_mode?:
            | Database["public"]["Enums"]["utility_billing_mode"]
            | null
          category?: string
          created_at?: string
          id?: string
          label: string
          metadata?: Json
          payment_id: string
          reading_id?: string | null
          sort_order?: number
          utility_type?: Database["public"]["Enums"]["utility_type"] | null
        }
        Update: {
          amount?: number
          billing_mode?:
            | Database["public"]["Enums"]["utility_billing_mode"]
            | null
          category?: string
          created_at?: string
          id?: string
          label?: string
          metadata?: Json
          payment_id?: string
          reading_id?: string | null
          sort_order?: number
          utility_type?: Database["public"]["Enums"]["utility_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "utility_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_receipts: {
        Row: {
          amount: number
          amount_breakdown: Json
          created_at: string
          id: string
          issued_at: string
          issued_by: string | null
          landlord_id: string
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          notes: string | null
          payment_id: string
          receipt_number: string
          tenant_id: string
        }
        Insert: {
          amount: number
          amount_breakdown?: Json
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          landlord_id: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          payment_id: string
          receipt_number: string
          tenant_id: string
        }
        Update: {
          amount?: number
          amount_breakdown?: Json
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string | null
          landlord_id?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          notes?: string | null
          payment_id?: string
          receipt_number?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_receipts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_workflow_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json
          before_state: Json
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json
          payment_id: string
          source: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json
          before_state?: Json
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          payment_id: string
          source: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json
          before_state?: Json
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          payment_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_workflow_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_workflow_audit_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          allow_partial_payments: boolean
          amount: number
          amount_tag: Database["public"]["Enums"]["payment_amount_tag"] | null
          balance_remaining: number
          billing_cycle: string | null
          created_at: string
          description: string | null
          due_date: string
          due_day_snapshot: number | null
          id: string
          in_person_intent_expires_at: string | null
          intent_method:
            | Database["public"]["Enums"]["payment_intent_method"]
            | null
          invoice_number: string | null
          invoice_period_end: string | null
          invoice_period_start: string | null
          landlord_confirmed: boolean
          landlord_id: string
          last_action_at: string | null
          last_action_by: string | null
          late_fee_amount: number
          late_fee_applied_at: string | null
          lease_id: string
          metadata: Json
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_amount: number
          paid_at: string | null
          payment_note: string | null
          payment_proof_path: string | null
          payment_proof_url: string | null
          payment_submitted_at: string | null
          receipt_number: string | null
          reference_number: string | null
          rejection_reason: string | null
          reminder_sent_at: string | null
          review_action:
            | Database["public"]["Enums"]["payment_review_action"]
            | null
          status: Database["public"]["Enums"]["payment_status"]
          subtotal: number
          tenant_id: string
          updated_at: string
          workflow_status: Database["public"]["Enums"]["payment_workflow_status"]
        }
        Insert: {
          allow_partial_payments?: boolean
          amount: number
          amount_tag?: Database["public"]["Enums"]["payment_amount_tag"] | null
          balance_remaining?: number
          billing_cycle?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          due_day_snapshot?: number | null
          id?: string
          in_person_intent_expires_at?: string | null
          intent_method?:
            | Database["public"]["Enums"]["payment_intent_method"]
            | null
          invoice_number?: string | null
          invoice_period_end?: string | null
          invoice_period_start?: string | null
          landlord_confirmed?: boolean
          landlord_id: string
          last_action_at?: string | null
          last_action_by?: string | null
          late_fee_amount?: number
          late_fee_applied_at?: string | null
          lease_id: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_amount?: number
          paid_at?: string | null
          payment_note?: string | null
          payment_proof_path?: string | null
          payment_proof_url?: string | null
          payment_submitted_at?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          reminder_sent_at?: string | null
          review_action?:
            | Database["public"]["Enums"]["payment_review_action"]
            | null
          status?: Database["public"]["Enums"]["payment_status"]
          subtotal?: number
          tenant_id: string
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["payment_workflow_status"]
        }
        Update: {
          allow_partial_payments?: boolean
          amount?: number
          amount_tag?: Database["public"]["Enums"]["payment_amount_tag"] | null
          balance_remaining?: number
          billing_cycle?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          due_day_snapshot?: number | null
          id?: string
          in_person_intent_expires_at?: string | null
          intent_method?:
            | Database["public"]["Enums"]["payment_intent_method"]
            | null
          invoice_number?: string | null
          invoice_period_end?: string | null
          invoice_period_start?: string | null
          landlord_confirmed?: boolean
          landlord_id?: string
          last_action_at?: string | null
          last_action_by?: string | null
          late_fee_amount?: number
          late_fee_applied_at?: string | null
          lease_id?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_amount?: number
          paid_at?: string | null
          payment_note?: string | null
          payment_proof_path?: string | null
          payment_proof_url?: string | null
          payment_submitted_at?: string | null
          receipt_number?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          reminder_sent_at?: string | null
          review_action?:
            | Database["public"]["Enums"]["payment_review_action"]
            | null
          status?: Database["public"]["Enums"]["payment_status"]
          subtotal?: number
          tenant_id?: string
          updated_at?: string
          workflow_status?: Database["public"]["Enums"]["payment_workflow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_last_action_by_fkey"
            columns: ["last_action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          session_id: string | null
          user_id: string | null
          view_day: string
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id: string
          session_id?: string | null
          user_id?: string | null
          view_day?: string
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          session_id?: string | null
          user_id?: string | null
          view_day?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          address: string | null
          created_at: string
          phone: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          phone?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          phone?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_bg_color: string | null
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          business_permit_number: string | null
          business_permit_url: string | null
          business_permits: string[]
          cover_url: string | null
          created_at: string
          email: string
          full_name: string
          gmail_access_token: string | null
          gmail_refresh_token: string | null
          gmail_token_expiry: string | null
          has_changed_password: boolean
          id: string
          otp_code: string | null
          otp_expiry: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          socials: Json | null
          two_factor_email: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_bg_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          business_permit_number?: string | null
          business_permit_url?: string | null
          business_permits?: string[]
          cover_url?: string | null
          created_at?: string
          email: string
          full_name: string
          gmail_access_token?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          has_changed_password?: boolean
          id: string
          otp_code?: string | null
          otp_expiry?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          socials?: Json | null
          two_factor_email?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_bg_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          business_permit_number?: string | null
          business_permit_url?: string | null
          business_permits?: string[]
          cover_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gmail_access_token?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          has_changed_password?: boolean
          id?: string
          otp_code?: string | null
          otp_expiry?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          socials?: Json | null
          two_factor_email?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          advance_rent_months: number
          amenities: string[]
          base_rent_amount: number | null
          city: string
          contract_template: Json | null
          created_at: string
          description: string | null
          house_rules: string[]
          id: string
          images: string[]
          is_featured: boolean
          landlord_id: string
          map_decorations: Json | null
          name: string
          renewal_settings: Json | null
          renewal_window_days: number
          security_deposit_months: number
          total_floors: number | null
          total_units: number | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
        }
        Insert: {
          address: string
          advance_rent_months?: number
          amenities?: string[]
          base_rent_amount?: number | null
          city?: string
          contract_template?: Json | null
          created_at?: string
          description?: string | null
          house_rules?: string[]
          id?: string
          images?: string[]
          is_featured?: boolean
          landlord_id: string
          map_decorations?: Json | null
          name: string
          renewal_settings?: Json | null
          renewal_window_days?: number
          security_deposit_months?: number
          total_floors?: number | null
          total_units?: number | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Update: {
          address?: string
          advance_rent_months?: number
          amenities?: string[]
          base_rent_amount?: number | null
          city?: string
          contract_template?: Json | null
          created_at?: string
          description?: string | null
          house_rules?: string[]
          id?: string
          images?: string[]
          is_featured?: boolean
          landlord_id?: string
          map_decorations?: Json | null
          name?: string
          renewal_settings?: Json | null
          renewal_window_days?: number
          security_deposit_months?: number
          total_floors?: number | null
          total_units?: number | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_environment_policies: {
        Row: {
          created_at: string
          curfew_enabled: boolean | null
          curfew_time: string | null
          environment_mode: string
          gender_restriction_mode: string | null
          max_occupants_per_unit: number | null
          needs_review: boolean | null
          payment_profile_defaults: Json | null
          property_id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
          utility_policy_mode: string | null
          visitor_cutoff_enabled: boolean | null
          visitor_cutoff_time: string | null
        }
        Insert: {
          created_at?: string
          curfew_enabled?: boolean | null
          curfew_time?: string | null
          environment_mode: string
          gender_restriction_mode?: string | null
          max_occupants_per_unit?: number | null
          needs_review?: boolean | null
          payment_profile_defaults?: Json | null
          property_id: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          utility_policy_mode?: string | null
          visitor_cutoff_enabled?: boolean | null
          visitor_cutoff_time?: string | null
        }
        Update: {
          created_at?: string
          curfew_enabled?: boolean | null
          curfew_time?: string | null
          environment_mode?: string
          gender_restriction_mode?: string | null
          max_occupants_per_unit?: number | null
          needs_review?: boolean | null
          payment_profile_defaults?: Json | null
          property_id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          utility_policy_mode?: string | null
          visitor_cutoff_enabled?: boolean | null
          visitor_cutoff_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_environment_policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_environment_policies_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_floor_configs: {
        Row: {
          created_at: string
          display_name: string | null
          floor_key: string
          floor_number: number
          id: string
          property_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          floor_key: string
          floor_number: number
          id?: string
          property_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          floor_key?: string
          floor_number?: number
          id?: string
          property_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_floor_configs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_requests: {
        Row: {
          created_at: string
          current_lease_id: string
          id: string
          landlord_id: string
          landlord_notes: string | null
          new_lease_id: string | null
          proposed_end_date: string | null
          proposed_monthly_rent: number | null
          proposed_security_deposit: number | null
          proposed_start_date: string | null
          status: Database["public"]["Enums"]["renewal_status"]
          tenant_id: string
          terms_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_lease_id: string
          id?: string
          landlord_id: string
          landlord_notes?: string | null
          new_lease_id?: string | null
          proposed_end_date?: string | null
          proposed_monthly_rent?: number | null
          proposed_security_deposit?: number | null
          proposed_start_date?: string | null
          status?: Database["public"]["Enums"]["renewal_status"]
          tenant_id: string
          terms_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_lease_id?: string
          id?: string
          landlord_id?: string
          landlord_notes?: string | null
          new_lease_id?: string | null
          proposed_end_date?: string | null
          proposed_monthly_rent?: number | null
          proposed_security_deposit?: number | null
          proposed_start_date?: string | null
          status?: Database["public"]["Enums"]["renewal_status"]
          tenant_id?: string
          terms_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_requests_current_lease_id_fkey"
            columns: ["current_lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_requests_new_lease_id_fkey"
            columns: ["new_lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_intake_invite_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          invite_id: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          invite_id: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          invite_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tenant_intake_invite_events_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "tenant_intake_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_intake_invites: {
        Row: {
          application_type: string
          created_at: string
          expires_at: string | null
          id: string
          landlord_id: string
          last_used_at: string | null
          max_uses: number
          mode: string
          property_id: string
          public_token: string
          required_requirements: Json
          status: string
          token_hash: string
          unit_id: string | null
          updated_at: string
          use_count: number
        }
        Insert: {
          application_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          landlord_id: string
          last_used_at?: string | null
          max_uses?: number
          mode: string
          property_id: string
          public_token: string
          required_requirements?: Json
          status?: string
          token_hash: string
          unit_id?: string | null
          updated_at?: string
          use_count?: number
        }
        Update: {
          application_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          landlord_id?: string
          last_used_at?: string | null
          max_uses?: number
          mode?: string
          property_id?: string
          public_token?: string
          required_requirements?: Json
          status?: string
          token_hash?: string
          unit_id?: string | null
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_intake_invites_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_intake_invites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_intake_invites_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_product_tour_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_replay: boolean
          payload: Json
          session_id: string
          step_id: string | null
          tenant_id: string
          trigger_source: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_replay?: boolean
          payload?: Json
          session_id?: string
          step_id?: string | null
          tenant_id: string
          trigger_source: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_replay?: boolean
          payload?: Json
          session_id?: string
          step_id?: string | null
          tenant_id?: string
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_product_tour_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_product_tour_states: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step_index: number
          last_anchor_id: string | null
          last_event_at: string | null
          last_route: string | null
          metadata: Json
          replay_count: number
          skip_suppressed_until: string | null
          skipped_at: string | null
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step_index?: number
          last_anchor_id?: string | null
          last_event_at?: string | null
          last_route?: string | null
          metadata?: Json
          replay_count?: number
          skip_suppressed_until?: string | null
          skipped_at?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step_index?: number
          last_anchor_id?: string | null
          last_event_at?: string | null
          last_route?: string | null
          metadata?: Json
          replay_count?: number
          skip_suppressed_until?: string | null
          skipped_at?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_product_tour_states_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_environment_overrides: {
        Row: {
          created_at: string
          curfew_enabled: boolean | null
          curfew_time: string | null
          gender_restriction_mode: string | null
          max_occupants_per_unit: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          unit_id: string
          updated_at: string
          utility_policy_mode: string | null
          visitor_cutoff_enabled: boolean | null
          visitor_cutoff_time: string | null
        }
        Insert: {
          created_at?: string
          curfew_enabled?: boolean | null
          curfew_time?: string | null
          gender_restriction_mode?: string | null
          max_occupants_per_unit?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          unit_id: string
          updated_at?: string
          utility_policy_mode?: string | null
          visitor_cutoff_enabled?: boolean | null
          visitor_cutoff_time?: string | null
        }
        Update: {
          created_at?: string
          curfew_enabled?: boolean | null
          curfew_time?: string | null
          gender_restriction_mode?: string | null
          max_occupants_per_unit?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          unit_id?: string
          updated_at?: string
          utility_policy_mode?: string | null
          visitor_cutoff_enabled?: boolean | null
          visitor_cutoff_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_environment_overrides_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_map_positions: {
        Row: {
          floor_key: string
          h: number
          unit_id: string
          updated_at: string
          w: number
          x: number
          y: number
        }
        Insert: {
          floor_key: string
          h?: number
          unit_id: string
          updated_at?: string
          w?: number
          x?: number
          y?: number
        }
        Update: {
          floor_key?: string
          h?: number
          unit_id?: string
          updated_at?: string
          w?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "unit_map_positions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: true
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_transfer_requests: {
        Row: {
          created_at: string
          current_unit_id: string
          id: string
          landlord_id: string
          landlord_note: string | null
          lease_id: string
          property_id: string
          reason: string | null
          requested_unit_id: string
          status: Database["public"]["Enums"]["unit_transfer_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_unit_id: string
          id?: string
          landlord_id: string
          landlord_note?: string | null
          lease_id: string
          property_id: string
          reason?: string | null
          requested_unit_id: string
          status?: Database["public"]["Enums"]["unit_transfer_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_unit_id?: string
          id?: string
          landlord_id?: string
          landlord_note?: string | null
          lease_id?: string
          property_id?: string
          reason?: string | null
          requested_unit_id?: string
          status?: Database["public"]["Enums"]["unit_transfer_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_transfer_requests_current_unit_id_fkey"
            columns: ["current_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_transfer_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_transfer_requests_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_transfer_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_transfer_requests_requested_unit_id_fkey"
            columns: ["requested_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_transfer_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          baths: number
          beds: number
          created_at: string
          floor: number
          id: string
          name: string
          property_id: string
          rent_amount: number
          sqft: number | null
          status: Database["public"]["Enums"]["unit_status"]
          updated_at: string
        }
        Insert: {
          baths?: number
          beds?: number
          created_at?: string
          floor?: number
          id?: string
          name: string
          property_id: string
          rent_amount: number
          sqft?: number | null
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Update: {
          baths?: number
          beds?: number
          created_at?: string
          floor?: number
          id?: string
          name?: string
          property_id?: string
          rent_amount?: number
          sqft?: number | null
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_settings: {
        Row: {
          created_at: string
          has_changed_password: boolean
          otp_code: string | null
          otp_expiry: string | null
          profile_id: string
          two_factor_email: string | null
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_changed_password?: boolean
          otp_code?: string | null
          otp_expiry?: string | null
          profile_id: string
          two_factor_email?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_changed_password?: boolean
          otp_code?: string | null
          otp_expiry?: string | null
          profile_id?: string
          two_factor_email?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_configs: {
        Row: {
          billing_mode: Database["public"]["Enums"]["utility_billing_mode"]
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          landlord_id: string
          note: string | null
          property_id: string
          rate_per_unit: number
          unit_id: string | null
          unit_label: string
          updated_at: string
          utility_type: Database["public"]["Enums"]["utility_type"]
        }
        Insert: {
          billing_mode?: Database["public"]["Enums"]["utility_billing_mode"]
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          landlord_id: string
          note?: string | null
          property_id: string
          rate_per_unit?: number
          unit_id?: string | null
          unit_label: string
          updated_at?: string
          utility_type: Database["public"]["Enums"]["utility_type"]
        }
        Update: {
          billing_mode?: Database["public"]["Enums"]["utility_billing_mode"]
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          landlord_id?: string
          note?: string | null
          property_id?: string
          rate_per_unit?: number
          unit_id?: string | null
          unit_label?: string
          updated_at?: string
          utility_type?: Database["public"]["Enums"]["utility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "utility_configs_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_configs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_configs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_readings: {
        Row: {
          billed_rate: number
          billing_mode: Database["public"]["Enums"]["utility_billing_mode"]
          billing_period_end: string
          billing_period_start: string
          computed_charge: number
          created_at: string
          current_reading: number
          entered_at: string
          id: string
          landlord_id: string
          lease_id: string
          note: string | null
          payment_id: string | null
          previous_reading: number
          proof_image_path: string | null
          proof_image_url: string | null
          property_id: string
          unit_id: string
          updated_at: string
          usage: number
          utility_type: Database["public"]["Enums"]["utility_type"]
        }
        Insert: {
          billed_rate?: number
          billing_mode: Database["public"]["Enums"]["utility_billing_mode"]
          billing_period_end: string
          billing_period_start: string
          computed_charge?: number
          created_at?: string
          current_reading?: number
          entered_at?: string
          id?: string
          landlord_id: string
          lease_id: string
          note?: string | null
          payment_id?: string | null
          previous_reading?: number
          proof_image_path?: string | null
          proof_image_url?: string | null
          property_id: string
          unit_id: string
          updated_at?: string
          usage?: number
          utility_type: Database["public"]["Enums"]["utility_type"]
        }
        Update: {
          billed_rate?: number
          billing_mode?: Database["public"]["Enums"]["utility_billing_mode"]
          billing_period_end?: string
          billing_period_start?: string
          computed_charge?: number
          created_at?: string
          current_reading?: number
          entered_at?: string
          id?: string
          landlord_id?: string
          lease_id?: string
          note?: string | null
          payment_id?: string | null
          previous_reading?: number
          proof_image_path?: string | null
          proof_image_url?: string | null
          property_id?: string
          unit_id?: string
          updated_at?: string
          usage?: number
          utility_type?: Database["public"]["Enums"]["utility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "utility_readings_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_sessions: {
        Row: {
          created_at: string | null
          id: string | null
          ip: unknown
          not_after: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          ip?: unknown
          not_after?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          ip?: unknown
          not_after?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_renewal_windows: { Args: never; Returns: undefined }
      increment_post_view: {
        Args: { p_post_id: string; p_session_id: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      application_status:
        | "pending"
        | "reviewing"
        | "approved"
        | "rejected"
        | "withdrawn"
        | "payment_pending"
      lease_status:
        | "draft"
        | "pending_signature"
        | "active"
        | "expired"
        | "terminated"
        | "pending_tenant_signature"
        | "pending_landlord_signature"
      maintenance_priority: "low" | "medium" | "high" | "urgent"
      maintenance_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "closed"
      message_type: "text" | "system" | "image" | "file"
      move_out_status: "pending" | "approved" | "denied" | "completed"
      notification_type:
        | "payment"
        | "lease"
        | "maintenance"
        | "announcement"
        | "message"
        | "application"
        | "lease_renewal_available"
        | "lease_renewal_request"
        | "lease_renewal_approved"
        | "lease_renewal_rejected"
      payment_amount_tag: "exact" | "partial" | "overpaid" | "short_paid"
      payment_intent_method: "gcash" | "in_person"
      payment_method:
        | "credit_card"
        | "debit_card"
        | "gcash"
        | "maya"
        | "bank_transfer"
        | "cash"
      payment_review_action:
        | "accept_partial"
        | "request_completion"
        | "reject"
        | "confirm_received"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      payment_workflow_status:
        | "pending"
        | "reminder_sent"
        | "intent_submitted"
        | "under_review"
        | "awaiting_in_person"
        | "confirmed"
        | "rejected"
        | "receipted"
      post_status_enum: "draft" | "published" | "archived"
      post_type_enum: "announcement" | "poll" | "photo_album" | "discussion"
      property_type:
        | "apartment"
        | "condo"
        | "house"
        | "townhouse"
        | "studio"
        | "dormitory"
        | "boarding_house"
      reaction_type_enum:
        | "like"
        | "heart"
        | "thumbs_up"
        | "clap"
        | "celebration"
      renewal_status: "pending" | "approved" | "rejected" | "signed"
      report_status_enum: "pending" | "reviewed" | "dismissed" | "escalated"
      unit_status: "vacant" | "occupied" | "maintenance"
      unit_transfer_status: "pending" | "approved" | "denied" | "cancelled"
      user_role: "tenant" | "landlord" | "admin"
      utility_billing_mode: "included_in_rent" | "tenant_paid"
      utility_type: "water" | "electricity"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: [
        "pending",
        "reviewing",
        "approved",
        "rejected",
        "withdrawn",
        "payment_pending",
      ],
      lease_status: [
        "draft",
        "pending_signature",
        "active",
        "expired",
        "terminated",
        "pending_tenant_signature",
        "pending_landlord_signature",
      ],
      maintenance_priority: ["low", "medium", "high", "urgent"],
      maintenance_status: [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
      ],
      message_type: ["text", "system", "image", "file"],
      move_out_status: ["pending", "approved", "denied", "completed"],
      notification_type: [
        "payment",
        "lease",
        "maintenance",
        "announcement",
        "message",
        "application",
        "lease_renewal_available",
        "lease_renewal_request",
        "lease_renewal_approved",
        "lease_renewal_rejected",
      ],
      payment_amount_tag: ["exact", "partial", "overpaid", "short_paid"],
      payment_intent_method: ["gcash", "in_person"],
      payment_method: [
        "credit_card",
        "debit_card",
        "gcash",
        "maya",
        "bank_transfer",
        "cash",
      ],
      payment_review_action: [
        "accept_partial",
        "request_completion",
        "reject",
        "confirm_received",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      payment_workflow_status: [
        "pending",
        "reminder_sent",
        "intent_submitted",
        "under_review",
        "awaiting_in_person",
        "confirmed",
        "rejected",
        "receipted",
      ],
      post_status_enum: ["draft", "published", "archived"],
      post_type_enum: ["announcement", "poll", "photo_album", "discussion"],
      property_type: [
        "apartment",
        "condo",
        "house",
        "townhouse",
        "studio",
        "dormitory",
        "boarding_house",
      ],
      reaction_type_enum: ["like", "heart", "thumbs_up", "clap", "celebration"],
      renewal_status: ["pending", "approved", "rejected", "signed"],
      report_status_enum: ["pending", "reviewed", "dismissed", "escalated"],
      unit_status: ["vacant", "occupied", "maintenance"],
      unit_transfer_status: ["pending", "approved", "denied", "cancelled"],
      user_role: ["tenant", "landlord", "admin"],
      utility_billing_mode: ["included_in_rent", "tenant_paid"],
      utility_type: ["water", "electricity"],
    },
  },
} as const
