BEGIN;

-- ============================================================================
-- FIX 1: Rama broadcast trigger — usar type='rama_broadcast' directamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_rama_broadcast_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display text;
  v_username text;
  v_avatar text;
  v_notif_data jsonb;
  v_recipients uuid[];
  r uuid;
BEGIN
  SELECT 
    coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.author_id), ''), '@', 1)),
    username,
    avatar_url
  INTO v_display, v_username, v_avatar
  FROM public.profiles
  WHERE user_id = NEW.author_id;

  v_notif_data := jsonb_build_object(
    'broadcast_id', NEW.id,
    'rama', NEW.rama,
    'content', NEW.content,
    'display', v_display,
    'username', v_username,
    'avatar_url', v_avatar,
    'kind', 'rama_broadcast'
  );

  -- Recipients: users whose rama matches (via raw_user_meta_data or profile rama_que_educa)
  SELECT array_agg(id) INTO v_recipients
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id != NEW.author_id
    AND (
      u.raw_user_meta_data->>'rama' = NEW.rama
      OR p.rama_que_educa LIKE '%' || NEW.rama || '%'
    );

  IF v_recipients IS NOT NULL THEN
    FOREACH r IN ARRAY v_recipients
    LOOP
      PERFORM public.create_notification(
        r,
        NEW.author_id,
        'rama_broadcast',
        'rama_broadcast',
        NEW.id::text,
        v_notif_data
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================================
-- FIX 2: Follow UPDATE trigger — corregir datos de quién aceptó
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_follows_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display text;
  v_username text;
  v_avatar text;
  v_notif_data jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get actor (follower) profile info
    SELECT 
      coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.follower_id), ''), '@', 1)),
      username,
      avatar_url
    INTO v_display, v_username, v_avatar
    FROM public.profiles
    WHERE user_id = NEW.follower_id;
    
    v_notif_data := jsonb_build_object(
      'follower_id', NEW.follower_id,
      'display', v_display,
      'username', v_username,
      'avatar_url', v_avatar,
      'kind', CASE WHEN NEW.status = 'accepted' THEN 'follow_accepted' ELSE 'follow_request' END
    );

    IF NEW.status = 'pending' THEN
      -- Notificar al seguido que alguien quiere seguirlo
      PERFORM public.create_notification(
        NEW.followed_id,
        NEW.follower_id,
        'follow_request',
        'follow',
        NEW.follower_id || ':' || NEW.followed_id,
        v_notif_data
      );
    ELSIF NEW.status = 'accepted' THEN
      -- Perfil público: notificar al seguido que ahora tiene un nuevo follower
      PERFORM public.create_notification(
        NEW.followed_id,
        NEW.follower_id,
        'follow_accepted',
        'follow',
        NEW.follower_id || ':' || NEW.followed_id,
        v_notif_data
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
      -- Quien aceptó (followed_id) notifica al follower original
      SELECT 
        coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.followed_id), ''), '@', 1)),
        username,
        avatar_url
      INTO v_display, v_username, v_avatar
      FROM public.profiles
      WHERE user_id = NEW.followed_id;
      
      v_notif_data := jsonb_build_object(
        'follower_id', NEW.follower_id,
        'followed_id', NEW.followed_id,
        'display', v_display,
        'username', v_username,
        'avatar_url', v_avatar,
        'kind', 'follow_accepted'
      );

      -- Notificar al follower original que su solicitud fue aceptada
      PERFORM public.create_notification(
        NEW.follower_id,
        NEW.followed_id,
        'follow_accepted',
        'follow',
        NEW.follower_id || ':' || NEW.followed_id,
        v_notif_data
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================================
-- NEW: Tabla gallery_upload_events + trigger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gallery_upload_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  album_name text NOT NULL,
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_upload_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gallery_upload_events_insert ON public.gallery_upload_events;
CREATE POLICY gallery_upload_events_insert
  ON public.gallery_upload_events FOR INSERT
  TO authenticated
  WITH CHECK (uploader_id = auth.uid());

DROP POLICY IF EXISTS gallery_upload_events_select ON public.gallery_upload_events;
CREATE POLICY gallery_upload_events_select
  ON public.gallery_upload_events FOR SELECT
  TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS gallery_upload_notification_trigger ON public.gallery_upload_events;

CREATE OR REPLACE FUNCTION public.handle_gallery_upload_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display text;
  v_username text;
  v_avatar text;
  v_notif_data jsonb;
  v_recipients uuid[];
  r uuid;
BEGIN
  -- Get uploader profile
  SELECT 
    coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.uploader_id), ''), '@', 1)),
    username,
    avatar_url
  INTO v_display, v_username, v_avatar
  FROM public.profiles
  WHERE user_id = NEW.uploader_id;

  v_notif_data := jsonb_build_object(
    'album', NEW.album_name,
    'image_path', NEW.image_path,
    'uploader_id', NEW.uploader_id,
    'display', v_display,
    'username', v_username,
    'avatar_url', v_avatar,
    'kind', 'gallery_upload'
  );

  -- Notify all authenticated users except the uploader
  SELECT array_agg(id) INTO v_recipients
  FROM auth.users u
  WHERE u.id != NEW.uploader_id;

  IF v_recipients IS NOT NULL THEN
    FOREACH r IN ARRAY v_recipients
    LOOP
      PERFORM public.create_notification(
        r,
        NEW.uploader_id,
        'gallery_upload',
        'gallery',
        NEW.id::text,
        v_notif_data
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER gallery_upload_notification_trigger
  AFTER INSERT ON public.gallery_upload_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_gallery_upload_notifications();


-- ============================================================================
-- NEW: Tabla media_upload_events + trigger (threads, narratives, group covers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.media_upload_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  media_type text NOT NULL CHECK (media_type IN ('thread_image', 'narrativa', 'group_cover', 'avatar')),
  entity_id text,
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_upload_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_upload_events_insert ON public.media_upload_events;
CREATE POLICY media_upload_events_insert
  ON public.media_upload_events FOR INSERT
  TO authenticated
  WITH CHECK (uploader_id = auth.uid());

DROP POLICY IF EXISTS media_upload_events_select ON public.media_upload_events;
CREATE POLICY media_upload_events_select
  ON public.media_upload_events FOR SELECT
  TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS media_upload_notification_trigger ON public.media_upload_events;

CREATE OR REPLACE FUNCTION public.handle_media_upload_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display text;
  v_username text;
  v_avatar text;
  v_notif_data jsonb;
  v_recipients uuid[];
  r uuid;
BEGIN
  SELECT 
    coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.uploader_id), ''), '@', 1)),
    username,
    avatar_url
  INTO v_display, v_username, v_avatar
  FROM public.profiles
  WHERE user_id = NEW.uploader_id;

  v_notif_data := jsonb_build_object(
    'media_type', NEW.media_type,
    'entity_id', NEW.entity_id,
    'image_path', NEW.image_path,
    'uploader_id', NEW.uploader_id,
    'display', v_display,
    'username', v_username,
    'avatar_url', v_avatar,
    'kind', 'gallery_upload'
  );

  -- Notificar a todos excepto al uploader
  SELECT array_agg(id) INTO v_recipients
  FROM auth.users u
  WHERE u.id != NEW.uploader_id;

  IF v_recipients IS NOT NULL THEN
    FOREACH r IN ARRAY v_recipients
    LOOP
      PERFORM public.create_notification(
        r,
        NEW.uploader_id,
        'gallery_upload',
        'media_upload',
        NEW.id::text,
        v_notif_data
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER media_upload_notification_trigger
  AFTER INSERT ON public.media_upload_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_media_upload_notifications();


-- ============================================================================
-- NEW: Agregar nuevas tablas a supabase_realtime publication
-- ============================================================================

DO $$
BEGIN
  -- Agregar gallery_upload_events a realtime si no está ya
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_upload_events;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.media_upload_events;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;


-- ============================================================================
-- NEW: RPC get_admin_pending_counts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_pending_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role text := '';
  v_actor_email text := '';
  v_pending_registrations integer := 0;
  v_pending_educators integer := 0;
  v_pending_follows integer := 0;
BEGIN
  IF v_actor_id IS NULL THEN
    RETURN jsonb_build_object(
      'pending_registrations', 0,
      'pending_educators', 0,
      'pending_follows', 0
    );
  END IF;

  SELECT
    lower(coalesce(p.role, '')),
    lower(coalesce(p.email, u.email, ''))
  INTO v_actor_role, v_actor_email
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = v_actor_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'pending_registrations', 0,
      'pending_educators', 0,
      'pending_follows', 0
    );
  END IF;

  IF v_actor_role NOT IN ('admin', 'mod')
     AND v_actor_email NOT LIKE '%@admin%'
     AND v_actor_email NOT LIKE '%grupo-scout%'
     AND v_actor_email <> 'franciscolorenzo2406@gmail.com'
  THEN
    RETURN jsonb_build_object(
      'pending_registrations', 0,
      'pending_educators', 0,
      'pending_follows', 0
    );
  END IF;

  SELECT count(*)::integer INTO v_pending_registrations
  FROM public.profiles
  WHERE account_status IN ('pendiente_email', 'pendiente_aprobacion');

  SELECT count(*)::integer INTO v_pending_educators
  FROM public.notifications
  WHERE read_at IS NULL
    AND lower(coalesce(data::jsonb ->> 'kind', '')) = 'educator_permission_request'
    AND lower(coalesce(data::jsonb ->> 'status', '')) = 'pending';

  SELECT count(*)::integer INTO v_pending_follows
  FROM public.follows
  WHERE status = 'pending';

  RETURN jsonb_build_object(
    'pending_registrations', v_pending_registrations,
    'pending_educators', v_pending_educators,
    'pending_follows', v_pending_follows
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_pending_counts() FROM public;
GRANT EXECUTE ON FUNCTION public.get_admin_pending_counts() TO authenticated;


-- ============================================================================
-- Re-create all triggers to ensure they use the updated functions
-- ============================================================================

DROP TRIGGER IF EXISTS follows_notification_trigger ON public.follows;
CREATE TRIGGER follows_notification_trigger
  AFTER INSERT OR UPDATE OF status ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_follows_notifications();

DROP TRIGGER IF EXISTS rama_broadcast_notification_trigger ON public.rama_broadcast_messages;
CREATE TRIGGER rama_broadcast_notification_trigger
  AFTER INSERT ON public.rama_broadcast_messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_rama_broadcast_notifications();

COMMIT;
