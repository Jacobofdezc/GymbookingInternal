-- =============================================================================
-- GymBooking Internal CRM - seed.sql
-- =============================================================================
-- DEMO DATA ONLY
-- All records created through this file are clearly marked with is_demo = true.
-- Remove or deactivate before using in production.
--
-- This seed file is meant to be run AFTER the bootstrap script creates the
-- organization. It requires a valid org UUID.
--
-- Usage options:
--
--   Option A – psql variable substitution:
--     psql -v org_id="'YOUR-ORG-UUID'" -f seed.sql
--
--   Option B – call the seed function directly (recommended):
--     SELECT seed_organization_data('YOUR-ORG-UUID');
--
--   Option C – use the application's bootstrap endpoint which calls
--     seed_organization_data() automatically after org creation.
--
-- NOTE: No real gym data, credentials, or personal information is included
-- here. All demo records use fictional data and are labeled DEMO.
-- =============================================================================

SELECT
  'Run seed_organization_data(''<your-org-uuid>'') to populate '
  || 'commercial statuses, onboarding statuses, disciplines, '
  || 'and the default onboarding template for your organization.' AS info;
