
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email text, admin_status boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) AND current_setting('role') <> 'service_role' THEN
    RAISE EXCEPTION 'Apenas administradores podem gerenciar outros administradores.';
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;

  IF target_user_id IS NOT NULL THEN
    UPDATE public.profiles SET is_admin = admin_status WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Usuário com o email % não encontrado.', user_email;
  END IF;
END;
$function$;
