CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(_key text, _limit integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur public.rate_limits%ROWTYPE;
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';

  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (_key, 1, now())
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN public.rate_limits.window_start < now() - make_interval(secs => _window_seconds) THEN 1
          ELSE public.rate_limits.count + 1
        END,
        window_start = CASE
          WHEN public.rate_limits.window_start < now() - make_interval(secs => _window_seconds) THEN now()
          ELSE public.rate_limits.window_start
        END
  RETURNING * INTO cur;

  RETURN cur.count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;