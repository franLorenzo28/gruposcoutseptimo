# 🔒 Guía de Seguridad

## ⚠️ Variables de Entorno

### Reglas Críticas:
1. **NUNCA** commitear archivos `.env` con valores reales
2. **SIEMPRE** usar `.env.example` como plantilla sin valores sensibles
3. **OBLIGATORIO** configurar variables en plataformas de deploy (Netlify, Vercel)

### Archivos Seguros para Commitear:
- ✅ `.env.example` - Plantilla sin valores reales
- ✅ `.gitignore` - Debe excluir todos los `.env*`
- ✅ `README.md` - Documentación pública

### Archivos que NUNCA se deben commitear:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.development`
- ❌ `.env.staging`
- ❌ `.env.production`
- ❌ `.env.vercel`
- ❌ Cualquier archivo con API keys, tokens o secrets

## 🔑 API Keys Expuestas

Si accidentalmente commiteaste una API key:

### Google Maps API:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. **Regenera** la API key comprometida
4. Actualiza las restricciones (HTTP referrers)
5. Actualiza tus variables de entorno

### Supabase:
1. Ve a tu [Supabase Dashboard](https://app.supabase.com/)
2. Settings → API
3. **Resetea** las claves comprometidas
4. Actualiza tus variables de entorno
5. Revoca tokens de usuario si es necesario

## 🛡️ Mejores Prácticas

### En Desarrollo:
```bash
# Copia el ejemplo
cp .env.example .env.local

# Edita con tus valores locales
# NUNCA commitees este archivo
```

### En Producción:
- Usa las interfaces de las plataformas de deploy
- Netlify: Settings → Environment variables
- Vercel: Settings → Environment Variables
- Nunca incluyas secrets en el código fuente

## 📋 Checklist de Seguridad

Antes de cada commit:
- [ ] No hay archivos `.env*` (excepto `.env.example`)
- [ ] No hay API keys hardcodeadas en el código
- [ ] `.gitignore` incluye todos los archivos sensibles
- [ ] Las variables se leen con `import.meta.env.VITE_*`
- [ ] Hay validación de variables requeridas

## 🚨 ¿Qué hacer si commiteaste un secret?

1. **Inmediatamente** revoca/regenera el secret comprometido
2. Actualiza las variables de entorno en todas las plataformas
3. NO simplemente borres el commit - el historial de Git lo mantiene
4. Considera usar `git filter-branch` o BFG Repo-Cleaner para limpiar el historio
5. Fuerza push (con cuidado) al repositorio remoto
6. Notifica al equipo

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Git Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Environment Variables Best Practices](https://12factor.net/config)
