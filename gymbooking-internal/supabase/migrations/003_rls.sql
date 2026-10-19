-- =============================================================================
-- GymBooking Internal CRM - Migration 003: Row Level Security
-- =============================================================================
-- Enables RLS on every table and defines granular policies.
-- Key helpers used:
--   get_user_organization_id() → org isolation
--   is_admin()                 → admin-only operations
--   can_write()                → non-viewer write access
--   get_user_role()            → role-aware visibility (e.g. documents)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
ALTER TABLE organizations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_statuses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_statuses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_disciplines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags                ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_onboarding_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_attachments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_page_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations              ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- organizations
-- =============================================================================

-- Users can only see their own organization
CREATE POLICY "org_select" ON organizations
  FOR SELECT
  USING (id = get_user_organization_id());

-- =============================================================================
-- profiles
-- =============================================================================

-- All members of the same org can see each other's profiles
CREATE POLICY "profiles_select_own_org" ON profiles
  FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can update their own profile but cannot change their org or role
CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id              = auth.uid()
    AND organization_id = get_user_organization_id()
    AND role        = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins have full access to all profiles in the org
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL
  USING (is_admin());

-- =============================================================================
-- gyms  (org isolation + role-based write)
-- =============================================================================

CREATE POLICY "gyms_select" ON gyms
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "gyms_insert" ON gyms
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "gyms_update" ON gyms
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "gyms_delete" ON gyms
  FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- =============================================================================
-- gym_contacts
-- =============================================================================

CREATE POLICY "gym_contacts_select" ON gym_contacts
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "gym_contacts_write" ON gym_contacts
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- =============================================================================
-- gym_disciplines
-- =============================================================================

CREATE POLICY "gym_disciplines_select" ON gym_disciplines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gyms
      WHERE id = gym_disciplines.gym_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "gym_disciplines_write" ON gym_disciplines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gyms
      WHERE id = gym_disciplines.gym_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- =============================================================================
-- gym_tags
-- =============================================================================

CREATE POLICY "gym_tags_select" ON gym_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gyms
      WHERE id = gym_tags.gym_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "gym_tags_write" ON gym_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gyms
      WHERE id = gym_tags.gym_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- =============================================================================
-- disciplines
-- =============================================================================

CREATE POLICY "disciplines_select" ON disciplines
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "disciplines_write" ON disciplines
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- =============================================================================
-- tags
-- =============================================================================

CREATE POLICY "tags_select" ON tags
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "tags_write" ON tags
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- =============================================================================
-- commercial_statuses  (admin-managed configuration)
-- =============================================================================

CREATE POLICY "commercial_statuses_select" ON commercial_statuses
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "commercial_statuses_admin" ON commercial_statuses
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- =============================================================================
-- onboarding_statuses  (admin-managed configuration)
-- =============================================================================

CREATE POLICY "onboarding_statuses_select" ON onboarding_statuses
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "onboarding_statuses_admin" ON onboarding_statuses
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- =============================================================================
-- interactions
-- =============================================================================

CREATE POLICY "interactions_select" ON interactions
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "interactions_insert" ON interactions
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "interactions_update" ON interactions
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "interactions_delete" ON interactions
  FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- =============================================================================
-- tasks
-- =============================================================================

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- task_comments
CREATE POLICY "task_comments_select" ON task_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_comments.task_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "task_comments_insert" ON task_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- task_tags
CREATE POLICY "task_tags_access" ON task_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_tags.task_id
        AND organization_id = get_user_organization_id()
    )
  );

-- =============================================================================
-- onboarding_templates
-- =============================================================================

CREATE POLICY "onboarding_templates_select" ON onboarding_templates
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "onboarding_templates_write" ON onboarding_templates
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- onboarding_template_items
CREATE POLICY "onboarding_template_items_select" ON onboarding_template_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_templates
      WHERE id = onboarding_template_items.template_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "onboarding_template_items_write" ON onboarding_template_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_templates
      WHERE id = template_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- gym_onboarding_items
CREATE POLICY "gym_onboarding_items_select" ON gym_onboarding_items
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "gym_onboarding_items_write" ON gym_onboarding_items
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- =============================================================================
-- classes
-- =============================================================================

CREATE POLICY "classes_select" ON classes
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "classes_write" ON classes
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- class_schedules
CREATE POLICY "class_schedules_select" ON class_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_schedules.class_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "class_schedules_write" ON class_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- =============================================================================
-- issues
-- =============================================================================

CREATE POLICY "issues_select" ON issues
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "issues_insert" ON issues
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "issues_update" ON issues
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "issues_delete" ON issues
  FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- issue_comments
CREATE POLICY "issue_comments_select" ON issue_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE id = issue_comments.issue_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "issue_comments_insert" ON issue_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues
      WHERE id = issue_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- issue_attachments
CREATE POLICY "issue_attachments_select" ON issue_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE id = issue_attachments.issue_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "issue_attachments_write" ON issue_attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE id = issue_id
        AND organization_id = get_user_organization_id()
    )
    AND can_write()
  );

-- =============================================================================
-- documents  (visibility-aware)
-- =============================================================================

CREATE POLICY "documents_select" ON documents
  FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND (
      visibility = 'all'
      OR (visibility = 'admin_only'  AND is_admin())
      OR (visibility = 'operations'  AND get_user_role() IN ('admin', 'operations'))
      OR (visibility = 'commercial'  AND get_user_role() IN ('admin', 'commercial'))
    )
  );

CREATE POLICY "documents_insert" ON documents
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "documents_update" ON documents
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

CREATE POLICY "documents_delete" ON documents
  FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- =============================================================================
-- knowledge_pages
-- =============================================================================

CREATE POLICY "knowledge_pages_select" ON knowledge_pages
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "knowledge_pages_write" ON knowledge_pages
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- knowledge_page_history
CREATE POLICY "knowledge_page_history_select" ON knowledge_page_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_pages
      WHERE id = knowledge_page_history.page_id
        AND organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "knowledge_page_history_insert" ON knowledge_page_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_pages
      WHERE id = page_id
        AND organization_id = get_user_organization_id()
    )
  );

-- =============================================================================
-- decisions
-- =============================================================================

CREATE POLICY "decisions_select" ON decisions
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "decisions_write" ON decisions
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- =============================================================================
-- comments  (generic)
-- =============================================================================

CREATE POLICY "comments_select" ON comments
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "comments_insert" ON comments
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND can_write()
  );

-- =============================================================================
-- notifications  (own user only)
-- =============================================================================

-- Users can only read their own notifications
CREATE POLICY "notifications_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================================================
-- audit_logs  (read-only for admins; append-only for all)
-- No UPDATE or DELETE policies → immutable for every user
-- =============================================================================

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- =============================================================================
-- invitations
-- =============================================================================

-- Admins can view all invitations in their org
CREATE POLICY "invitations_select_admin" ON invitations
  FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- Admins can create invitations
CREATE POLICY "invitations_insert_admin" ON invitations
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- Admins can delete / revoke invitations
CREATE POLICY "invitations_delete_admin" ON invitations
  FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin()
  );

-- Public read by token: required so the invite-acceptance page can look up
-- the invitation before the user has an account. Filtering by token is
-- enforced at the application layer.
CREATE POLICY "invitations_read_by_token" ON invitations
  FOR SELECT
  USING (true);
