# 🔐 Guía de Rotación de Credenciales Comprometidas

**Estado**: REQUERIDO ANTES DE PRODUCCIÓN ⚠️

---

## Resumen

Tu repositorio fue auditado y se encontró **2 credenciales críticas expuestas** en `.env.local`:
1. **Supabase Anon Key** - Token de acceso a la base de datos
2. **Google Maps API Key** - Clave para servicio de mapas

Aunque las claves fueron removidas del código fuente, **deben regenerarse** porque:
- Estuvieron en un repositorio público (incluso si private ahora)
- Pueden haber sido cacheadas o indexadas
- Es mejor-práctica rotar después de cualquier exposición

---

## Instrucciones de Regeneración

### 1. Supabase Anon Key ✅

**Dónde ir**: [Supabase Dashboard](https://app.supabase.com/project/lndqeaspuwwgdwbggayd/settings/api)

**Pasos**:
1. Usa este enlace directo: https://app.supabase.com/project/lndqeaspuwwgdwbggayd/settings/api
2. En la sección "Riesgo de seguridad" o "API Keys", busca opciones de reset
3. Si no ves opción de reset, puede generar una **nueva clave de anonimous** (Anon) desde cero
4. Copia la nueva clave (empieza con `ey...`)
5. Actualiza `.env.local`:
   ```bash
   VITE_SUPABASE_ANON_KEY=<NUEVA_CLAVE_AQUI>
   ```
6. Quita el comentario sobre "REGENERATE_FROM_SUPABASE_DASHBOARD"

**Alternativa**: Si Supabase no permite reset, contacta a su soporte en https://app.supabase.com/support

---

### 2. Google Maps API Key ✅

**Dónde ir**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Pasos**:
1. Usa este enlace: https://console.cloud.google.com/apis/credentials
2. Busca la clave llamada **"Grupo Scout Septimo"** o identifica la clave activa
3. **Opción A - Regenerar la clave existente**:
   - Haz clic en el icono de riesgo/reload
   - Confirma la regeneración
   - Copia la nueva clave
   
4. **Opción B - Crear una clave nueva**:
   - Clic en **"Crear credenciales"** → **"Clave de API"**
   - Selecciona **"Restricción a aplicaciones web"** o **"HTTP referrer"**
   - Agrega estos orígenes permitidos:
     ```
     https://gruposcoutseptimo.vercel.app
     https://localhost:5173
     localhost:4000
     https://tudominio.com (cuando lo tengas)
     ```
   - Copia la nueva clave

5. Actualiza `.env.local`:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=<NUEVA_CLAVE_AQUI>
   ```
6. Quita el comentario sobre "REGENERATE_FROM_GOOGLE_CLOUD_CONSOLE"

**Recomendación**: Después de regenerar, espera ~5 minutos para que Google active la nueva clave.

---

## Verificación

Una vez actualizado `.env.local` con las nuevas claves:

```bash
# 1. Verifica que el archivo tenga las claves (sin REGENERATE_)
cat .env.local | grep VITE_SUPABASE_ANON_KEY
cat .env.local | grep VITE_GOOGLE_MAPS_API_KEY

# 2. Inicia el dev server y verifica sin errores de auth
npm run dev

# 3. Navega a /mapa (si existe) o áreas que usen Google Maps
# Verifica que no hay errores de "API key not valid" en la consola

# 4. Corre los tests
npm run test
```

---

## Configuración en Producción (Vercel/Netlify)

**IMPORTANTE**: Las claves `.env.local` son locales. Para producción:

### Vercel
1. Abre https://vercel.com/projects
2. Selecciona tu proyecto **Grupo Scout Séptimo**
3. Ve a **Settings** → **Environment Variables**
4. Agrega o actualiza:
   - `VITE_SUPABASE_ANON_KEY` = nueva clave de Supabase
   - `VITE_GOOGLE_MAPS_API_KEY` = nueva clave de Google
   - `VITE_ENV` = `production`
5. Haz click en **Save**
6. Script del deploy se ejecutará automáticamente

### Netlify
Similar proceso:
1. Site Settings → Build & Deploy → Environment
2. Agrega `VITE_SUPABASE_ANON_KEY` y `VITE_GOOGLE_MAPS_API_KEY`
3. Redeploy manual si es necesario

---

## Checklist Completo

- [ ] Regeneré Supabase Anon Key en dashboard
- [ ] Regeneré Google Maps API Key en Cloud Console
- [ ] Actualicé `.env.local` con las nuevas claves
- [ ] Quité comentarios "REGENERATE_" de `.env.local`
- [ ] Ejecuté `npm run dev` y verificó sin errores
- [ ] Ejecuté `npm run test` y pasaron todos los tests
- [ ] Actualizé variables de ambiente en Vercel/Netlify
- [ ] Hice commit: `git commit -m "chore: rotate credentials (dev keys)"`
- [ ] Deploy a producción con nuevas claves

---

## Notas de Seguridad

- ✅ `.gitignore` ya está actualizado para excluir `.env*`
- ✅ Los archivos `.env` nunca deben committearse
- ✅ Usa siempre `.env.local` para desarrollo local
- ✅ `.env.example` sirve como template seguro para otros devs
- ⚠️ Mantén roles de acceso mínimos en Supabase
- ⚠️ Usa Google Maps API key restricción por HTTP referrer
- ⚠️ Rota credenciales cada 90 días o ante cualquier exposición

---

## Soporte

Si tienes dudas sobre regeneración de credenciales:

**Supabase**: https://supabase.io/docs/guides/api
**Google Cloud**: https://cloud.google.com/docs/authentication/api-keys

**Status**: Este documento fue creado el 25/03/2026 como parte de P0 #5 (Security Credential Rotation) en pre-release audit.
