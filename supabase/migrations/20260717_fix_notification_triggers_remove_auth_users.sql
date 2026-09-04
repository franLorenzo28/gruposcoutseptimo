BEGIN;

-- ============================================================================
-- Fix notification triggers: replace auth.users email lookups with profiles
-- This eliminates "permission denied for table users" errors in triggers.
-- ============================================================================

-- 1. handle_follows_notifications — replace auth.users email fallback with profiles.email
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
    SELECT
      coalesce(
        nullif(nombre_completo, ''),
        username,
        split_part(coalesce(email, ''), '@', 1),
        'Scout'
      ),
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
      PERFORM public.create_notification(
        NEW.followed_id,
        NEW.follower_id,
        'follow_request',
        'follow',
        NEW.follower_id || ':' || NEW.followed_id,
        v_notif_data
      );
    ELSIF NEW.status = 'accepted' THEN
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
      SELECT
        coalesce(
          nullif(nombre_completo, ''),
          username,
          split_part(coalesce(email, ''), '@', 1),
          'Scout'
        ),
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


-- 2. handle_messages_notifications — replace auth.users email fallback with profiles.email
CREATE OR REPLACE FUNCTION public.handle_messages_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id uuid;
  v_display text;
  v_username text;
  v_avatar text;
  v_notif_data jsonb;
BEGIN
  SELECT user_id INTO v_recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    SELECT
      coalesce(
        nullif(nombre_completo, ''),
        username,
        split_part(coalesce(email, ''), '@', 1),
        'Scout'
      ),
      username,
      avatar_url
    INTO v_display, v_username, v_avatar
    FROM public.profiles
    WHERE user_id = NEW.sender_id;

    v_notif_data := jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'content', NEW.content,
      'display', v_display,
      'username', v_username,
      'avatar_url', v_avatar,
      'kind', 'message'
    );

    PERFORM public.create_notification(
      v_recipient_id,
      NEW.sender_id,
      'message',
      'message',
      NEW.id::text,
      v_notif_data
    );
  END IF;

  RETURN NEW;
END;
$$;


-- 3. handle_rama_broadcast_notifications — replace auth.users email fallback with profiles.email
--    Note: keep auth.users for raw_user_meta_data->>'rama' check (not available in profiles)
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
    coalesce(
      nullif(nombre_completo, ''),
      username,
      split_part(coalesce(email, ''), '@', 1),
      'Scout'
    ),
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

  SELECT array_agg(u.id) INTO v_recipients
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


-- 4. handle_gallery_upload_notifications — replace auth.users email fallback with profiles.email
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
  SELECT
    coalesce(
      nullif(nombre_completo, ''),
      username,
      split_part(coalesce(email, ''), '@', 1),
      'Scout'
    ),
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


-- 5. handle_media_upload_notifications — replace auth.users email fallback with profiles.email
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
    coalesce(
      nullif(nombre_completo, ''),
      username,
      split_part(coalesce(email, ''), '@', 1),
      'Scout'
    ),
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


-- 6. Recreate all triggers to ensure they use the updated functions
DROP TRIGGER IF EXISTS follows_notification_trigger ON public.follows;
CREATE TRIGGER follows_notification_trigger
  AFTER INSERT OR UPDATE OF status ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_follows_notifications();

DROP TRIGGER IF EXISTS messages_notification_trigger ON public.messages;
CREATE TRIGGER messages_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_messages_notifications();

DROP TRIGGER IF EXISTS rama_broadcast_notification_trigger ON public.rama_broadcast_messages;
CREATE TRIGGER rama_broadcast_notification_trigger
  AFTER INSERT ON public.rama_broadcast_messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_rama_broadcast_notifications();

DROP TRIGGER IF EXISTS gallery_upload_notification_trigger ON public.gallery_upload_events;
CREATE TRIGGER gallery_upload_notification_trigger
  AFTER INSERT ON public.gallery_upload_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_gallery_upload_notifications();

DROP TRIGGER IF EXISTS media_upload_notification_trigger ON public.media_upload_events;
CREATE TRIGGER media_upload_notification_trigger
  AFTER INSERT ON public.media_upload_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_media_upload_notifications();

COMMIT;
