
REVOKE EXECUTE ON FUNCTION public.prevent_is_admin_self_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_is_admin_self_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_admin_by_email(text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;
-- get_admin_users and set_admin_by_email check is_admin internally, keep authenticated grant
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_by_email(text, boolean) TO authenticated;
