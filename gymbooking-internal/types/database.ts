/**
 * GymBooking Internal CRM - Supabase Database Types
 *
 * Fully typed database definitions matching the PostgreSQL schema.
 * Compatible with @supabase/supabase-js and @supabase/ssr.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================================================
// ENUM / LITERAL TYPES
// =============================================================================

export type UserRole = 'admin' | 'commercial' | 'operations' | 'viewer'

export type GymPriority = 'low' | 'medium' | 'high' | 'urgent'

export type GymInterestLevel = 'unknown' | 'low' | 'medium' | 'high' | 'very_high'

export type BookingManager = 'gym' | 'gymbooking' | 'mixed' | 'unknown'

export type ScheduleManager = 'gym' | 'gymbooking' | 'mixed' | 'unknown'

export type AgreementStatus = 'none' | 'verbal' | 'pending_formal' | 'formalized' | 'expired'

export type ContactPreferredChannel = 'email' | 'phone' | 'whatsapp' | 'instagram' | 'other'

export type ContactDecisionMaker = 'yes' | 'no' | 'unknown'

export type InteractionType =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'meeting_in_person'
  | 'video_call'
  | 'other_platform'
  | 'internal_note'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'

export type OnboardingItemStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels'

export type ClassAvailabilityType = 'open' | 'limited' | 'full' | 'cancelled'

export type ClassBookingMethod = 'app' | 'phone' | 'email' | 'walk_in' | 'other'

export type ClassPublicationStatus = 'received' | 'verified' | 'published' | 'unpublished' | 'archived'

export type IssueType =
  | 'commercial'
  | 'gym_data'
  | 'schedules'
  | 'classes'
  | 'bookings'
  | 'user'
  | 'technical_error'
  | 'security'
  | 'other'

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

export type IssueStatus = 'open' | 'investigating' | 'in_progress' | 'blocked' | 'resolved' | 'closed'

export type DocumentCategory =
  | 'agreements'
  | 'commercial_proposals'
  | 'gym_info'
  | 'schedules'
  | 'onboarding_material'
  | 'invoices'
  | 'other'

export type DocumentVisibility = 'all' | 'admin_only' | 'operations' | 'commercial'

export type KnowledgePageCategory =
  | 'product'
  | 'sales'
  | 'operations'
  | 'technology'
  | 'marketing'
  | 'administration'
  | 'decisions'
  | 'procedures'

export type KnowledgePageStatus = 'draft' | 'published'

export type KnowledgeCategory = KnowledgePageCategory
export type KnowledgeStatus = KnowledgePageStatus
export type PriorityLevel = TaskPriority

export type DecisionStatus = 'active' | 'replaced' | 'discarded'

export type EntityType =
  | 'gym'
  | 'interaction'
  | 'task'
  | 'issue'
  | 'document'
  | 'decision'
  | 'knowledge_page'

// =============================================================================
// DATABASE INTERFACE
// =============================================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }

      profiles: {
        Row: {
          id: string
          organization_id: string
          full_name: string
          email: string
          role: UserRole
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          full_name: string
          email: string
          role: UserRole
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          full_name?: string
          email?: string
          role?: UserRole
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      disciplines: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'disciplines_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      tags: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tags_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      commercial_statuses: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          color: string
          sort_order: number
          is_active: boolean
          is_pipeline_stage: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          color?: string
          sort_order?: number
          is_active?: boolean
          is_pipeline_stage?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          color?: string
          sort_order?: number
          is_active?: boolean
          is_pipeline_stage?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'commercial_statuses_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      onboarding_statuses: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          color: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          color?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          color?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'onboarding_statuses_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      gyms: {
        Row: {
          id: string
          organization_id: string
          name: string
          legal_name: string | null
          description: string | null
          website: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          lat: number | null
          lng: number | null
          instagram: string | null
          other_social: Record<string, string> | null
          contact_source: string | null
          commercial_status_id: string | null
          priority: GymPriority | null
          owner_id: string | null
          first_contact_date: string | null
          last_contact_date: string | null
          next_followup_date: string | null
          next_action: string | null
          interest_level: GymInterestLevel | null
          interest_reason: string | null
          commercial_notes: string | null
          gym_objections: string | null
          next_steps: string | null
          onboarding_status_id: string | null
          confirmation_date: string | null
          activation_date_expected: string | null
          activation_date_real: string | null
          classes_expected: number | null
          classes_verified: number | null
          onboarding_owner_id: string | null
          pending_info: string | null
          current_blockers: string | null
          business_model_proposed: string | null
          business_model_agreed: string | null
          commission_details: string | null
          booking_manager: BookingManager | null
          schedule_manager: ScheduleManager | null
          cancellation_policy: string | null
          special_conditions: string | null
          agreement_start_date: string | null
          agreement_review_date: string | null
          agreement_status: AgreementStatus | null
          contract_url: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          legal_name?: string | null
          description?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          lat?: number | null
          lng?: number | null
          instagram?: string | null
          other_social?: Record<string, string> | null
          contact_source?: string | null
          commercial_status_id?: string | null
          priority?: GymPriority | null
          owner_id?: string | null
          first_contact_date?: string | null
          last_contact_date?: string | null
          next_followup_date?: string | null
          next_action?: string | null
          interest_level?: GymInterestLevel | null
          interest_reason?: string | null
          commercial_notes?: string | null
          gym_objections?: string | null
          next_steps?: string | null
          onboarding_status_id?: string | null
          confirmation_date?: string | null
          activation_date_expected?: string | null
          activation_date_real?: string | null
          classes_expected?: number | null
          classes_verified?: number | null
          onboarding_owner_id?: string | null
          pending_info?: string | null
          current_blockers?: string | null
          business_model_proposed?: string | null
          business_model_agreed?: string | null
          commission_details?: string | null
          booking_manager?: BookingManager | null
          schedule_manager?: ScheduleManager | null
          cancellation_policy?: string | null
          special_conditions?: string | null
          agreement_start_date?: string | null
          agreement_review_date?: string | null
          agreement_status?: AgreementStatus | null
          contract_url?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          legal_name?: string | null
          description?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          lat?: number | null
          lng?: number | null
          instagram?: string | null
          other_social?: Record<string, string> | null
          contact_source?: string | null
          commercial_status_id?: string | null
          priority?: GymPriority | null
          owner_id?: string | null
          first_contact_date?: string | null
          last_contact_date?: string | null
          next_followup_date?: string | null
          next_action?: string | null
          interest_level?: GymInterestLevel | null
          interest_reason?: string | null
          commercial_notes?: string | null
          gym_objections?: string | null
          next_steps?: string | null
          onboarding_status_id?: string | null
          confirmation_date?: string | null
          activation_date_expected?: string | null
          activation_date_real?: string | null
          classes_expected?: number | null
          classes_verified?: number | null
          onboarding_owner_id?: string | null
          pending_info?: string | null
          current_blockers?: string | null
          business_model_proposed?: string | null
          business_model_agreed?: string | null
          commission_details?: string | null
          booking_manager?: BookingManager | null
          schedule_manager?: ScheduleManager | null
          cancellation_policy?: string | null
          special_conditions?: string | null
          agreement_start_date?: string | null
          agreement_review_date?: string | null
          agreement_status?: AgreementStatus | null
          contract_url?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'gyms_commercial_status_id_fkey'
            columns: ['commercial_status_id']
            isOneToOne: false
            referencedRelation: 'commercial_statuses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gyms_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gyms_onboarding_owner_id_fkey'
            columns: ['onboarding_owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gyms_onboarding_status_id_fkey'
            columns: ['onboarding_status_id']
            isOneToOne: false
            referencedRelation: 'onboarding_statuses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gyms_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gyms_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      gym_contacts: {
        Row: {
          id: string
          organization_id: string
          gym_id: string
          full_name: string
          job_title: string | null
          email: string | null
          phone: string | null
          preferred_channel: ContactPreferredChannel | null
          is_decision_maker: ContactDecisionMaker
          is_primary: boolean
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          gym_id: string
          full_name: string
          job_title?: string | null
          email?: string | null
          phone?: string | null
          preferred_channel?: ContactPreferredChannel | null
          is_decision_maker?: ContactDecisionMaker
          is_primary?: boolean
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          gym_id?: string
          full_name?: string
          job_title?: string | null
          email?: string | null
          phone?: string | null
          preferred_channel?: ContactPreferredChannel | null
          is_decision_maker?: ContactDecisionMaker
          is_primary?: boolean
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'gym_contacts_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_contacts_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_contacts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      interactions: {
        Row: {
          id: string
          organization_id: string
          gym_id: string
          contact_id: string | null
          type: InteractionType
          interaction_date: string
          registered_by: string | null
          summary: string
          outcome: string | null
          commitments: string | null
          next_step: string | null
          next_step_date: string | null
          related_links: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          gym_id: string
          contact_id?: string | null
          type: InteractionType
          interaction_date: string
          registered_by?: string | null
          summary: string
          outcome?: string | null
          commitments?: string | null
          next_step?: string | null
          next_step_date?: string | null
          related_links?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          gym_id?: string
          contact_id?: string | null
          type?: InteractionType
          interaction_date?: string
          registered_by?: string | null
          summary?: string
          outcome?: string | null
          commitments?: string | null
          next_step?: string | null
          next_step_date?: string | null
          related_links?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'interactions_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'gym_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interactions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interactions_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interactions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'interactions_registered_by_fkey'
            columns: ['registered_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      tasks: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          assignee_id: string | null
          priority: TaskPriority
          status: TaskStatus
          due_date: string | null
          completed_at: string | null
          completed_by: string | null
          gym_id: string | null
          contact_id: string | null
          issue_id: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          assignee_id?: string | null
          priority?: TaskPriority
          status?: TaskStatus
          due_date?: string | null
          completed_at?: string | null
          completed_by?: string | null
          gym_id?: string | null
          contact_id?: string | null
          issue_id?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          assignee_id?: string | null
          priority?: TaskPriority
          status?: TaskStatus
          due_date?: string | null
          completed_at?: string | null
          completed_by?: string | null
          gym_id?: string | null
          contact_id?: string | null
          issue_id?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_completed_by_fkey'
            columns: ['completed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'gym_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_issue_id_fkey'
            columns: ['issue_id']
            isOneToOne: false
            referencedRelation: 'issues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      task_comments: {
        Row: {
          id: string
          task_id: string
          content: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          task_id: string
          content: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'task_comments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          }
        ]
      }

      task_tags: {
        Row: {
          task_id: string
          tag_id: string
        }
        Insert: {
          task_id: string
          tag_id: string
        }
        Update: {
          task_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_tags_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          }
        ]
      }

      onboarding_templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          is_default?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'onboarding_templates_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      onboarding_template_items: {
        Row: {
          id: string
          template_id: string
          title: string
          description: string | null
          sort_order: number
          category: string | null
          requires_document: boolean
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          title: string
          description?: string | null
          sort_order?: number
          category?: string | null
          requires_document?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          title?: string
          description?: string | null
          sort_order?: number
          category?: string | null
          requires_document?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'onboarding_template_items_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'onboarding_templates'
            referencedColumns: ['id']
          }
        ]
      }

      gym_onboarding_items: {
        Row: {
          id: string
          organization_id: string
          gym_id: string
          template_item_id: string | null
          title: string
          description: string | null
          status: OnboardingItemStatus
          assignee_id: string | null
          due_date: string | null
          completed_at: string | null
          comment: string | null
          sort_order: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          gym_id: string
          template_item_id?: string | null
          title: string
          description?: string | null
          status?: OnboardingItemStatus
          assignee_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          comment?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          gym_id?: string
          template_item_id?: string | null
          title?: string
          description?: string | null
          status?: OnboardingItemStatus
          assignee_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          comment?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'gym_onboarding_items_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_onboarding_items_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_onboarding_items_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_onboarding_items_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_onboarding_items_template_item_id_fkey'
            columns: ['template_item_id']
            isOneToOne: false
            referencedRelation: 'onboarding_template_items'
            referencedColumns: ['id']
          }
        ]
      }

      classes: {
        Row: {
          id: string
          organization_id: string
          gym_id: string
          discipline_id: string | null
          name: string
          description: string | null
          level: ClassLevel | null
          duration_minutes: number | null
          price: number | null
          price_currency: string
          location_details: string | null
          capacity: number | null
          availability_type: ClassAvailabilityType | null
          booking_method: ClassBookingMethod | null
          publication_status: ClassPublicationStatus
          last_verified_at: string | null
          verified_by: string | null
          info_source: string | null
          notes: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          gym_id: string
          discipline_id?: string | null
          name: string
          description?: string | null
          level?: ClassLevel | null
          duration_minutes?: number | null
          price?: number | null
          price_currency?: string
          location_details?: string | null
          capacity?: number | null
          availability_type?: ClassAvailabilityType | null
          booking_method?: ClassBookingMethod | null
          publication_status?: ClassPublicationStatus
          last_verified_at?: string | null
          verified_by?: string | null
          info_source?: string | null
          notes?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          gym_id?: string
          discipline_id?: string | null
          name?: string
          description?: string | null
          level?: ClassLevel | null
          duration_minutes?: number | null
          price?: number | null
          price_currency?: string
          location_details?: string | null
          capacity?: number | null
          availability_type?: ClassAvailabilityType | null
          booking_method?: ClassBookingMethod | null
          publication_status?: ClassPublicationStatus
          last_verified_at?: string | null
          verified_by?: string | null
          info_source?: string | null
          notes?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'classes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_discipline_id_fkey'
            columns: ['discipline_id']
            isOneToOne: false
            referencedRelation: 'disciplines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classes_verified_by_fkey'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      class_schedules: {
        Row: {
          id: string
          class_id: string
          day_of_week: number
          start_time: string
          end_time: string
          timezone: string
          is_active: boolean
          valid_from: string | null
          valid_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          day_of_week: number
          start_time: string
          end_time: string
          timezone?: string
          is_active?: boolean
          valid_from?: string | null
          valid_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          timezone?: string
          is_active?: boolean
          valid_from?: string | null
          valid_until?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'class_schedules_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          }
        ]
      }

      issues: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          type: IssueType
          priority: IssuePriority
          status: IssueStatus
          assignee_id: string | null
          due_date: string | null
          resolved_at: string | null
          gym_id: string | null
          class_id: string | null
          reproduction_steps: string | null
          solution_applied: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          type: IssueType
          priority?: IssuePriority
          status?: IssueStatus
          assignee_id?: string | null
          due_date?: string | null
          resolved_at?: string | null
          gym_id?: string | null
          class_id?: string | null
          reproduction_steps?: string | null
          solution_applied?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          type?: IssueType
          priority?: IssuePriority
          status?: IssueStatus
          assignee_id?: string | null
          due_date?: string | null
          resolved_at?: string | null
          gym_id?: string | null
          class_id?: string | null
          reproduction_steps?: string | null
          solution_applied?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'issues_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issues_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issues_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issues_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issues_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      issue_comments: {
        Row: {
          id: string
          issue_id: string
          content: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          issue_id: string
          content: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          issue_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'issue_comments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issue_comments_issue_id_fkey'
            columns: ['issue_id']
            isOneToOne: false
            referencedRelation: 'issues'
            referencedColumns: ['id']
          }
        ]
      }

      issue_attachments: {
        Row: {
          id: string
          issue_id: string
          file_name: string
          storage_path: string
          content_type: string | null
          size_bytes: number | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          issue_id: string
          file_name: string
          storage_path: string
          content_type?: string | null
          size_bytes?: number | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          issue_id?: string
          file_name?: string
          storage_path?: string
          content_type?: string | null
          size_bytes?: number | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'issue_attachments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'issue_attachments_issue_id_fkey'
            columns: ['issue_id']
            isOneToOne: false
            referencedRelation: 'issues'
            referencedColumns: ['id']
          }
        ]
      }

      documents: {
        Row: {
          id: string
          organization_id: string
          name: string
          category: DocumentCategory | null
          description: string | null
          storage_path: string
          file_name: string
          content_type: string | null
          size_bytes: number | null
          visibility: DocumentVisibility
          version: string | null
          owner_id: string | null
          gym_id: string | null
          contact_id: string | null
          interaction_id: string | null
          task_id: string | null
          issue_id: string | null
          is_demo: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          category?: DocumentCategory | null
          description?: string | null
          storage_path: string
          file_name: string
          content_type?: string | null
          size_bytes?: number | null
          visibility?: DocumentVisibility
          version?: string | null
          owner_id?: string | null
          gym_id?: string | null
          contact_id?: string | null
          interaction_id?: string | null
          task_id?: string | null
          issue_id?: string | null
          is_demo?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          category?: DocumentCategory | null
          description?: string | null
          storage_path?: string
          file_name?: string
          content_type?: string | null
          size_bytes?: number | null
          visibility?: DocumentVisibility
          version?: string | null
          owner_id?: string | null
          gym_id?: string | null
          contact_id?: string | null
          interaction_id?: string | null
          task_id?: string | null
          issue_id?: string | null
          is_demo?: boolean
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'gym_contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_interaction_id_fkey'
            columns: ['interaction_id']
            isOneToOne: false
            referencedRelation: 'interactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_issue_id_fkey'
            columns: ['issue_id']
            isOneToOne: false
            referencedRelation: 'issues'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          }
        ]
      }

      knowledge_pages: {
        Row: {
          id: string
          organization_id: string
          title: string
          content: string | null
          category: KnowledgePageCategory | null
          author_id: string | null
          status: KnowledgePageStatus
          tags: string[] | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          content?: string | null
          category?: KnowledgePageCategory | null
          author_id?: string | null
          status?: KnowledgePageStatus
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          content?: string | null
          category?: KnowledgePageCategory | null
          author_id?: string | null
          status?: KnowledgePageStatus
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_pages_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_pages_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_pages_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      knowledge_page_history: {
        Row: {
          id: string
          page_id: string
          content: string | null
          title: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          page_id: string
          content?: string | null
          title?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          content?: string | null
          title?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_page_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_page_history_page_id_fkey'
            columns: ['page_id']
            isOneToOne: false
            referencedRelation: 'knowledge_pages'
            referencedColumns: ['id']
          }
        ]
      }

      decisions: {
        Row: {
          id: string
          organization_id: string
          title: string
          context: string | null
          decision_made: string
          reason: string | null
          responsible_id: string | null
          decision_date: string | null
          consequences: string | null
          status: DecisionStatus
          replaces_decision_id: string | null
          gym_id: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          context?: string | null
          decision_made: string
          reason?: string | null
          responsible_id?: string | null
          decision_date?: string | null
          consequences?: string | null
          status?: DecisionStatus
          replaces_decision_id?: string | null
          gym_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          context?: string | null
          decision_made?: string
          reason?: string | null
          responsible_id?: string | null
          decision_date?: string | null
          consequences?: string | null
          status?: DecisionStatus
          replaces_decision_id?: string | null
          gym_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'decisions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'decisions_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'decisions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'decisions_replaces_decision_id_fkey'
            columns: ['replaces_decision_id']
            isOneToOne: false
            referencedRelation: 'decisions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'decisions_responsible_id_fkey'
            columns: ['responsible_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      comments: {
        Row: {
          id: string
          organization_id: string
          entity_type: EntityType
          entity_id: string
          content: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          entity_type: EntityType
          entity_id: string
          content: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          entity_type?: EntityType
          entity_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'comments_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      notifications: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          type: string
          title: string
          message: string | null
          entity_type: string | null
          entity_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          type: string
          title: string
          message?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          type?: string
          title?: string
          message?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      audit_logs: {
        Row: {
          id: string
          organization_id: string
          actor_user_id: string | null
          entity_type: string
          entity_id: string | null
          action: string
          old_values: Record<string, unknown> | null
          new_values: Record<string, unknown> | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          actor_user_id?: string | null
          entity_type: string
          entity_id?: string | null
          action: string
          old_values?: Record<string, unknown> | null
          new_values?: Record<string, unknown> | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          actor_user_id?: string | null
          entity_type?: string
          entity_id?: string | null
          action?: string
          old_values?: Record<string, unknown> | null
          new_values?: Record<string, unknown> | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_user_id_fkey'
            columns: ['actor_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: UserRole
          token: string
          invited_by: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role: UserRole
          token?: string
          invited_by?: string | null
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: UserRole
          token?: string
          invited_by?: string | null
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invitations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }

      gym_disciplines: {
        Row: {
          gym_id: string
          discipline_id: string
        }
        Insert: {
          gym_id: string
          discipline_id: string
        }
        Update: {
          gym_id?: string
          discipline_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gym_disciplines_discipline_id_fkey'
            columns: ['discipline_id']
            isOneToOne: false
            referencedRelation: 'disciplines'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_disciplines_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          }
        ]
      }

      gym_tags: {
        Row: {
          gym_id: string
          tag_id: string
        }
        Insert: {
          gym_id: string
          tag_id: string
        }
        Update: {
          gym_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'gym_tags_gym_id_fkey'
            columns: ['gym_id']
            isOneToOne: false
            referencedRelation: 'gyms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'gym_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      [_ in never]: never
    }

    Enums: {
      [_ in never]: never
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================================
// CONVENIENCE HELPER TYPES
// =============================================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// =============================================================================
// SPECIFIC ENTITY TYPES
// =============================================================================

export type Organization = Tables<'organizations'>
export type Profile = Tables<'profiles'>
export type Discipline = Tables<'disciplines'>
export type Tag = Tables<'tags'>
export type CommercialStatus = Tables<'commercial_statuses'>
export type OnboardingStatus = Tables<'onboarding_statuses'>
export type Gym = Tables<'gyms'>
export type GymContact = Tables<'gym_contacts'>
export type Interaction = Tables<'interactions'>
export type Task = Tables<'tasks'>
export type TaskComment = Tables<'task_comments'>
export type OnboardingTemplate = Tables<'onboarding_templates'>
export type OnboardingTemplateItem = Tables<'onboarding_template_items'>
export type GymOnboardingItem = Tables<'gym_onboarding_items'>
export type Class = Tables<'classes'>
export type ClassSchedule = Tables<'class_schedules'>
export type Issue = Tables<'issues'>
export type IssueComment = Tables<'issue_comments'>
export type IssueAttachment = Tables<'issue_attachments'>
export type Document = Tables<'documents'>
export type KnowledgePage = Tables<'knowledge_pages'>
export type KnowledgePageHistory = Tables<'knowledge_page_history'>
export type Decision = Tables<'decisions'>
export type Comment = Tables<'comments'>
export type Notification = Tables<'notifications'>
export type AuditLog = Tables<'audit_logs'>
export type Invitation = Tables<'invitations'>
export type GymDiscipline = Tables<'gym_disciplines'>
export type GymTag = Tables<'gym_tags'>
export type TaskTag = Tables<'task_tags'>

// =============================================================================
// EXTENDED / COMPOSITE ENTITY TYPES WITH RELATIONS
// =============================================================================

export type GymWithRelations = Gym & {
  commercial_status: CommercialStatus | null
  onboarding_status: OnboardingStatus | null
  owner: Profile | null
  disciplines: Discipline[]
  tags: Tag[]
}

export type TaskWithRelations = Task & {
  assignee: Profile | null
  created_by_user: Profile | null
  gym: { id: string; name: string } | null
}

export type InteractionWithRelations = Interaction & {
  gym: { id: string; name: string }
  contact: GymContact | null
  registered_by_user: Profile | null
}

export type IssueWithRelations = Issue & {
  assignee: Profile | null
  gym: { id: string; name: string } | null
  created_by_user: Profile | null
}

export type DocumentInsert = TablesInsert<'documents'>
export type DocumentUpdate = TablesUpdate<'documents'>
export type KnowledgePageInsert = TablesInsert<'knowledge_pages'>
export type KnowledgePageUpdate = TablesUpdate<'knowledge_pages'>
export type InvitationInsert = TablesInsert<'invitations'>
export type InvitationUpdate = TablesUpdate<'invitations'>

export type DocumentWithRelations = Document & {
  owner?: { id: string; full_name: string; email: string; avatar_url: string | null } | null
  gym?: { id: string; name: string } | null
}

export type KnowledgePageWithRelations = KnowledgePage & {
  author?: { id: string; full_name: string; email: string; avatar_url: string | null } | null
  history?: KnowledgePageHistory[]
}
