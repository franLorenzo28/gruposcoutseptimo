-- Crear enum para roles de grupo
CREATE TYPE group_role AS ENUM ('owner', 'admin', 'member');

-- Tabla de grupos
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de miembros de grupos
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Tabla de mensajes de grupos
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);

-- Trigger para actualizar updated_at en groups
CREATE OR REPLACE FUNCTION update_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_groups_updated_at();

-- Storage bucket para imágenes de portada de grupos
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-covers', 'group-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para group-covers
CREATE POLICY "Cualquiera puede ver portadas de grupos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'group-covers');

CREATE POLICY "Usuarios autenticados pueden subir portadas"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'group-covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins y owner pueden actualizar portadas"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'group-covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins y owner pueden eliminar portadas"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'group-covers' 
    AND auth.role() = 'authenticated'
  );

-- RLS Policies para groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver grupos
CREATE POLICY "groups_select_all"
  ON groups FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden crear grupos
CREATE POLICY "groups_insert_authenticated"
  ON groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo admins y owner pueden actualizar el grupo
CREATE POLICY "groups_update_admin_owner"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('owner', 'admin')
    )
  );

-- Solo el owner puede eliminar el grupo
CREATE POLICY "groups_delete_owner"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'owner'
    )
  );

-- RLS Policies para group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver miembros de grupos
CREATE POLICY "group_members_select_all"
  ON group_members FOR SELECT
  USING (true);

-- Solo admins y owner pueden agregar miembros
CREATE POLICY "group_members_insert_admin_owner"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
  );

-- Los usuarios pueden unirse ellos mismos a un grupo; solo pueden ponerse como 'owner' si son creadores del grupo
CREATE POLICY "group_members_insert_self_join"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      role != 'owner'
      OR EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = group_members.group_id
          AND g.creator_id = auth.uid()
      )
    )
  );

-- Admins pueden actualizar roles (pero no pueden cambiar el owner)
CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
    -- No se puede cambiar el role del owner (fila objetivo actual)
    AND group_members.role != 'owner'
  )
  WITH CHECK (
    -- Asegura que el nuevo valor no sea 'owner'
    role IN ('admin', 'member')
  );

-- Admins pueden expulsar miembros (excepto al owner)
CREATE POLICY "group_members_delete_admin"
  ON group_members FOR DELETE
  USING (
    -- Es admin del grupo
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
    )
    -- No se puede expulsar al owner
    AND group_members.role != 'owner'
  );

-- Los miembros pueden salirse del grupo (excepto el owner)
CREATE POLICY "group_members_delete_self"
  ON group_members FOR DELETE
  USING (
    group_members.user_id = auth.uid()
    AND group_members.role != 'owner'
  );

-- RLS Policies para group_messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Solo miembros del grupo pueden ver mensajes
CREATE POLICY "group_messages_select_members"
  ON group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Solo miembros del grupo pueden enviar mensajes
CREATE POLICY "group_messages_insert_members"
  ON group_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
        AND group_members.user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Solo el autor puede eliminar su mensaje, o admins/owner del grupo
CREATE POLICY "group_messages_delete_author_or_admin"
  ON group_messages FOR DELETE
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role IN ('owner', 'admin')
    )
  );
