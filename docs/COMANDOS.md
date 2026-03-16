# 🛠️ Comandos Útiles - Grupo Scout Séptimo

## 📦 Instalación y Setup

```bash
# Instalar todas las dependencias
npm install

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar build anterior
npm run clean
```

---

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# Iniciar con backend local (si está configurado)
npm run dev:server

# Iniciar frontend + backend simultáneamente
npm run dev:all
```

---

## 🏗️ Build

```bash
# Build para producción
npm run build

# Build para desarrollo (con sourcemaps)
npm run build:dev

# Build para staging
npm run build:staging

# Build con análisis de bundle
npm run build:analyze
```

---

## 👀 Preview

```bash
# Preview del build de producción
npm run preview

# Preview del build de desarrollo
npm run preview:dev

# Preview del build de staging
npm run preview:staging
```

---

## 🔍 Calidad de Código

```bash
# Verificar tipos TypeScript (sin compilar)
npm run type-check

# Ejecutar linter
npm run lint

# Fix automático de linting
npm run lint -- --fix
```

---

## 📄 Utilidades

```bash
# Generar sitemap.xml
npm run generate:sitemap

# Limpiar carpeta dist
npm run clean
```

---

## 🚀 Deploy

```bash
# Deploy a staging
npm run deploy:staging

# Deploy a staging (ZIP)
npm run deploy:staging:zip

# Deploy a producción
npm run deploy:prod

# Deploy a producción (ZIP)
npm run deploy:prod:zip
```

---

## 🔧 Configuración de Variables de Entorno

```bash
# Desarrollo local
cp .env.example .env.local
# Edita .env.local con tus valores

# Verificar variables cargadas (en código)
# Las variables VITE_* se cargan automáticamente
```

---

## 🧪 Testing y Validación

### Manual Testing:
```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. Abrir en navegador
# http://localhost:4173
```

### Lighthouse Audit:
```bash
# 1. Build de producción
npm run build

# 2. Servir estáticamente
npm run preview

# 3. Abrir Chrome DevTools
# Run Lighthouse audit en modo producción
```

### TypeScript Validation:
```bash
# Verificar que no hay errores de tipos
npm run type-check

# Si hay errores, el comando falla (exit code 1)
```

---

## 📊 Análisis de Bundle

```bash
# Build con reporte de tamaños
npm run build

# Vite muestra automáticamente:
# - Tamaño de cada chunk
# - Tamaño comprimido (gzip)
# - Warnings si algún chunk es muy grande
```

Para análisis más detallado:
```bash
# Instalar herramienta de análisis
npm install --save-dev rollup-plugin-visualizer

# Agregar a vite.config.ts:
# import { visualizer } from 'rollup-plugin-visualizer';
# plugins: [... visualizer()]

# Build y abrir stats.html
npm run build
```

---

## 🔐 Seguridad

### Verificar Secrets Expuestos:
```bash
# Buscar archivos .env committeados (NO DEBERÍAN EXISTIR)
git ls-files | grep ".env"

# Si encuentra algo que NO sea .env.example, ¡PELIGRO!

# Buscar API keys en código (NO DEBERÍAN EXISTIR)
grep -r "AIzaSy" src/
grep -r "sk_" src/
grep -r "pk_" src/
```

### Regenerar API Keys Comprometidas:

**Google Maps**:
1. Ve a https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Encuentra tu API key
4. Clic en el icono de papelera (Delete)
5. Crea nueva API key
6. Agrega restricciones (HTTP referrer)

**Supabase**:
1. Ve a https://app.supabase.com/
2. Settings → API
3. Reset anon key (si es necesario)
4. Actualiza en variables de entorno

---

## 📱 PWA Testing

```bash
# 1. Build de producción
npm run build

# 2. Servir con HTTPS (requerido para PWA)
# Opción A: Netlify Dev
npx netlify dev

# Opción B: Servir con certificado local
npx serve dist --ssl-cert cert.pem --ssl-key key.pem

# 3. Abrir Chrome DevTools
# Application → Manifest
# Application → Service Workers
# Lighthouse → PWA audit
```

---

## 🌐 Deploy a Hosting

### Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy a draft
netlify deploy

# Deploy a producción
netlify deploy --prod
```

### Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy a preview
vercel

# Deploy a producción
vercel --prod
```

### Manual (Cualquier hosting):
```bash
# 1. Build
npm run build

# 2. Subir carpeta /dist a tu hosting
# - Netlify: drag & drop dist/
# - Vercel: conectar repo GitHub
# - Otros: FTP/SSH a carpeta dist/
```

---

## 🐛 Debugging

### Errores de Build:
```bash
# Limpiar todo y reinstalar
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Variables de Entorno no Cargadas:
```bash
# Verificar que existen
cat .env.local

# Verificar que empiezan con VITE_
# Solo las variables VITE_* son accesibles en el cliente

# Reiniciar servidor de desarrollo
# Ctrl+C para parar
npm run dev
```

### Build Muy Grande:
```bash
# Analizar bundle
npm run build:analyze

# Ver qué librerías pesan más
# Considerar:
# - Lazy loading de componentes
# - Tree shaking de librerías
# - Eliminar dependencias no usadas
```

---

## 📚 Recursos Útiles

### Herramientas Online:
- **Lighthouse**: Auditoría de performance/SEO/a11y
- **PageSpeed Insights**: https://pagespeed.web.dev/
- **WAVE**: https://wave.webaim.org/ (accesibilidad)
- **GTmetrix**: https://gtmetrix.com/ (performance)

### Validadores:
- **HTML**: https://validator.w3.org/
- **CSS**: https://jigsaw.w3.org/css-validator/
- **JSON-LD**: https://search.google.com/test/rich-results
- **Open Graph**: https://www.opengraph.xyz/

### Optimizadores de Imágenes:
- **Squoosh**: https://squoosh.app/ (online)
- **TinyPNG**: https://tinypng.com/ (online)
- **Sharp**: `npm install sharp` (Node.js)

---

## 💡 Tips

### Performance:
```bash
# Preload critical resources en index.html
# Lazy load componentes con React.lazy()
# Usa webP para imágenes
# Implementa CDN para assets
```

### SEO:
```bash
# Actualizar sitemap antes de cada deploy
npm run generate:sitemap

# Verificar en Google Search Console
# Submit sitemap en /sitemap.xml
```

### Seguridad:
```bash
# NUNCA commitear .env*
# SIEMPRE usar variables de entorno
# Regenerar keys expuestas INMEDIATAMENTE
```

---

**Última actualización**: 15 de noviembre de 2025
