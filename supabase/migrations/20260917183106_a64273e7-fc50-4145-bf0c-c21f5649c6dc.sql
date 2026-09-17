ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wake_time text,
  ADD COLUMN IF NOT EXISTS sleep_time text,
  ADD COLUMN IF NOT EXISTS baseline_cigarettes integer;

DROP POLICY IF EXISTS "Users can update their own profile except payment fields" ON public.profiles;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (wake_time, sleep_time, baseline_cigarettes) ON public.profiles TO authenticated;

CREATE POLICY "Users can update safe fields of their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.uid() IS NULL THEN
    RETURN new;
  END IF;
  IF new.payment_status IS DISTINCT FROM old.payment_status
     OR new.payment_provider IS DISTINCT FROM old.payment_provider
     OR new.payment_expires_at IS DISTINCT FROM old.payment_expires_at
     OR new.trial_started_at IS DISTINCT FROM old.trial_started_at
     OR new.user_id IS DISTINCT FROM old.user_id THEN
    RAISE EXCEPTION 'Diese Felder dürfen nicht vom Client geändert werden';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS protect_privileged_profile_fields ON public.profiles;
CREATE TRIGGER protect_privileged_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_profile_fields();

CREATE TABLE IF NOT EXISTS public.day_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  cigarettes_smoked integer NOT NULL DEFAULT 0,
  total_cigarettes integer NOT NULL DEFAULT 0,
  extra_count integer NOT NULL DEFAULT 0,
  wake_time text,
  sleep_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_logs TO authenticated;
GRANT ALL ON public.day_logs TO service_role;

ALTER TABLE public.day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own day logs"
ON public.day_logs FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_day_logs_updated_at ON public.day_logs;
CREATE TRIGGER update_day_logs_updated_at
BEFORE UPDATE ON public.day_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();