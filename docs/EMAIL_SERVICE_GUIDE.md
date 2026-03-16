# Guía del Servicio de Email

## 📧 Descripción General

El servicio de email está integrado en el backend local para enviar correos de verificación durante el registro de usuarios. Utiliza **nodemailer** con configuración flexible para desarrollo (Mailhog) y producción (SMTP real).

---

## 🛠️ Configuración

### Variables de Entorno

Edita `server/.env` basándote en `server/.env.example`:

```bash
# Desarrollo local (Mailhog)
SMTP_HOST=mailhog
SMTP_PORT=1025
FROM_EMAIL=noreply@scout-local.dev
APP_URL=http://localhost:5173

# Producción (ejemplo con Gmail)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu-email@gmail.com
# SMTP_PASS=tu-app-password
# FROM_EMAIL=noreply@gruposcout.org
# APP_URL=https://tu-dominio.com
```

---

## 🚀 Uso en Desarrollo

### Opción 1: Mailhog (Recomendado)

Mailhog captura todos los emails localmente sin enviarlos. Ideal para testing.

**Instalación con Docker:**
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

**Acceso a la interfaz web:**
- URL: http://localhost:8025
- Aquí verás todos los emails capturados

### Opción 2: Sin servidor SMTP

Si no configuras Mailhog, el sistema mostrará el link de verificación en la consola del servidor:

```
🔗 Link de verificación (fallback): http://localhost:5173/verificar-email?token=xxx
```

---

## 📮 Producción

### Gmail (Ejemplo)

1. Habilita la verificación en 2 pasos en tu cuenta de Gmail
2. Genera una contraseña de aplicación: https://myaccount.google.com/apppasswords
3. Configura las variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=contraseña-de-aplicacion
FROM_EMAIL=noreply@gruposcout.org
APP_URL=https://tu-dominio.com
```

### Otros Proveedores SMTP

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.us-east-1.amazonaws.com:587`

---

## 🔄 Flujo de Verificación

### 1. Registro
```
Usuario se registra → Backend crea token → Envía email → Usuario recibe email
```

### 2. Verificación
```
Usuario hace clic en link → GET /auth/verify?token=xxx → Email verificado
```

### 3. Reenviar Email
```
Usuario autenticado → POST /auth/resend-verification → Nuevo email enviado
```

---

## 🎨 Plantilla de Email

El email incluye:
- ✅ HTML responsive con estilos inline
- ✅ Versión texto plano (fallback)
- ✅ Botón destacado con link de verificación
- ✅ Link alternativo en texto
- ✅ Advertencia de expiración (24 horas)
- ✅ Identidad visual del Grupo Scout

**Preview:**
```html
🎖️ ¡Bienvenido/a al Grupo Scout!

Hola,

Gracias por registrarte. Para completar tu registro y verificar tu 
correo electrónico, haz clic en el siguiente enlace:

[ Verificar mi correo ]

O copia y pega este enlace en tu navegador:
http://localhost:5173/verificar-email?token=abc123...

⏰ Este enlace expira en 24 horas.

Si no solicitaste este registro, puedes ignorar este correo.

¡Siempre listos!
```

---

## 🧪 Testing

### Probar envío de email:

1. Inicia Mailhog (si lo usas):
   ```bash
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. Inicia el servidor:
   ```bash
   cd server
   npm run dev
   ```

3. Registra un usuario desde el frontend

4. Verifica en:
   - Mailhog: http://localhost:8025
   - O consola del servidor para ver el link de fallback

### Probar verificación:

1. Copia el token del email o consola
2. Navega a: `http://localhost:5173/verificar-email?token=TU_TOKEN`
3. Deberías ver el mensaje de éxito

### Probar reenvío:

1. Inicia sesión con una cuenta no verificada
2. En tu perfil, verás un banner amarillo
3. Haz clic en "Reenviar email"
4. Verifica el nuevo email en Mailhog

---

## 📂 Archivos Relevantes

### Backend
- `server/src/email-service.ts` - Configuración y envío de emails
- `server/src/routes/auth.ts` - Endpoints de autenticación y verificación
- `server/src/db.ts` - Tabla `verification_tokens`
- `server/.env.example` - Configuración de ejemplo

### Frontend
- `src/pages/VerificarEmail.tsx` - Página de verificación
- `src/pages/Perfil.tsx` - Banner de reenvío de email
- `src/lib/backend.ts` - Helper `getAuthUser` con estado de verificación

---

## 🐛 Troubleshooting

### Email no se envía

1. **Verifica la configuración**:
   ```bash
   echo $SMTP_HOST
   echo $SMTP_PORT
   ```

2. **Revisa los logs del servidor**:
   ```
   📧 Email de verificación enviado a user@example.com
   ```
   O si falla:
   ```
   ❌ Error al enviar email: ...
   🔗 Link de verificación (fallback): http://...
   ```

3. **Prueba conexión SMTP**:
   ```bash
   telnet smtp.gmail.com 587
   ```

### Token expirado

Los tokens expiran en **24 horas**. Si el usuario intenta verificar después:
- Mensaje: "Token expirado"
- Solución: Usar "Reenviar email" desde el perfil

### No veo el banner de verificación

El banner solo aparece si:
- `emailVerified === false`
- `isLocalBackend() === true`

---

## 🔐 Seguridad

### Mejores Prácticas Implementadas

✅ Tokens únicos UUID v4 (prácticamente imposibles de adivinar)
✅ Expiración de 24 horas
✅ Tokens de un solo uso (campo `used_at`)
✅ Invalidación de tokens anteriores al reenviar
✅ No exponer información sensible en emails
✅ HTTPS requerido en producción (APP_URL)

### Recomendaciones Adicionales

- 🔒 Usa HTTPS/TLS para SMTP en producción
- 🔑 Nunca commitees credenciales en `.env`
- 🚫 Limita intentos de reenvío (rate limiting)
- 📝 Registra eventos de verificación para auditoría

---

## 📊 Monitoreo

### Logs a observar:

```bash
# Registro exitoso
✅ Usuario registrado: user@example.com

# Email enviado
📧 Email de verificación enviado a user@example.com

# Verificación exitosa
✅ Email verificado: user@example.com

# Reenvío
🔁 Email de verificación reenviado a user@example.com
```

---

## 🚀 Próximos Pasos

Mejoras futuras sugeridas:

- [ ] Rate limiting en endpoints de reenvío
- [ ] Notificaciones por otros canales (SMS, WhatsApp)
- [ ] Emails transaccionales adicionales (recuperación de contraseña)
- [ ] Personalización de plantillas por tipo de usuario
- [ ] Soporte multiidioma en emails
- [ ] Analytics de apertura y clicks

---

## 📞 Soporte

Para más información:
- Backend local: `server/README.md`
- Documentación de nodemailer: https://nodemailer.com
- Mailhog: https://github.com/mailhog/MailHog

---

**Última actualización:** 11 de noviembre de 2025  
**Versión:** 1.0.0
