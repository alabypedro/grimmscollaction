-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create a function to set admin status by email
-- This requires accessing auth.users which is restricted, so we use security definer
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email TEXT, admin_status BOOLEAN)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    UPDATE public.profiles SET is_admin = admin_status WHERE id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (we'll check if they are admin in the app)
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) TO service_role;

-- Try to set pedroalaby@gmail.com as admin
-- Note: This might not work if the user hasn't signed up yet, but we'll try.
DO $$
BEGIN
  PERFORM public.set_admin_by_email('pedroalaby@gmail.com', true);
END $$;
