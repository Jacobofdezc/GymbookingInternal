-- =============================================================================
-- GymBooking Internal CRM - Migration 002: Functions & Triggers
-- =============================================================================
-- Helper functions, auth user trigger, audit log utility, and
-- notification triggers. All functions use SECURITY DEFINER with an
-- explicit empty search_path for security.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- get_user_organization_id
-- Returns the organization_id for the currently authenticated user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND is_active = true;
$$;

-- ---------------------------------------------------------------------------
-- get_user_role
-- Returns the role for the currently authenticated user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
    AND is_active = true;
$$;

-- ---------------------------------------------------------------------------
-- is_admin
-- Returns true if the current user has the 'admin' role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles
    WHERE id        = auth.uid()
      AND role      = 'admin'
      AND is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- can_write
-- Returns true if the current user has a write-capable role
-- (admin, commercial, or operations). Viewers cannot write.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_write()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.profiles
    WHERE id        = auth.uid()
      AND role      IN ('admin', 'commercial', 'operations')
      AND is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user
-- Trigger function called after a new row is inserted into auth.users.
-- Looks for a pending invitation for the user's email and, if found,
-- creates a profile and marks the invitation as accepted.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.invitations%ROWTYPE;
BEGIN
  -- Look for the most recent valid invitation for this email
  SELECT *
  INTO v_invitation
  FROM public.invitations
  WHERE email       = NEW.email
    AND accepted_at IS NULL
    AND expires_at  > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invitation.id IS NOT NULL THEN
    -- Create profile from invitation data
    INSERT INTO public.profiles (id, organization_id, full_name, email, role)
    VALUES (
      NEW.id,
      v_invitation.organization_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      v_invitation.role
    );

    -- Mark invitation as accepted
    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = v_invitation.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: auto-create profile when a new auth user signs up via invitation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- create_audit_log
-- Convenience function to append an entry to audit_logs from application
-- code or other trigger functions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_audit_log(
  p_entity_type text,
  p_entity_id   uuid,
  p_action      text,
  p_old_values  jsonb DEFAULT NULL,
  p_new_values  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  )
  VALUES (
    public.get_user_organization_id(),
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_values,
    p_new_values
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- create_notification
-- Inserts a notification for a user, deduplicating against identical
-- unread notifications created within the last hour.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id     uuid,
  p_type        text,
  p_title       text,
  p_message     text  DEFAULT NULL,
  p_entity_type text  DEFAULT NULL,
  p_entity_id   uuid  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Avoid duplicates: skip if an identical unread notification was created in the last hour
  IF NOT EXISTS (
    SELECT 1
    FROM public.notifications
    WHERE user_id    = p_user_id
      AND type       = p_type
      AND entity_id  = p_entity_id
      AND is_read    = false
      AND created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.notifications (
      user_id,
      organization_id,
      type,
      title,
      message,
      entity_type,
      entity_id
    )
    SELECT
      p_user_id,
      organization_id,
      p_type,
      p_title,
      p_message,
      p_entity_type,
      p_entity_id
    FROM public.profiles
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- notify_task_assigned
-- Trigger function: sends notifications when a task is assigned,
-- its due date changes, or it becomes blocked.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Notify new assignee when task is assigned or reassigned
  IF NEW.assignee_id IS NOT NULL
    AND (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id)
  THEN
    PERFORM public.create_notification(
      NEW.assignee_id,
      'task_assigned',
      'Nueva tarea asignada',
      'Se te ha asignado: ' || NEW.title,
      'task',
      NEW.id
    );
  END IF;

  -- Notify if due_date changed
  IF NEW.assignee_id IS NOT NULL
    AND OLD.due_date IS DISTINCT FROM NEW.due_date
    AND NEW.due_date IS NOT NULL
  THEN
    PERFORM public.create_notification(
      NEW.assignee_id,
      'task_due_date_changed',
      'Fecha límite actualizada',
      'La fecha límite de "' || NEW.title || '" ha cambiado',
      'task',
      NEW.id
    );
  END IF;

  -- Notify if task becomes blocked
  IF NEW.assignee_id IS NOT NULL
    AND NEW.status = 'blocked'
    AND OLD.status != 'blocked'
  THEN
    PERFORM public.create_notification(
      NEW.assignee_id,
      'task_blocked',
      'Tarea bloqueada',
      'La tarea "' || NEW.title || '" ha sido marcada como bloqueada',
      'task',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fire on task updates
CREATE TRIGGER on_task_changed
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- Trigger: fire on task inserts (handles initial assignment notification)
CREATE TRIGGER on_task_created
  AFTER INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- ---------------------------------------------------------------------------
-- notify_urgent_issue
-- Trigger function: notifies the assignee whenever an urgent issue is
-- created or updated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_urgent_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.priority = 'urgent' AND NEW.assignee_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.assignee_id,
      'issue_urgent',
      'Incidencia urgente asignada',
      '"' || NEW.title || '" requiere atención inmediata',
      'issue',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fire on issue insert or update
CREATE TRIGGER on_issue_urgent
  AFTER INSERT OR UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION notify_urgent_issue();
