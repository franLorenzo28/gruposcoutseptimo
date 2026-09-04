-- Fix infinite recursion in conversation_participants policies
-- The issue is that the policies are checking themselves recursively

-- Drop existing problematic policies
DROP POLICY IF EXISTS participants_read_participant ON public.conversation_participants;
DROP POLICY IF EXISTS participants_insert_self ON public.conversation_participants;

-- Recreate with simpler, non-recursive policies
CREATE POLICY participants_read_self ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY participants_insert_self ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Fix messages policies to avoid recursion
DROP POLICY IF EXISTS messages_read_participant ON public.messages;
DROP POLICY IF EXISTS messages_insert_self ON public.messages;

-- Messages: read if you're a participant (simple join, no subquery)
CREATE POLICY messages_read_participant ON public.messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: insert if sender is self AND you're a participant
CREATE POLICY messages_insert_participant ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );
