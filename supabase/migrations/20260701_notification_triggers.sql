BEGIN;

-- 1. Ensure create_notification exists
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient uuid,
  p_actor uuid,
  p_type text,
  p_entity_type text,
  p_entity_id text,
  p_data jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    data
  ) VALUES (
    p_recipient,
    p_actor,
    p_type,
    p_entity_type,
    p_entity_id,
    p_data
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, uuid, text, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, text, text, text, jsonb) TO service_role;

-- 2. Follows Trigger

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
        coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.followed_id), ''), '@', 1)),
        username,
        avatar_url
      INTO v_display, v_username, v_avatar
      FROM public.profiles
      WHERE user_id = NEW.followed_id;
      
      v_notif_data := jsonb_build_object(
        'follower_id', NEW.followed_id,
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

DROP TRIGGER IF EXISTS follows_notification_trigger ON public.follows;
CREATE TRIGGER follows_notification_trigger
  AFTER INSERT OR UPDATE OF status ON public.follows
  FOR EACH ROW EXECUTE PROCEDURE public.handle_follows_notifications();


-- 3. Messages Trigger

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
      coalesce(nullif(nombre_completo, ''), username, split_part(coalesce((select email from auth.users where id = NEW.sender_id), ''), '@', 1)),
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

DROP TRIGGER IF EXISTS messages_notification_trigger ON public.messages;
CREATE TRIGGER messages_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_messages_notifications();


-- 4. Rama Broadcast Trigger

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
        'message',
        'rama_broadcast',
        NEW.id::text,
        v_notif_data
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rama_broadcast_notification_trigger ON public.rama_broadcast_messages;
CREATE TRIGGER rama_broadcast_notification_trigger
  AFTER INSERT ON public.rama_broadcast_messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_rama_broadcast_notifications();

COMMIT;
