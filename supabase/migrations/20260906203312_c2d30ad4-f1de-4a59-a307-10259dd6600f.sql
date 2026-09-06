CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  wake_time TEXT NOT NULL DEFAULT '06:00',
  sleep_time TEXT NOT NULL DEFAULT '23:00',
  daily_cigarettes INTEGER NOT NULL DEFAULT 20,
  timezone TEXT NOT NULL DEFAULT 'Europe/Zurich',
  last_sent_slot TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Keine Policies: nur service_role (Edge Functions) greift zu.