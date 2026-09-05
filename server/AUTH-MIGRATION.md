# Autenticación propia

`AUTH_MODE=supabase` conserva la autenticación actual: `/v1/auth/login` delega
en Supabase Auth y el plugin valida los bearer tokens con `auth.getUser()`.

`AUTH_MODE=local` usa `public.app_users` y `public.app_sessions` mediante el
cliente Supabase service-role exclusivamente como Data API. `JWT_SECRET` debe
ser un secreto aleatorio de al menos 32 caracteres. Los JWT incluyen un `jti`
que se persiste hasheado en `app_sessions`, por lo que logout revoca la sesión.

Endpoints locales:

- `POST /v1/auth/login` con `{ email, password }` devuelve `access_token`.
- `GET /v1/auth/session` y `POST /v1/auth/logout` requieren `Authorization: Bearer`.
- `POST /v1/auth/request-password-reset` crea un reset de un solo uso. La entrega
  por correo queda pendiente; sólo en desarrollo/test se devuelve `reset_token`.
- `POST /v1/auth/password-reset` con `{ token, password }` actualiza el hash con bcrypt.
- `GET /v1/auth/google` devuelve `501`: es el contrato reservado para Google OAuth.

La migración no borra ni modifica `auth.users`. Los UUID existentes se copian a
`app_users` y quedan con `password_reset_required=true`, porque los hashes de
Supabase Auth no son reutilizables por el modo local.
