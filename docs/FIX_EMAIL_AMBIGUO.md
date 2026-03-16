# 🔧 Fix Urgente - Error "columna email ambigua"

## ❌ Problema
Al hacer click en "Generar / Reenviar link" aparece:
```
Error generando token: column reference "email" is ambiguous
```

## ✅ Solución (ejecutar AHORA en Supabase)

1. Ve a: https://supabase.com/dashboard/project/lndqeaspuwwgdwbggayd/sql
2. Click en "New Query"
3. Copia y pega este código (PASO 1 - Eliminar función anterior):

```sql
-- PASO 1: Eliminar la función anterior
DROP FUNCTION IF EXISTS resend_verification_email();
```

4. Click en **RUN** ✅

5. Luego ejecutá esto (PASO 2 - Crear función corregida):

```sql
-- PASO 2: Crear función corregida
CREATE OR REPLACE FUNCTION resend_verification_email()
RETURNS TABLE(token TEXT, expires_at TIMESTAMPTZ, user_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  -- Obtener usuario actual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  
  -- Obtener email del usuario (usar alias para evitar ambigüedad)
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_user_id;
  
  -- Generar nuevo token
  SELECT t.token, t.expires_at INTO v_token, v_expires
  FROM generate_verification_token(v_user_id) t;
  
  -- Usar alias diferente para evitar conflicto con columna 'email'
  RETURN QUERY SELECT v_token, v_expires, v_email;
END;
$$;
```

6. Click en **RUN** nuevamente ✅

## 🔧 FIX ADICIONAL - Error al verificar token

Si al hacer click en el link de verificación aparece "column reference 'user_id' is ambiguous", ejecutá también esto:

```sql
-- FIX: Función verify_email_token corregida
DROP FUNCTION IF EXISTS verify_email_token(TEXT);

CREATE OR REPLACE FUNCTION verify_email_token(p_token TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, verified_user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- Buscar token
  SELECT * INTO v_token_record
  FROM email_verification_tokens
  WHERE token = p_token;
  
  -- Token no existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Token inválido'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Token ya fue usado
  IF v_token_record.verified_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Token ya fue usado'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Token expirado
  IF v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, 'Token expirado'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Marcar token como verificado
  UPDATE email_verification_tokens
  SET verified_at = NOW()
  WHERE token = p_token;
  
  -- Marcar perfil como verificado
  UPDATE profiles
  SET email_verified = TRUE
  WHERE profiles.user_id = v_token_record.user_id;
  
  RETURN QUERY SELECT TRUE, 'Email verificado correctamente'::TEXT, v_token_record.user_id;
END;
$$;
```

Click en **RUN** ✅

## 🎯 Qué hace este fix
- Cambia el nombre de la columna de retorno de `email` a `user_email` para evitar conflictos
- Añade alias `u.` en el SELECT para ser más explícito
- El código frontend ya está actualizado para usar esto correctamente

## ✅ Cómo verificar que funcionó
Después de ejecutar el SQL:
1. Refrescá la página de Comuni 7
2. Click en "Generar / Reenviar link"
3. Deberías ver en la consola:
   ```
   📧 Generando token de verificación para: tu@email.com
   ✅ Token generado: {token: "...", expires_at: "...", user_email: "..."}
   🔗 Link de verificación (desarrollo):
   http://localhost:5173/verificar-email?token=...
   ✅ Link copiado al portapapeles!
   ```

4. El link debería estar copiado en tu portapapeles - pegalo en el navegador

## 🚀 Una vez que funcione
El sistema quedará:
- ✅ Generando tokens correctamente
- ✅ Copiando link al portapapeles automáticamente
- ✅ Mostrando link en consola para desarrollo
- ✅ Listo para verificar emails y desbloquear Comuni 7, Mensajes y Galería
