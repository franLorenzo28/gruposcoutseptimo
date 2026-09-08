-- Follow notifications must use type 'message' (kind travels in data).
-- The live notifications_type_check constraint rejects 'follow_request' /
-- 'follow_accepted' as type, which rolled back follows INSERTs with
-- status='accepted' (public profiles) and pending->accepted UPDATEs.
-- kinds are preserved in data so clients keep rendering accept/reject actions.

BEGIN;

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
        'message',
        'follow',
        NEW.follower_id || ':' || NEW.followed_id,
        v_notif_data
      );
    ELSIF NEW.status = 'accepted' THEN
      PERFORM public.create_notification(
        NEW.followed_id,
        NEW.follower_id,
        'message',
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
        'message',
        'follow',
        NEW.follower_id || ':' || NEW.followed_id,
        v_notif_data
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
