-- Explicitly revoke from anon to see if it clears the warning
REVOKE EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM anon;

-- Ensure authenticated still has it (it was granted before, but let's be explicit)
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
