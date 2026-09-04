-- Grupo Scout Séptimo - Corregir tipo de columna entity_id en notifications
-- El error indica que entity_id es uuid pero se intenta insertar text

-- Cambiar el tipo de entity_id de uuid a text para soportar diferentes tipos de IDs
ALTER TABLE IF EXISTS public.notifications 
  ALTER COLUMN entity_id TYPE text USING entity_id::text;

-- Asegurar que la tabla notifications existe con la estructura correcta
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  entity_type text,
  entity_id text,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON public.notifications(read_at);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS notifications_select_safe ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_safe ON public.notifications;
DROP POLICY IF EXISTS notifications_update_safe ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_safe ON public.notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS notifications_read_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_actor_or_recipient ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;

-- Crear políticas RLS simples
CREATE POLICY notifications_select_safe ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY notifications_insert_safe ON public.notifications
  FOR INSERT WITH CHECK (
    actor_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY notifications_update_safe ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY notifications_delete_safe ON public.notifications
  FOR DELETE USING (recipient_id = auth.uid());

-- Permitir a los admins ver todas las notificaciones (para el panel admin)
CREATE POLICY admin_all_notifications ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
