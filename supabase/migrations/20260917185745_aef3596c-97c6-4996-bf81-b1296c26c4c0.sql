CREATE TABLE public.admin_unlock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_unlock_attempts TO service_role;
ALTER TABLE public.admin_unlock_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages unlock attempts"
ON public.admin_unlock_attempts FOR ALL
TO service_role
USING (true) WITH CHECK (true);
CREATE INDEX admin_unlock_attempts_ip_created_idx ON public.admin_unlock_attempts (ip, created_at DESC);