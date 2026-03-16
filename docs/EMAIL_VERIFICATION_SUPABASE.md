# Sistema de Verificación de Email Custom para Supabase

## ✅ Qué se implementó

1. **Tabla de tokens de verificación** (`email_verification_tokens`)
2. **Campo `email_verified`** en la tabla `profiles`
3. **Funciones RPC** para generar y verificar tokens
4. **Edge Function** para enviar emails
5. **Componente EmailVerificationGuard** actualizado para Supabase
6. **Página de verificación** (`/verificar-email`)

## 📋 Pasos para activar el sistema

### 1. Aplicar la Migración en Supabase

Ve a tu dashboard de Supabase:
https://supabase.com/dashboard/project/lndqeaspuwwgdwbggayd

**Opción A: SQL Editor (Recomendado)**
1. Ve a `SQL Editor` en el menú lateral
2. Click en "New Query"
3. Copia y pega TODO el contenido de:
   `supabase/migrations/20251111_email_verification_system.sql`
4. Click en "RUN" para ejecutar

**Opción B: Supabase CLI (Si tenés instalado)**
```bash
cd c:\Users\usuario\OneDrive\Documentos\GitHub\lovable-scout-canvas
supabase db push
```

### 2. Configurar el servicio de Email

Necesitás un servicio para enviar emails. Recomiendo **Resend** (gratis hasta 100 emails/día):

#### Opción 1: Resend (Recomendado)
1. Registrate en: https://resend.com/
2. Verifica tu dominio (o usa el dominio de prueba)
3. Obtené tu API Key
4. En Supabase Dashboard → Project Settings → Edge Functions → Secrets
5. Agregar secreto:
   - Name: `RESEND_API_KEY`
   - Value: tu_api_key_de_resend

6. Agregar también:
   - Name: `APP_URL`
   - Value: `https://tu-dominio.com` (en producción) o `http://localhost:5173` (desarrollo)
   
   - Name: `FROM_EMAIL`
   - Value: `Grupo Scout <noreply@tudominio.com>`

#### Opción 2: SendGrid, Mailgun, etc.
Modificá el archivo `supabase/functions/send-verification-email/index.ts` para usar tu servicio preferido.

### 3. Desplegar la Edge Function

```bash
# Instalar Supabase CLI si no lo tenés
npm install -g supabase

# Login a Supabase
supabase login

# Vincular el proyecto
supabase link --project-ref lndqeaspuwwgdwbggayd

# Desplegar la función
supabase functions deploy send-verification-email
```

### 4. Probar en Desarrollo (Sin Edge Function)

Si no querés configurar emails todavía, la Edge Function devuelve la URL de verificación en la respuesta cuando no está configurado `RESEND_API_KEY`. Podés verla en la consola del navegador.

## 🎯 Cómo funciona

### Flujo de Registro
1. Usuario se registra normalmente (NO se bloquea el registro)
2. Se crea automáticamente un token de verificación (trigger)
3. Usuario puede navegar por la app
4. Al intentar acceder a Comuni 7, Mensajes o Galería:
   - Si NO tiene email verificado: ve pantalla de bloqueo
   - Puede enviar/reenviar email de verificación
5. Usuario hace click en el link del email
6. Se verifica el token y marca `email_verified = true`
7. Usuario ahora puede acceder a todas las funciones

### Páginas Protegidas
Estas páginas requieren verificación de email:
- 👥 **Comuni 7** (`/usuarios`)
- 💬 **Mensajes** (`/mensajes`)
- 📸 **Galería** (`/galeria`)

### Páginas Públicas
Estas NO requieren verificación:
- 🏠 Inicio
- 👤 Perfil (puede ver y editar perfil, pero verá banner si no está verificado)
- 📅 Eventos
- 📖 Historia, Bauen, etc.

## 🧪 Testing

### Verificar que la migración se aplicó correctamente:
```sql
-- En SQL Editor de Supabase:
SELECT * FROM email_verification_tokens LIMIT 5;
SELECT user_id, email_verified FROM profiles LIMIT 5;
```

### Generar token manualmente para testing:
```sql
-- Reemplaza USER_ID_AQUI con tu user_id
SELECT * FROM generate_verification_token('USER_ID_AQUI');
```

### Verificar token manualmente:
```sql
-- Reemplaza TOKEN_AQUI con el token generado
SELECT * FROM verify_email_token('TOKEN_AQUI');
```

## 🚀 Producción vs Desarrollo

- **Desarrollo**: Edge Function devuelve URL en respuesta si no hay RESEND_API_KEY
- **Producción**: Envía email real con Resend/SendGrid/etc.

## 🔒 Seguridad

- ✅ Tokens expiran en 24 horas
- ✅ Tokens de un solo uso
- ✅ Row Level Security (RLS) activado
- ✅ Funciones con SECURITY DEFINER
- ✅ Validaciones en backend

## 📧 Personalizar Email

Edita `supabase/functions/send-verification-email/index.ts` para cambiar:
- Diseño del email (HTML)
- Texto del asunto
- Remitente
- Idioma

## ❓ Troubleshooting

### "Column 'email_verified' does not exist"
→ No aplicaste la migración. Ve al paso 1.

### "Edge Function not found"
→ No desplegaste la función. Ve al paso 3.

### Email no se envía
→ Verifica que configuraste `RESEND_API_KEY` en Edge Function Secrets.

### Token inválido/expirado
→ Los tokens duran 24 horas. Usa el botón "Reenviar email" para generar uno nuevo.

## 🎨 Personalización

Podés personalizar:
- Tiempo de expiración: Modificá `INTERVAL '24 hours'` en la migración SQL
- Diseño del email: Editá el HTML en `send-verification-email/index.ts`
- Funcionalidades bloqueadas: Agregá/quitá `<EmailVerificationGuard>` en las páginas

## 📝 Comandos Útiles

```bash
# Ver logs de la Edge Function
supabase functions logs send-verification-email

# Limpiar tokens expirados (ejecutar periódicamente)
supabase db run "SELECT cleanup_expired_tokens();"
```

---

**¿Todo listo?** Una vez aplicada la migración y configurado Resend, el sistema funcionará en producción! 🎉
