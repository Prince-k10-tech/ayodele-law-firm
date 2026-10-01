-- Remove the admin secret code system entirely

-- Drop the SECURITY DEFINER functions first
DROP FUNCTION IF EXISTS public.verify_admin_secret_code(text, text);
DROP FUNCTION IF EXISTS public.update_admin_secret_code(text, text);
DROP FUNCTION IF EXISTS public.block_admin(text);
DROP FUNCTION IF EXISTS public.hash_code(text);

-- Drop the table
DROP TABLE IF EXISTS admin_secret_codes;
