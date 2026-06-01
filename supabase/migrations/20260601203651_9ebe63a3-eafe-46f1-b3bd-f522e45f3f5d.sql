-- Drop the insecure view
DROP VIEW IF EXISTS public.admin_profiles;

-- Create a function to list admins securely
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  email TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  -- Check if the caller is an admin or service_role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true) 
     AND current_setting('role') <> 'service_role' THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.username, u.email, p.is_admin
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.is_admin = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke all execute permissions from PUBLIC
REVOKE EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM PUBLIC;

-- Grant execute to authenticated users (internal checks will handle the rest)
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO service_role;
