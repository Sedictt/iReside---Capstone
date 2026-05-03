ALTER TABLE public.maintenance_requests
ADD COLUMN IF NOT EXISTS ai_triage_priority maintenance_priority,
ADD COLUMN IF NOT EXISTS ai_triage_sentiment text,
ADD COLUMN IF NOT EXISTS ai_triage_reason text,
ADD COLUMN IF NOT EXISTS ai_triage_confidence double precision,
ADD COLUMN IF NOT EXISTS ai_triage_hash text,
ADD COLUMN IF NOT EXISTS ai_triage_version text,
ADD COLUMN IF NOT EXISTS ai_triaged_at timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'maintenance_requests_ai_triage_sentiment_check'
  ) THEN
    ALTER TABLE public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_ai_triage_sentiment_check
    CHECK (
      ai_triage_sentiment IS NULL OR
      ai_triage_sentiment IN ('distressed', 'negative', 'neutral', 'positive')
    );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_maintenance_ai_triage_hash
ON public.maintenance_requests (ai_triage_hash);
