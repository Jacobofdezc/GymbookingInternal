-- =============================================================================
-- GymBooking Internal CRM - Migration 001: Schema
-- =============================================================================
-- Creates all tables, indexes, and updated_at triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text        NOT NULL,
  slug       text        UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- profiles (linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name       text        NOT NULL,
  email           text        NOT NULL,
  role            text        NOT NULL CHECK (role IN ('admin', 'commercial', 'operations', 'viewer')),
  avatar_url      text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- disciplines
-- ---------------------------------------------------------------------------
CREATE TABLE disciplines (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  slug            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
CREATE TABLE tags (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  color           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- ---------------------------------------------------------------------------
-- commercial_statuses (configurable, not hardcoded)
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_statuses (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  slug                text        NOT NULL,
  color               text        NOT NULL DEFAULT '#6B7280',
  sort_order          integer     NOT NULL DEFAULT 0,
  is_active           boolean     NOT NULL DEFAULT true,
  is_pipeline_stage   boolean     NOT NULL DEFAULT true, -- appears on kanban
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- ---------------------------------------------------------------------------
-- onboarding_statuses (configurable)
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_statuses (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  slug            text        NOT NULL,
  color           text        NOT NULL DEFAULT '#6B7280',
  sort_order      integer     NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- ---------------------------------------------------------------------------
-- gyms (main table)
-- ---------------------------------------------------------------------------
CREATE TABLE gyms (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  name            text        NOT NULL,
  legal_name      text,
  description     text,
  website         text,
  phone           text,
  email           text,
  address         text,
  city            text,
  postal_code     text,
  lat             numeric(10,7),
  lng             numeric(10,7),
  instagram       text,
  other_social    jsonb,
  contact_source  text,

  -- Commercial tracking
  commercial_status_id  uuid  REFERENCES commercial_statuses(id),
  priority              text  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  owner_id              uuid  REFERENCES profiles(id),
  first_contact_date    date,
  last_contact_date     date,
  next_followup_date    date,
  next_action           text,
  interest_level        text  CHECK (interest_level IN ('unknown', 'low', 'medium', 'high', 'very_high')),
  interest_reason       text,
  commercial_notes      text,
  gym_objections        text,
  next_steps            text,

  -- Onboarding / incorporation
  onboarding_status_id      uuid     REFERENCES onboarding_statuses(id),
  confirmation_date         date,
  activation_date_expected  date,
  activation_date_real      date,
  classes_expected          integer,
  classes_verified          integer,
  onboarding_owner_id       uuid     REFERENCES profiles(id),
  pending_info              text,
  current_blockers          text,

  -- Commercial conditions
  business_model_proposed   text,
  business_model_agreed     text,
  commission_details        text,
  booking_manager           text  CHECK (booking_manager IN ('gym', 'gymbooking', 'mixed', 'unknown')),
  schedule_manager          text  CHECK (schedule_manager IN ('gym', 'gymbooking', 'mixed', 'unknown')),
  cancellation_policy       text,
  special_conditions        text,
  agreement_start_date      date,
  agreement_review_date     date,
  agreement_status          text  CHECK (agreement_status IN ('none', 'verbal', 'pending_formal', 'formalized', 'expired')),
  contract_url              text,

  -- Meta
  is_demo     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- gym_disciplines (M:N)
-- ---------------------------------------------------------------------------
CREATE TABLE gym_disciplines (
  gym_id        uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  discipline_id uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  PRIMARY KEY (gym_id, discipline_id)
);

-- ---------------------------------------------------------------------------
-- gym_tags (M:N)
-- ---------------------------------------------------------------------------
CREATE TABLE gym_tags (
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (gym_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- gym_contacts
-- ---------------------------------------------------------------------------
CREATE TABLE gym_contacts (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gym_id           uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  full_name        text        NOT NULL,
  job_title        text,
  email            text,
  phone            text,
  preferred_channel text       CHECK (preferred_channel IN ('email', 'phone', 'whatsapp', 'instagram', 'other')),
  is_decision_maker text       CHECK (is_decision_maker IN ('yes', 'no', 'unknown')) DEFAULT 'unknown',
  is_primary       boolean     NOT NULL DEFAULT false,
  notes            text,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- interactions
-- ---------------------------------------------------------------------------
CREATE TABLE interactions (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gym_id           uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  contact_id       uuid        REFERENCES gym_contacts(id),
  type             text        NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting_in_person', 'video_call', 'other_platform', 'internal_note')),
  interaction_date timestamptz NOT NULL,
  registered_by    uuid        REFERENCES profiles(id),
  summary          text        NOT NULL,
  outcome          text,
  commitments      text,
  next_step        text,
  next_step_date   date,
  related_links    text,
  is_demo          boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
CREATE TABLE tasks (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  assignee_id     uuid        REFERENCES profiles(id),
  priority        text        NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status          text        NOT NULL CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date        date,
  completed_at    timestamptz,
  completed_by    uuid        REFERENCES profiles(id),
  gym_id          uuid        REFERENCES gyms(id),
  contact_id      uuid        REFERENCES gym_contacts(id),
  issue_id        uuid,       -- FK added after issues table
  is_demo         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- task_comments
-- ---------------------------------------------------------------------------
CREATE TABLE task_comments (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    uuid        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- task_tags (M:N)
-- ---------------------------------------------------------------------------
CREATE TABLE task_tags (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- onboarding_templates
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_templates (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  is_default      boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- onboarding_template_items
-- ---------------------------------------------------------------------------
CREATE TABLE onboarding_template_items (
  id                 uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id        uuid        NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  title              text        NOT NULL,
  description        text,
  sort_order         integer     NOT NULL DEFAULT 0,
  category           text,
  requires_document  boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- gym_onboarding_items (checklist per gym)
-- ---------------------------------------------------------------------------
CREATE TABLE gym_onboarding_items (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gym_id           uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  template_item_id uuid        REFERENCES onboarding_template_items(id),
  title            text        NOT NULL,
  description      text,
  status           text        NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')) DEFAULT 'pending',
  assignee_id      uuid        REFERENCES profiles(id),
  due_date         date,
  completed_at     timestamptz,
  comment          text,
  sort_order       integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------------------
CREATE TABLE classes (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gym_id              uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  discipline_id       uuid        REFERENCES disciplines(id),
  name                text        NOT NULL,
  description         text,
  level               text        CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  duration_minutes    integer,
  price               numeric(10,2),
  price_currency      text        DEFAULT 'EUR',
  location_details    text,       -- room/address within gym
  capacity            integer,
  availability_type   text        CHECK (availability_type IN ('open', 'limited', 'full', 'cancelled')),
  booking_method      text        CHECK (booking_method IN ('app', 'phone', 'email', 'walk_in', 'other')),
  publication_status  text        NOT NULL CHECK (publication_status IN ('received', 'verified', 'published', 'unpublished', 'archived')) DEFAULT 'received',
  last_verified_at    timestamptz,
  verified_by         uuid        REFERENCES profiles(id),
  info_source         text,
  notes               text,
  is_demo             boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- class_schedules
-- ---------------------------------------------------------------------------
CREATE TABLE class_schedules (
  id          uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    uuid    NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time  time    NOT NULL,
  end_time    time    NOT NULL,
  timezone    text    NOT NULL DEFAULT 'Europe/Madrid',
  is_active   boolean NOT NULL DEFAULT true,
  valid_from  date,
  valid_until date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- issues
-- ---------------------------------------------------------------------------
CREATE TABLE issues (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  description         text,
  type                text        NOT NULL CHECK (type IN ('commercial', 'gym_data', 'schedules', 'classes', 'bookings', 'user', 'technical_error', 'security', 'other')),
  priority            text        NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status              text        NOT NULL CHECK (status IN ('open', 'investigating', 'in_progress', 'blocked', 'resolved', 'closed')) DEFAULT 'open',
  assignee_id         uuid        REFERENCES profiles(id),
  due_date            date,
  resolved_at         timestamptz,
  gym_id              uuid        REFERENCES gyms(id),
  class_id            uuid        REFERENCES classes(id),
  reproduction_steps  text,
  solution_applied    text,
  is_demo             boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid        REFERENCES profiles(id)
);

-- Add FK from tasks to issues now that issues table exists
ALTER TABLE tasks
  ADD CONSTRAINT tasks_issue_id_fkey
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- issue_comments
-- ---------------------------------------------------------------------------
CREATE TABLE issue_comments (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id   uuid        NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- issue_attachments (metadata only; files in Storage)
-- ---------------------------------------------------------------------------
CREATE TABLE issue_attachments (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id     uuid        NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  file_name    text        NOT NULL,
  storage_path text        NOT NULL,
  content_type text,
  size_bytes   bigint,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  category        text        CHECK (category IN ('agreements', 'commercial_proposals', 'gym_info', 'schedules', 'onboarding_material', 'invoices', 'other')),
  description     text,
  storage_path    text        NOT NULL,
  file_name       text        NOT NULL,
  content_type    text,
  size_bytes      bigint,
  visibility      text        NOT NULL CHECK (visibility IN ('all', 'admin_only', 'operations', 'commercial')) DEFAULT 'all',
  version         text,
  owner_id        uuid        REFERENCES profiles(id),
  -- Polymorphic relation (only one should be non-null at a time)
  gym_id          uuid        REFERENCES gyms(id),
  contact_id      uuid        REFERENCES gym_contacts(id),
  interaction_id  uuid        REFERENCES interactions(id),
  task_id         uuid        REFERENCES tasks(id),
  issue_id        uuid        REFERENCES issues(id),
  is_demo         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- knowledge_pages
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_pages (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  content         text,
  category        text        CHECK (category IN ('product', 'sales', 'operations', 'technology', 'marketing', 'administration', 'decisions', 'procedures')),
  author_id       uuid        REFERENCES profiles(id),
  status          text        NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  tags            text[],     -- simple array for KB tags
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- knowledge_page_history
-- ---------------------------------------------------------------------------
CREATE TABLE knowledge_page_history (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id     uuid        NOT NULL REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  content     text,
  title       text,
  changed_by  uuid        REFERENCES profiles(id),
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- decisions
-- ---------------------------------------------------------------------------
CREATE TABLE decisions (
  id                    uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title                 text        NOT NULL,
  context               text,
  decision_made         text        NOT NULL,
  reason                text,
  responsible_id        uuid        REFERENCES profiles(id),
  decision_date         date,
  consequences          text,
  status                text        NOT NULL CHECK (status IN ('active', 'replaced', 'discarded')) DEFAULT 'active',
  replaces_decision_id  uuid        REFERENCES decisions(id),
  gym_id                uuid        REFERENCES gyms(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- comments (generic)
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type     text        NOT NULL CHECK (entity_type IN ('gym', 'interaction', 'task', 'issue', 'document', 'decision', 'knowledge_page')),
  entity_id       uuid        NOT NULL,
  content         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES profiles(id)
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            text        NOT NULL,
  title           text        NOT NULL,
  message         text,
  entity_type     text,
  entity_id       uuid,
  is_read         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- audit_logs (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id   uuid        REFERENCES profiles(id),
  entity_type     text        NOT NULL,
  entity_id       uuid,
  action          text        NOT NULL,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------------
CREATE TABLE invitations (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           text        NOT NULL,
  role            text        NOT NULL CHECK (role IN ('admin', 'commercial', 'operations', 'viewer')),
  token           text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by      uuid        REFERENCES profiles(id),
  accepted_at     timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_profiles_organization         ON profiles(organization_id);
CREATE INDEX idx_profiles_email                ON profiles(email);
CREATE INDEX idx_gyms_organization             ON gyms(organization_id);
CREATE INDEX idx_gyms_commercial_status        ON gyms(commercial_status_id);
CREATE INDEX idx_gyms_onboarding_status        ON gyms(onboarding_status_id);
CREATE INDEX idx_gyms_owner                    ON gyms(owner_id);
CREATE INDEX idx_gyms_city                     ON gyms(city);
CREATE INDEX idx_gyms_next_followup            ON gyms(next_followup_date);
CREATE INDEX idx_gyms_name_trgm                ON gyms USING gin(name gin_trgm_ops);
CREATE INDEX idx_gym_contacts_gym              ON gym_contacts(gym_id);
CREATE INDEX idx_interactions_gym              ON interactions(gym_id);
CREATE INDEX idx_interactions_date             ON interactions(interaction_date DESC);
CREATE INDEX idx_tasks_assignee                ON tasks(assignee_id);
CREATE INDEX idx_tasks_gym                     ON tasks(gym_id);
CREATE INDEX idx_tasks_status                  ON tasks(status);
CREATE INDEX idx_tasks_due_date                ON tasks(due_date);
CREATE INDEX idx_issues_organization           ON issues(organization_id);
CREATE INDEX idx_issues_status                 ON issues(status);
CREATE INDEX idx_documents_organization        ON documents(organization_id);
CREATE INDEX idx_documents_gym                 ON documents(gym_id);
CREATE INDEX idx_notifications_user            ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_entity             ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor              ON audit_logs(actor_user_id);
CREATE INDEX idx_knowledge_pages_organization  ON knowledge_pages(organization_id);
CREATE INDEX idx_commercial_statuses_org       ON commercial_statuses(organization_id, sort_order);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply trigger to all tables that have updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_contacts_updated_at
  BEFORE UPDATE ON gym_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_onboarding_items_updated_at
  BEFORE UPDATE ON gym_onboarding_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_pages_updated_at
  BEFORE UPDATE ON knowledge_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
