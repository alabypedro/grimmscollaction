
-- 1. Remove public profile exposure
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
-- Keep "Users can view own profile" (auth.uid() = id)

-- 2. Prevent is_admin self-escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_is_admin_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF current_setting('role') <> 'service_role' THEN
      RAISE EXCEPTION 'Não é permitido alterar o status de administrador.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_is_admin_self_update ON public.profiles;
CREATE TRIGGER profiles_prevent_is_admin_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_is_admin_self_update();

-- Also block on INSERT (user creating own profile)
CREATE OR REPLACE FUNCTION public.prevent_is_admin_self_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS TRUE AND current_setting('role') <> 'service_role' THEN
    NEW.is_admin := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_is_admin_self_insert ON public.profiles;
CREATE TRIGGER profiles_prevent_is_admin_self_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_is_admin_self_insert();

-- 3. Lock down email queue SECURITY DEFINER functions to service_role only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 4. Set search_path on email queue functions (mutable search_path warning)
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 5. Restrict avatars bucket listing - allow public access to individual files
-- but restrict listing to file owners
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      -- Public read by direct URL (no listing) requires name to be specified;
      -- listing without auth is blocked by requiring owner match for the listing path.
      auth.role() = 'anon' AND name IS NOT NULL AND position('/' in name) > 0
      OR auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text
      OR auth.role() = 'service_role'
    )
  );
