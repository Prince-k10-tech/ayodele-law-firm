-- Secure application roles for K.O AYODELE & CO.
-- This migration is intentionally additive: it preserves existing accounts and
-- only assigns the two known maintenance roles.
--
-- iretomiwadada780@gmail.com = superadmin/developer
-- koayodeleandco@gmail.com = normal firm admin

UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('role', 'superadmin')
WHERE lower(email) = 'iretomiwadada780@gmail.com';

UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('role', 'admin')
WHERE lower(email) = 'koayodeleandco@gmail.com';

-- Authorization helpers read app_metadata from the authenticated JWT.
-- No frontend-only role assignment is introduced here.
