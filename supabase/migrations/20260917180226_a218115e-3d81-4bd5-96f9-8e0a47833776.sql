REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.profiles TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;