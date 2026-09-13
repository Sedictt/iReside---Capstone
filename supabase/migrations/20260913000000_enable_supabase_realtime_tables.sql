-- Enable Supabase Realtime for critical tables with REPLICA IDENTITY FULL
-- This ensures WAL broadcasts changes (INSERT, UPDATE, DELETE) to connected clients

ALTER TABLE "public"."notifications" REPLICA IDENTITY FULL;
ALTER TABLE "public"."applications" REPLICA IDENTITY FULL;
ALTER TABLE "public"."application_payment_requests" REPLICA IDENTITY FULL;
ALTER TABLE "public"."maintenance_requests" REPLICA IDENTITY FULL;
ALTER TABLE "public"."messages" REPLICA IDENTITY FULL;
ALTER TABLE "public"."conversations" REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."notifications";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."applications";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'application_payment_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."application_payment_requests";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'maintenance_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."maintenance_requests";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."messages";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "public"."conversations";
  END IF;
END $$;
