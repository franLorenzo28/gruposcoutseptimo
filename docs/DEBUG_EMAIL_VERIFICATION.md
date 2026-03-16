# 🐛 Debugging - Verificación de Email

## Paso 1: Aplicar la migración SQL ⚠️ IMPORTANTE

**PRIMERO debes aplicar la migración antes de que funcione:**

1. Ve a: https://supabase.com/dashboard/project/lndqeaspuwwgdwbggayd
2. Click en "SQL Editor" en el menú lateral
3. Click en "New Query"
4. Copia y pega TODO el contenido de:
   `supabase/migrations/20251111_email_verification_system.sql`
5. Click en "RUN" ✅

## Paso 2: Verificar que se aplicó correctamente

Ejecutá esto en SQL Editor:

```sql
-- Debe mostrar el campo email_verified
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Debe mostrar la tabla
SELECT * FROM email_verification_tokens LIMIT 1;
```

## Paso 3: Probar en Desarrollo (Sin enviar emails)

1. Abrí la consola del navegador (F12)
2. Intentá acceder a Comuni 7, Mensajes o Galería
3. Click en "Enviar email de verificación"
4. **Mirá la consola** - va a aparecer el link de verificación
5. El link se copia automáticamente al portapapeles
6. Pegá el link en la barra de direcciones
7. ¡Listo! Email verificado

## 🔍 Ver qué pasa cuando clickeás "Enviar email"

Abrí la consola (F12) y vas a ver:

```
📧 Generando token de verificación para: tu@email.com
✅ Token generado: { token: "abc123...", email: "tu@email.com" }
🔗 Link de verificación (desarrollo):
http://localhost:5173/verificar-email?token=abc123...

📋 Copia este link y ábrelo en tu navegador para verificar tu email
✅ Link copiado al portapapeles!
```

## ❌ Si ves errores

### Error: "function resend_verification_email() does not exist"
→ No aplicaste la migración SQL. Ve al Paso 1.

### Error: "column email_verified does not exist"
→ No aplicaste la migración SQL. Ve al Paso 1.

### Error: "relation email_verification_tokens does not exist"
→ No aplicaste la migración SQL. Ve al Paso 1.


### Error CORS / preflight bloqueado
Si ves en la consola mensajes como:
```
Access to fetch at 'https://<project>.supabase.co/functions/v1/send-verification-email' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check.
```
Razones y soluciones:
1. La Edge Function no está desplegada todavía → despliega con:
    ```bash
    supabase functions deploy send-verification-email
    ```
2. Falta alguna cabecera CORS → ya añadimos: `Access-Control-Allow-Origin`, `Allow-Headers`, `Allow-Methods`, `Max-Age`.
3. Estás usando la función antes de configurar secrets → agrega `RESEND_API_KEY` o deja que el sistema use el fallback.

Mientras tanto el sistema hace fallback automático: genera el token y muestra/copía el link en la consola.

### ¿Quiero forzar uso de email real y ver error si falla?
Agrega en tu `.env` del frontend:
```
VITE_ENABLE_EDGE_EMAIL=true
```
Eso intentará llamar siempre la Edge Function; si falla verás el warning y podrás revisar logs:
```bash
supabase functions logs send-verification-email
```
## ✅ Modo Producción (con emails reales)

Una vez que la migración funcione, para enviar emails reales:

1. Registrate en Resend: https://resend.com/
2. Verificá tu dominio
3. Obtené tu API Key
4. Desplegá la Edge Function:
   ```bash
   supabase functions deploy send-verification-email
   ```
5. Configurá secrets en Supabase:
   - `RESEND_API_KEY`: tu_api_key
   - `APP_URL`: https://tu-dominio.com
   - `FROM_EMAIL`: Grupo Scout <noreply@tudominio.com>

## 🧪 Testing Manual

### Generar token manualmente:
```sql
-- Reemplaza TU_USER_ID con tu user_id de auth.users
SELECT * FROM generate_verification_token('TU_USER_ID');
```

### Verificar token manualmente:
```sql
-- Reemplaza EL_TOKEN con el token que generaste
SELECT * FROM verify_email_token('EL_TOKEN');
```

### Ver tokens activos:
```sql
SELECT * FROM email_verification_tokens 
WHERE verified_at IS NULL 
ORDER BY created_at DESC;
```

### Marcar como verificado manualmente (para testing):
```sql
-- Reemplaza TU_USER_ID
UPDATE profiles 
SET email_verified = TRUE 
WHERE user_id = 'TU_USER_ID';
```

## 📝 Checklist

- [ ] Aplicaste la migración SQL en Supabase
- [ ] Verificaste que la tabla `email_verification_tokens` existe
- [ ] Verificaste que `profiles.email_verified` existe
- [ ] Abriste la consola del navegador (F12)
- [ ] Intentaste enviar email de verificación
- [ ] Copiaste el link de la consola
- [ ] Verificaste el email usando el link

## 💡 Tips

- En desarrollo, NO necesitás configurar Resend
- El link se muestra en la consola y se copia al portapapeles
- Si no ves el link en consola, revisá que aplicaste la migración
- Los tokens expiran en 24 horas
- Podés reenviar emails cuantas veces quieras
