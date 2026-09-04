-- Grupo Scout Séptimo - Corregir sistema de mensajes directos
-- Este script asegura que las tablas, políticas y funciones RPC existan y funcionen correctamente

-- 1. Asegurar que las tablas existen
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS conversation_participants_user_idx ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);

-- 2. Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes (limpiar)
DROP POLICY IF EXISTS conversations_read_participant ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_auth ON public.conversations;
DROP POLICY IF EXISTS participants_read_participant ON public.conversation_participants;
DROP POLICY IF EXISTS participants_read_self ON public.conversation_participants;
DROP POLICY IF EXISTS participants_insert_self ON public.conversation_participants;
DROP POLICY IF EXISTS messages_read_participant ON public.messages;
DROP POLICY IF EXISTS messages_insert_self ON public.messages;
DROP POLICY IF EXISTS messages_insert_participant ON public.messages;
DROP POLICY IF EXISTS messages_update_sender ON public.messages;
DROP POLICY IF EXISTS messages_delete_sender ON public.messages;

-- 4. Crear políticas RLS simples y sin recursión

-- Conversations: leer si eres participante
CREATE POLICY conversations_read_participant ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

-- Conversations: insertar (usado por RPC)
CREATE POLICY conversations_insert_auth ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation participants: leer tus participaciones
CREATE POLICY participants_read_self ON public.conversation_participants
  FOR SELECT USING (user_id = auth.uid());

-- Conversation participants: insertar tu propia participación
CREATE POLICY participants_insert_self ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Messages: leer si eres participante de la conversación
CREATE POLICY messages_read_participant ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Messages: insertar si eres participante Y eres el sender
CREATE POLICY messages_insert_participant ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- Messages: actualizar/eliminar solo el sender
CREATE POLICY messages_update_sender ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY messages_delete_sender ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- 5. Recrear la función RPC create_or_get_conversation
CREATE OR REPLACE FUNCTION public.create_or_get_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_id uuid := auth.uid();
  conv_id uuid;
BEGIN
  IF other_user_id IS NULL OR my_id IS NULL OR other_user_id = my_id THEN
    RAISE EXCEPTION 'Invalid other_user_id';
  END IF;

  -- Buscar conversación existente
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

  -- Crear nueva conversación
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;

  -- Agregar participantes
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, my_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, other_user_id)
  ON CONFLICT DO NOTHING;

  RETURN conv_id;
END;
$$;

-- 6. Otorgar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation(uuid) TO authenticated;
GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- 7. Asegurar que los admins pueden ver todo (para el panel admin)
DO $$ BEGIN
  DROP POLICY IF EXISTS admin_all_conversations ON public.conversations;
  CREATE POLICY admin_all_conversations ON public.conversations
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );

  DROP POLICY IF EXISTS admin_all_participants ON public.conversation_participants;
  CREATE POLICY admin_all_participants ON public.conversation_participants
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );

  DROP POLICY IF EXISTS admin_all_messages ON public.messages;
  CREATE POLICY admin_all_messages ON public.messages
    FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );
END $$;
