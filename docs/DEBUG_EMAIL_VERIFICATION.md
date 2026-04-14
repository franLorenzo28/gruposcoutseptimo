# Debug - Verificacion de Email (Manual)

Esta guia corresponde al flujo actual del proyecto:

- La verificacion es manual por boton.
- No depende de activar la confirmacion automatica de Supabase Auth.
- En desarrollo podes probar con mails no reales usando fallback con link.

## Flujo actual

1. El usuario inicia sesion normalmente.
2. El usuario presiona el boton de verificacion (en pantallas protegidas o en Configuracion > Seguridad).
3. Se genera un token con RPC `resend_verification_email`.
4. El usuario abre `/verificar-email?token=...`.
5. RPC `verify_email_token` marca `profiles.email_verified = true`.
6. Se desbloquean features especiales (Comuni 7, Mensajes, Galeria).

## Paso 1: Aplicar migracion SQL

Archivo vigente:

`supabase/migrations/20260602_manual_email_verification_refresh.sql`

Como aplicarla en Dashboard:

1. Ir a SQL Editor.
2. New Query.
3. Pegar todo el contenido del archivo.
4. Ejecutar RUN.

## Paso 2: Validar que quedo aplicado

Ejecuta estas consultas en SQL Editor:

```sql
-- Columna de desbloqueo de features
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'email_verified';

-- Tabla de tokens
select to_regclass('public.email_verification_tokens');

-- RPCs requeridas por frontend/edge
select proname
from pg_proc
where proname in (
  'generate_verification_token',
  'resend_verification_email',
  'verify_email_token',
  'is_email_verified',
  'cleanup_expired_tokens'
)
order by proname;
```

## Paso 3: Probar sin emails reales (recomendado en desarrollo)

No necesitas Resend ni SMTP real para este test.

1. Iniciar app con backend Supabase.
2. Ir a una feature protegida o a Configuracion > Seguridad.
3. Presionar Reenviar correo / Generar enlace.
4. Revisar consola del navegador (F12).
5. Abrir el link `/verificar-email?token=...`.

Logs esperados en fallback:

```text
Generando token de verificacion para: ...
Token generado: { token: "...", expires_at: "...", user_email: "..." }
Link de verificacion (desarrollo):
http://localhost:5173/verificar-email?token=...
```

## Paso 4: Produccion con email real (opcional)

Solo si queres envio real:

1. Desplegar Edge Function:

```bash
supabase functions deploy send-verification-email
```

2. Configurar secrets en Supabase:

- `RESEND_API_KEY`
- `APP_URL`
- `FROM_EMAIL`

3. En frontend, habilitar uso de Edge Function:

```env
VITE_ENABLE_EDGE_EMAIL=true
```

Sin eso, el frontend sigue usando fallback (token + link local).

## Errores comunes

### `function resend_verification_email() does not exist`

No se aplico la migracion actual.

### `column email_verified does not exist`

No se aplico la migracion actual.

### `relation email_verification_tokens does not exist`

No se aplico la migracion actual.

### Error CORS en `send-verification-email`

Verificar:

1. Funcion desplegada.
2. Secrets cargadas.
3. `VITE_ENABLE_EDGE_EMAIL=true` solo cuando realmente queres forzar Edge Function.

## Testing manual SQL

```sql
-- Generar token para usuario especifico
select * from generate_verification_token('TU_USER_ID');

-- Verificar token
select * from verify_email_token('TOKEN');

-- Ver tokens activos
select *
from email_verification_tokens
where verified_at is null
order by created_at desc;

-- Marcar verificado manualmente (solo pruebas)
update profiles
set email_verified = true
where user_id = 'TU_USER_ID';
```

## Checklist rapido

- [ ] Migracion `20260602_manual_email_verification_refresh.sql` aplicada.
- [ ] Existe `profiles.email_verified`.
- [ ] Existe `email_verification_tokens`.
- [ ] Existen RPCs `resend_verification_email` y `verify_email_token`.
- [ ] Boton de verificacion genera token.
- [ ] Link de verificacion funciona.
- [ ] Features protegidas se desbloquean tras verificar.

## Nota importante

Este sistema esta pensado para pruebas y control manual. No requiere activar confirmacion automatica de email en Supabase Auth.
