BEGIN;

-- FIX: Ambiguous "id" column reference in handle_rama_broadcast_notifications
-- The query for recipients selects "id" into v_recipients but there's a join.
-- Even though we do `SELECT array_agg(id)`, it's ambiguous because profiles also has `id`.
-- We must explicitly select `u.id` or `p.id`.

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
  -- FIX: Changed array_agg(id) to array_agg(u.id)
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

COMMIT;