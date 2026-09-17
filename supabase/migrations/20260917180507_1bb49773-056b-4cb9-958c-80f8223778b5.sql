REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (user_id) ON public.profiles TO authenticated;