# 🏕️ Grupo Scout Séptimo de Montevideo

> Sitio web oficial del Grupo Scout Séptimo - Formando líderes desde 1964

[![Deploy Status](https://img.shields.io/badge/deploy-ready-brightgreen)]()
[![CI](https://github.com/tu-usuario/lovable-scout-canvas/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/lovable-scout-canvas/actions)
[![Security](https://img.shields.io/badge/security-audited-blue)]()
[![Performance](https://img.shields.io/badge/performance-optimized-orange)]()

---

## ⚡ Setup Rápido

### 1. Clonar e Instalar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/lovable-scout-canvas.git
cd lovable-scout-canvas

# Instalar dependencias
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env.local

# Editar con tus valores
# NUNCA commitees .env.local - está en .gitignore
```

Valores mínimos requeridos:
```env
VITE_BACKEND=supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_GOOGLE_MAPS_API_KEY=tu_api_key (opcional)
```

⚠️ **IMPORTANTE**: Lee [SECURITY.md](./SECURITY.md) antes de configurar.

### 3. Iniciar Desarrollo

```bash
npm run dev
```

Accede a http://localhost:5173

---

## 🔒 Seguridad

Este proyecto fue auditado y todas las **credenciales hardcodeadas fueron removidas**.

**Acciones requeridas antes de deploy**:
1. Regenera API keys si fueron expuestas (ver [SECURITY.md](./SECURITY.md))
2. Configura variables de entorno en tu hosting
3. Revisa el [CHECKLIST.md](./CHECKLIST.md) completo

---

## 📖 Documentación Clave

| Documento | Descripción |
|-----------|-------------|
| [RESUMEN.md](./RESUMEN.md) | 👈 **Empieza aquí** - Resumen ejecutivo de mejoras |
| [SECURITY.md](./SECURITY.md) | 🔒 Guía de seguridad y manejo de secrets |
| [CHECKLIST.md](./CHECKLIST.md) | ✅ Checklist de calidad antes de deploy |
| [MEJORAS.md](./MEJORAS.md) | 📊 Detalles técnicos de optimizaciones |

---

## 🚀 Inicio Rápido (Legacy)

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Accede a http://localhost:5173

> **Nota**: Este proyecto funciona con Supabase. Toda la autenticación y datos se manejan con Supabase o localmente con `localStorage` en modo desarrollo.

---

## 📚 Documentación Adicional

### 🏗️ Arquitectura

- **[Arquitectura Local](docs/LOCAL_ARCHITECTURE.md)** - Sistema actual sin dependencias externas pesadas
  
### (Legacy removido)

Secciones Docker y arquitecturas completas con PostgreSQL fueron removidas del flujo principal.

### ⚙️ Configuración Inicial

- **[Google Maps](docs/setup/GOOGLE_MAPS.md)** - Configurar Google Maps API
- **[Google Maps Billing Fix](docs/setup/GOOGLE_MAPS_BILLING_FIX.md)** - Solución sin facturación
- **[Email Verification](docs/setup/EMAIL_VERIFICATION.md)** - ⚠️ No disponible sin backend
- **[Avatar](docs/setup/AVATAR.md)** - Configuración de avatares (mockeado)
- **[Supabase Fix](docs/setup/SUPABASE_FIX.md)** - ⚠️ Obsoleto: Supabase removido

### 🚀 Optimización

- **[Optimizaciones](docs/optimization/OPTIMIZATIONS.md)** - Mejoras de rendimiento aplicadas
- **[Guía de Performance](docs/optimization/PERFORMANCE_GUIDE.md)** - Buenas prácticas

### ✨ Features

- **[Perfil Fixes](docs/features/PERFIL_FIXES.md)** - Correcciones del perfil de usuario
- **[Testing Automation](docs/features/TESTING_AUTOMATION.md)** - Automatización de pruebas

### 📖 Guías

- **[Migrar sin Supabase](docs/guides/MIGRAR_SIN_SUPABASE.md)** - Guía de migración
- **[Instrucciones Migraciones](docs/guides/INSTRUCCIONES_MIGRACIONES.md)** - Migraciones de BD

---

## 🛠️ Tecnologías

### Frontend

- **React 18** con TypeScript
- **Vite** - Build tool ultrarrápido
- **TailwindCSS** - Estilos utility-first
- **shadcn/ui** - Componentes UI
- **React Query** - Gestión de estado y cache
- **React Router** - Enrutamiento
- **localStorage** - Persistencia de datos local

### Backend (OPCIONAL - No instalado)

- **Node.js 20** con TypeScript
- **Express** - API REST
- **PostgreSQL** o **SQLite** - Base de datos
- **JWT** - Autenticación
- **Multer** - Upload de archivos
- **Socket.io** - WebSockets

> ⚠️ **Nota:** El backend no está configurado actualmente. El proyecto funciona con mocks locales.

### ~~Supabase~~ (REMOVIDO)

- ~~Autenticación~~
- ~~Base de datos~~
- ~~Storage~~
- ~~Real-time~~

Reemplazado por sistema de autenticación local en `src/lib/auth-mock.ts`.

### DevOps

- **Vercel** - Hosting y deploy
- **ESLint / TypeScript** - Calidad de código
- **Scripts PowerShell** - Tareas de build/deploy

---

## 📁 Estructura del Proyecto

```
lovable-scout-canvas/
├── src/                    # Código fuente del frontend
│   ├── components/         # Componentes React
│   ├── pages/              # Páginas/Rutas
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilidades y helpers
│   └── integrations/       # Integraciones (Supabase, etc)
├── server/                 # Backend API
│   ├── src/                # Código TypeScript
│   ├── db/                 # Scripts de base de datos
│   ├── data/               # SQLite databases
│   └── uploads/            # Archivos subidos
├── docs/                   # Documentación
│   ├── setup/              # Guías de configuración
│   ├── optimization/       # Optimización
│   ├── features/           # Features específicas
│   └── guides/             # Guías generales
├── scripts/                # Scripts de utilidad
├── public/                 # Archivos estáticos
└── scripts/                # Scripts auxiliares
```

---

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con HMR
npm run build            # Build de producción
npm run preview          # Preview del build

# Calidad de código
npm run type-check       # Verificar tipos TypeScript
npm run lint             # Linter

# Deploy
vercel --prod            # Desplegar a producción (requiere CLI y login)
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

---


**Desarrollado con ❤️ para Grupo Scout**
