-- RPC atómica para revisar solicitudes de permisos de educador/a
-- Objetivo: evitar doble revisión entre admin/mod y cerrar globalmente
-- todas las notificaciones hermanas de la misma solicitud.

CREATE OR REPLACE FUNCTION public.review_educator_permission_request(
  p_notification_id uuid,
  p_requester_id uuid,
  p_approve boolean,
  p_units text[],
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_actor_role text := '';
  v_actor_email text := '';
  v_reviewer_name text := 'Administracion';
  v_now timestamptz := now();

  v_request_row public.notifications%ROWTYPE;
  v_request_data jsonb := '{}'::jsonb;
  v_request_kind text := '';
  v_request_status text := 'pending';
  v_request_id text := NULL;
  v_requested_at text := NULL;

  v_units text[] := '{}'::text[];
  v_reviewed_count integer := 0;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT
    lower(coalesce(p.role, '')),
    lower(coalesce(p.email, u.email, '')),
    coalesce(
      nullif(trim(p.nombre_completo), ''),
      nullif(trim(p.username), ''),
      nullif(trim(u.email), ''),
      'Administracion'
    )
  INTO v_actor_role, v_actor_email, v_reviewer_name
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = v_actor_id;

  IF NOT FOUND THEN
    SELECT
      lower(coalesce(u.email, '')),
      coalesce(nullif(trim(u.email), ''), 'Administracion')
    INTO v_actor_email, v_reviewer_name
    FROM auth.users u
    WHERE u.id = v_actor_id;
  END IF;

  IF v_actor_role NOT IN ('admin', 'mod')
     AND v_actor_email NOT LIKE '%@admin%'
     AND v_actor_email NOT LIKE '%grupo-scout%'
      AND v_actor_email <> 'franciscolorenzo2406@gmail.com'
  THEN
    RAISE EXCEPTION 'No tienes permisos para revisar solicitudes de educador/a.';
  END IF;

  SELECT n.*
  INTO v_request_row
  FROM public.notifications n
  WHERE n.id = p_notification_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontro la solicitud a revisar.';
  END IF;

  v_request_data := coalesce(v_request_row.data::jsonb, '{}'::jsonb);
  v_request_kind := lower(coalesce(v_request_data ->> 'kind', ''));
  v_request_status := lower(coalesce(v_request_data ->> 'status', 'pending'));

  IF v_request_kind <> 'educator_permission_request' THEN
    RAISE EXCEPTION 'La notificacion no corresponde a una solicitud de permisos.';
  END IF;

  IF v_request_status <> 'pending' OR v_request_row.read_at IS NOT NULL THEN
    RAISE EXCEPTION 'Esta solicitud ya fue revisada.';
  END IF;

  IF v_request_row.actor_id <> p_requester_id THEN
    RAISE EXCEPTION 'El solicitante no coincide con la notificacion.';
  END IF;

  SELECT coalesce(array_agg(DISTINCT canon), '{}'::text[])
  INTO v_units
  FROM (
    SELECT CASE
      WHEN lower(trim(unit)) IN ('manada', 'lobatos') THEN 'manada'
      WHEN lower(trim(unit)) = 'tropa' THEN 'tropa'
      WHEN lower(trim(unit)) = 'pioneros' THEN 'pioneros'
      WHEN lower(trim(unit)) IN ('rovers', 'rover') THEN 'rovers'
      ELSE NULL
    END AS canon
    FROM unnest(coalesce(p_units, '{}'::text[])) AS unit
  ) s
  WHERE canon IS NOT NULL;

  IF p_approve AND coalesce(array_length(v_units, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Debes seleccionar al menos una unidad para aprobar.';
  END IF;

  IF p_approve THEN
    UPDATE public.profiles
    SET
      rol_adulto = 'Educador/a',
      rama_que_educa = array_to_string(v_units, ','),
      updated_at = now()
    WHERE user_id = p_requester_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No se encontro el perfil del solicitante para actualizar permisos.';
    END IF;
  END IF;

  v_request_id := nullif(v_request_data ->> 'request_id', '');
  v_requested_at := nullif(v_request_data ->> 'requested_at', '');

  -- Cierre global: marca como leidas todas las notificaciones pendientes
  -- que representen la misma solicitud para evitar dobles revisiones.
  UPDATE public.notifications n
  SET read_at = v_now
  WHERE n.read_at IS NULL
    AND lower(coalesce(n.data::jsonb ->> 'kind', '')) = 'educator_permission_request'
    AND lower(coalesce(n.data::jsonb ->> 'status', 'pending')) = 'pending'
    AND (
      (v_request_id IS NOT NULL AND n.data::jsonb ->> 'request_id' = v_request_id)
      OR (v_request_id IS NULL AND n.id = p_notification_id)
      OR (
        v_request_id IS NULL
        AND v_requested_at IS NOT NULL
        AND n.actor_id = p_requester_id
        AND n.data::jsonb ->> 'requested_at' = v_requested_at
      )
    );

  GET DIAGNOSTICS v_reviewed_count = ROW_COUNT;

  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    data
  )
  VALUES (
    p_requester_id,
    v_actor_id,
    'message',
    'educator_permission_response',
    p_requester_id,
    jsonb_build_object(
      'kind', 'educator_permission_response',
      'request_id', v_request_id,
      'approved', p_approve,
      'approved_units', CASE WHEN p_approve THEN to_jsonb(v_units) ELSE '[]'::jsonb END,
      'reviewer_name', v_reviewer_name,
      'note', nullif(trim(coalesce(p_note, '')), ''),
      'reviewed_at', v_now,
      'role_granted', CASE WHEN p_approve THEN 'educador/a' ELSE NULL END
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'reviewed_notifications', v_reviewed_count,
    'reviewed_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_educator_permission_request(uuid, uuid, boolean, text[], text) FROM public;
GRANT EXECUTE ON FUNCTION public.review_educator_permission_request(uuid, uuid, boolean, text[], text) TO authenticated;
