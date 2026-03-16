# ✅ Email Service - Checklist de Verificación

## Pre-requisitos

- [ ] Node.js instalado (v18+)
- [ ] Docker instalado (para Mailhog, opcional)
- [ ] Servidor backend corriendo
- [ ] Frontend corriendo

---

## 🔧 Configuración Inicial

### 1. Backend
- [ ] Navegar a carpeta `server/`
- [ ] Copiar `.env.example` a `.env`
- [ ] Configurar variables SMTP:
  ```env
  SMTP_HOST=mailhog
  SMTP_PORT=1025
  FROM_EMAIL=noreply@scout-local.dev
  APP_URL=http://localhost:5173
  ```
- [ ] Instalar dependencias: `npm install`
- [ ] Verificar que `nodemailer` está en `package.json`

### 2. Mailhog (Opcional pero recomendado)
- [ ] Iniciar Mailhog:
  ```bash
  docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
  ```
- [ ] Verificar acceso a http://localhost:8025

### 3. Frontend
- [ ] Verificar que existe `src/pages/VerificarEmail.tsx`
- [ ] Verificar que existe ruta `/verificar-email` en `App.tsx`
- [ ] Verificar banner en `src/pages/Perfil.tsx`

---

## 🧪 Testing Funcional

### Test 1: Registro de Usuario
1. [ ] Iniciar servidor backend: `cd server && npm run dev`
2. [ ] Iniciar frontend: `npm run dev` (en raíz)
3. [ ] Ir a http://localhost:5173/auth
4. [ ] Registrar nuevo usuario con email válido
5. [ ] Verificar en consola del servidor:
   ```
   📧 Email de verificación enviado a email@ejemplo.com
   ```

### Test 2: Recepción de Email
**Con Mailhog:**
- [ ] Ir a http://localhost:8025
- [ ] Verificar email recibido
- [ ] Verificar que contiene:
  - [ ] Asunto: "🎖️ Verifica tu correo - Grupo Scout"
  - [ ] Botón "Verificar mi correo"
  - [ ] Link alternativo
  - [ ] Advertencia de expiración

**Sin Mailhog:**
- [ ] Buscar en consola del servidor:
  ```
  🔗 Link de verificación (fallback): http://localhost:5173/verificar-email?token=...
  ```

### Test 3: Verificación de Email
- [ ] Copiar token del email o consola
- [ ] Navegar a: `http://localhost:5173/verificar-email?token=TOKEN`
- [ ] Verificar página muestra:
  - [ ] Spinner de carga
  - [ ] Mensaje "¡Email verificado!"
  - [ ] Ícono de check verde
  - [ ] Botón "Ir a mi perfil"
- [ ] Verificar redirección automática después de 3 segundos

### Test 4: Estado Verificado en Perfil
- [ ] Iniciar sesión con usuario verificado
- [ ] Ir a `/perfil`
- [ ] Verificar que NO aparece banner amarillo

### Test 5: Usuario No Verificado
- [ ] Registrar otro usuario nuevo
- [ ] NO verificar el email
- [ ] Ir a `/perfil`
- [ ] Verificar que aparece:
  - [ ] Banner amarillo "Email no verificado"
  - [ ] Texto descriptivo
  - [ ] Botón "Reenviar email"

### Test 6: Reenvío de Email
- [ ] Con usuario no verificado en perfil
- [ ] Click en "Reenviar email"
- [ ] Verificar:
  - [ ] Botón cambia a "Enviando..."
  - [ ] Toast de éxito aparece
  - [ ] Nuevo email recibido en Mailhog
  - [ ] Nuevo token generado

### Test 7: Token Expirado
- [ ] Usar un token antiguo (>24 horas) o modificar en DB
- [ ] Intentar verificar
- [ ] Verificar mensaje: "Token expirado"
- [ ] Verificar botón para reenviar

### Test 8: Token Ya Usado
- [ ] Verificar un email exitosamente
- [ ] Intentar usar el mismo link/token otra vez
- [ ] Verificar mensaje: "Token ya usado"

### Test 9: Token Inválido
- [ ] Navegar a `/verificar-email?token=token-inventado`
- [ ] Verificar mensaje: "Token inválido"

---

## 🎨 Testing Visual

### Email HTML
- [ ] Abrir email en Mailhog
- [ ] Verificar:
  - [ ] Colores correctos (gradiente morado)
  - [ ] Botón visible y destacado
  - [ ] Texto legible
  - [ ] Logo/emoji visible
  - [ ] Responsive (se ve bien en preview)

### Banner de Perfil
- [ ] Fondo amarillo claro
- [ ] Ícono de alerta visible
- [ ] Texto descriptivo claro
- [ ] Botón de reenvío bien posicionado
- [ ] Se ve bien en móvil y desktop

### Página de Verificación
- [ ] Spinner animado durante carga
- [ ] Ícono grande (check verde o X roja)
- [ ] Mensaje centrado y legible
- [ ] Botones bien espaciados
- [ ] Link de ayuda al pie

---

## 🔒 Testing de Seguridad

- [ ] Token es UUID v4 (32 caracteres hex)
- [ ] Token no es adivinable
- [ ] Token expira correctamente
- [ ] Token solo funciona una vez
- [ ] No se puede verificar email de otro usuario
- [ ] Endpoint requiere autenticación para reenvío

---

## 🐛 Testing de Errores

### Error de SMTP
- [ ] Configurar SMTP_HOST inválido
- [ ] Intentar registro
- [ ] Verificar:
  - [ ] Error capturado
  - [ ] Link en consola como fallback
  - [ ] Registro no bloqueado

### Usuario Ya Verificado
- [ ] Usuario con email verificado
- [ ] Intentar reenviar email
- [ ] Verificar mensaje: "Email ya verificado"

### Sin Autenticación
- [ ] Intentar POST /auth/resend-verification sin token JWT
- [ ] Verificar error 401

---

## 📱 Testing Multiplataforma

### Navegadores
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Dispositivos
- [ ] Desktop (>1024px)
- [ ] Tablet (768px-1024px)
- [ ] Móvil (<768px)

### Clientes de Email (si usas SMTP real)
- [ ] Gmail
- [ ] Outlook
- [ ] Apple Mail
- [ ] Thunderbird

---

## 📊 Validación de Datos

### Base de Datos
- [ ] Abrir DB (SQLite browser o psql)
- [ ] Verificar tabla `verification_tokens` existe
- [ ] Verificar columnas:
  - [ ] `id` (UUID)
  - [ ] `user_id` (UUID, FK)
  - [ ] `token` (UUID)
  - [ ] `expires_at` (timestamp)
  - [ ] `used_at` (timestamp nullable)
  - [ ] `created_at` (timestamp)

### Tabla Users
- [ ] Verificar columna `email_verified_at` existe
- [ ] Antes de verificar: `NULL`
- [ ] Después de verificar: timestamp válido

---

## 🚀 Testing en Producción (Staging)

**⚠️ Usar con cuidado y credenciales de prueba**

### Gmail Configuration
- [ ] Configurar variables en servidor staging:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=tu-email-test@gmail.com
  SMTP_PASS=app-password-generado
  ```
- [ ] Registrar usuario con email real
- [ ] Verificar recepción en bandeja de entrada
- [ ] Verificar email no va a spam
- [ ] Verificar links funcionan con HTTPS

---

## 📝 Checklist de Documentación

- [ ] `EMAIL_SERVICE_GUIDE.md` creado
- [ ] `EMAIL_INTEGRATION_SUMMARY.md` creado
- [ ] `server/.env.example` actualizado
- [ ] `server/README.md` actualizado
- [ ] Comentarios en código claros
- [ ] Types de TypeScript correctos

---

## ✅ Criterios de Aceptación

Para considerar la integración **completa y funcional**, TODOS deben pasar:

1. ✅ Email se envía correctamente al registrarse
2. ✅ Email contiene link válido de verificación
3. ✅ Verificación marca email como verificado en DB
4. ✅ Usuario verificado no ve banner
5. ✅ Usuario no verificado ve banner y puede reenviar
6. ✅ Tokens expirados no funcionan
7. ✅ Tokens usados no se reutilizan
8. ✅ Fallback a consola funciona si falla SMTP
9. ✅ UI responsive en todos los dispositivos
10. ✅ Sin errores en consola del navegador
11. ✅ Sin errores en logs del servidor (excepto intencionados)
12. ✅ Documentación completa y clara

---

## 🎉 Resultado Esperado

Si **todos** los checks pasan:
```
✅ Email Service integrado correctamente
✅ Listo para desarrollo
✅ Listo para testing QA
✅ Documentado completamente
⚠️ Falta: Tests automatizados (opcional)
⚠️ Falta: Configurar producción (hacer después)
```

---

**Última actualización:** 11 de noviembre de 2025  
**Versión checklist:** 1.0.0
