DROP POLICY IF EXISTS otp_select_own ON public.otp_codes;
DROP POLICY IF EXISTS otp_insert_own ON public.otp_codes;
DROP POLICY IF EXISTS otp_update_own ON public.otp_codes;
DROP POLICY IF EXISTS otp_delete_own ON public.otp_codes;

REVOKE ALL ON TABLE public.otp_codes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_otp(p_code text, p_purpose text DEFAULT 'phone_verification')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.otp_codes%rowtype;
  v_hash text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_code IS NULL OR p_code !~ '^[0-9]{6}$' THEN
    RETURN false;
  END IF;

  IF p_purpose NOT IN ('phone_verification', 'device_verification', 'password_reset') THEN
    RETURN false;
  END IF;

  SELECT *
    INTO v_row
    FROM public.otp_codes
   WHERE user_id = v_uid
     AND purpose = p_purpose
     AND consumed_at IS NULL
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND OR v_row.expires_at <= now() OR v_row.attempts >= 5 THEN
    RETURN false;
  END IF;

  UPDATE public.otp_codes
     SET attempts = attempts + 1
   WHERE id = v_row.id;

  v_hash := encode(extensions.digest(p_code, 'sha256'), 'hex');

  IF v_hash <> v_row.code_hash THEN
    RETURN false;
  END IF;

  UPDATE public.otp_codes
     SET consumed_at = now()
   WHERE id = v_row.id
     AND user_id = v_uid
     AND consumed_at IS NULL;

  IF p_purpose = 'phone_verification' THEN
    UPDATE public.user_profiles
       SET phone_verified = true,
           updated_at = now()
     WHERE id = v_uid;
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.verify_otp(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_otp(text, text) TO authenticated;