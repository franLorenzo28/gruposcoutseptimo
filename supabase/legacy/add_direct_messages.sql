-- add_direct_messages.sql
-- Conversations, participants, messages, RLS, and helper RPCs (idempotent)

DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION pgcrypto;
  END IF;
END $$;

-- conversations table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations'
  ) THEN
    CREATE TABLE public.conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      last_message_at timestamptz
    );
  END IF;
END $$;

-- conversation_participants table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_participants'
  ) THEN
    CREATE TABLE public.conversation_participants (
      conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      joined_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (conversation_id, user_id)
    );

    CREATE INDEX conversation_participants_user_idx ON public.conversation_participants (user_id);
  END IF;
END $$;

-- messages table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    CREATE TABLE public.messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
      sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 10000),
      created_at timestamptz NOT NULL DEFAULT now(),
      read_at timestamptz
    );

    CREATE INDEX messages_conversation_idx ON public.messages (conversation_id);
    CREATE INDEX messages_created_at_idx ON public.messages (created_at);
  END IF;
END $$;

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- policies: conversations read if participant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_read_participant'
  ) THEN
    CREATE POLICY conversations_read_participant ON public.conversations
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = conversations.id
            AND cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Insert conversations: allow via RPC; allow direct insert to authenticated to let RPC run within definer
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_insert_auth'
  ) THEN
    CREATE POLICY conversations_insert_auth ON public.conversations
      FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- participants: read only if self participant or in a conversation you participate
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'participants_read_participant'
  ) THEN
    CREATE POLICY participants_read_participant ON public.conversation_participants
      FOR SELECT TO authenticated
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.conversation_participants cp2
          WHERE cp2.conversation_id = conversation_participants.conversation_id
            AND cp2.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- insert participants: only for self (RPC will insert the other as SECURITY DEFINER)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'participants_insert_self'
  ) THEN
    CREATE POLICY participants_insert_self ON public.conversation_participants
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- messages: read if participant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_read_participant'
  ) THEN
    CREATE POLICY messages_read_participant ON public.messages
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- messages: insert if participant and sender is self
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_insert_self'
  ) THEN
    CREATE POLICY messages_insert_self ON public.messages
      FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid() AND EXISTS (
          SELECT 1 FROM public.conversation_participants cp
          WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- messages: updates/deletes only by sender
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_update_sender'
  ) THEN
    CREATE POLICY messages_update_sender ON public.messages
      FOR UPDATE TO authenticated
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_delete_sender'
  ) THEN
    CREATE POLICY messages_delete_sender ON public.messages
      FOR DELETE TO authenticated
      USING (sender_id = auth.uid());
  END IF;
END $$;

-- Helper RPC: create_or_get_conversation(other_user_id)
CREATE OR REPLACE FUNCTION public.create_or_get_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  my_id uuid := auth.uid();
  conv_id uuid;
BEGIN
  IF other_user_id IS NULL OR my_id IS NULL OR other_user_id = my_id THEN
    RAISE EXCEPTION 'Invalid other_user_id';
  END IF;

  -- look for existing conversation that both users participate in
  SELECT c.id INTO conv_id
  FROM public.conversations c
  WHERE EXISTS (
    SELECT 1 FROM public.conversation_participants p1
    WHERE p1.conversation_id = c.id AND p1.user_id = my_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants p2
    WHERE p2.conversation_id = c.id AND p2.user_id = other_user_id
  )
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- create new conversation
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;

  -- add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, my_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, other_user_id)
  ON CONFLICT DO NOTHING;

  RETURN conv_id;
END;
$$;

-- allow execution to authenticated users
DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.create_or_get_conversation(uuid) TO authenticated;
EXCEPTION WHEN others THEN
  -- ignore
  NULL;
END $$;
