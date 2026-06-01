-- Fix the function to be secure and only callable by admins
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email TEXT, admin_status BOOLEAN)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
  caller_is_admin BOOLEAN;
BEGIN
  -- Check if the caller is an admin
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  
  -- Also allow service_role
  IF NOT caller_is_admin AND current_setting('role') <> 'service_role' THEN
    RAISE EXCEPTION 'Apenas administradores podem gerenciar outros administradores.';
  END IF;

  -- Get user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    UPDATE public.profiles SET is_admin = admin_status WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Usuário com o email % não encontrado.', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke execute from PUBLIC and authenticated (to be safe, though the function checks inside)
-- We actually need authenticated to execute it if we want them to use it from the UI
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) TO authenticated;

-- Create a view to list admins (to be used in the admin panel)
-- Since it joins with auth.users, we need to handle permissions
CREATE OR REPLACE VIEW public.admin_profiles AS
SELECT p.id, p.full_name, p.username, u.email, p.is_admin
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true;

-- Grant access to the view
GRANT SELECT ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;

-- Enable RLS on the view is not possible directly, but we can use a policy on profiles
-- or just rely on the app logic + the fact that only admins should see this page.
-- However, let's make the view only return data if the caller is an admin.

CREATE OR REPLACE VIEW public.admin_profiles AS
SELECT p.id, p.full_name, p.username, u.email, p.is_admin
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.is_admin = true
AND (
  SELECT is_admin FROM public.profiles WHERE id = auth.uid()
  OR current_setting('role') = 'service_role'
);
