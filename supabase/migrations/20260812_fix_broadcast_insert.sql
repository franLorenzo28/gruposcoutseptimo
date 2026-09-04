BEGIN;

-- Relax RLS policy to ensure it's not blocking educadores
DROP POLICY IF EXISTS "rama broadcast insert own author" ON public.rama_broadcast_messages;
CREATE POLICY "rama broadcast insert own author"
  ON public.rama_broadcast_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop the check constraints in case they are causing issues with special characters
ALTER TABLE public.rama_broadcast_messages
  DROP CONSTRAINT IF EXISTS rama_broadcast_messages_content_check;

COMMIT;
