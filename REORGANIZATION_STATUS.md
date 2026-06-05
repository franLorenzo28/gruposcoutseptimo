# Reorganización del Ecosistema — Grupo Scout Séptimo

## Estado: EN PROGRESO (Mayo 2026)

---

## Mapa Completo de Páginas

### 🌐 SITIO PÚBLICO (/) — 22 páginas

| Ruta | Componente | Estado |
|---|---|---|
| `/` | Inicio | ✅ En `src/pages/inicio/` |
| `/narrativas` | Narrativas | ✅ En `src/pages/narrativas/` |
| `/historia` | Historia | ✅ En `src/pages/historia/` |
| `/movimiento-scout` | MovimientoScout | ✅ En `src/pages/` |
| `/contacto` | Contacto | ✅ En `src/pages/` |
| `/unidades/manada` | Manada | ✅ En `src/pages/ramas/` |
| `/unidades/tropa` | Tropa | ✅ En `src/pages/ramas/` |
| `/unidades/pioneros` | Pioneros | ✅ En `src/pages/ramas/` |
| `/unidades/rovers` | Rovers | ✅ En `src/pages/ramas/` |
| `/unidades/staff` | Staff | ✅ En `src/pages/ramas/` |
| `/unidades/comite` | Comite | ✅ En `src/pages/ramas/` |
| `/eventos` | Eventos | ✅ En `src/pages/eventos/` |
| `/eventos/jamborees` | Jamborees | ✅ En `src/pages/eventos/` |
| `/eventos/jamboree-1981` | Jamboree1981 | ✅ En `src/pages/eventos/` |
| `/eventos/jamboree-2014` | Jamboree2014 | ✅ En `src/pages/eventos/` |
| `/eventos/jamboree-2023` | Jamboree2023 | ✅ En `src/pages/eventos/` |
| `/bauen` | Bauen | ✅ En `src/pages/eventos/` |
| `/galeria` | Galeria | ✅ En `src/pages/galeria/` |
| `/cancionero` | Cancionero | ✅ En `src/pages/` |
| `/auth` | Auth | ✅ En `src/pages/` |
| `/verificar-email` | VerificarEmail | ✅ En `src/pages/` |
| `/perfil-public/:id` | PerfilPublic | ✅ En `src/pages/` |

### 🔒 SITIO PÚBLICO (auth gated) — 6 páginas

| Ruta | Componente | Requisito |
|---|---|---|
| `/archivo` | Archivo | RequireAuthenticatedUser |
| `/archivo/scoutpedia` | Scoutpedia | RequireAuthenticatedUser |
| `/archivo/compania` | Compania | RequireAuthenticatedUser |
| `/archivo/capsula-del-tiempo` | CapsulaTiempo | RequireAuthenticatedUser |
| `/archivo/am-lagerfeuer` | AmLagerfeuer | RequireAuthenticatedUser |
| `/archivo/locales` | Locales | RequireAuthenticatedUser |

### 🔐 PLATAFORMA INTERNA (/interno) — 14 rutas

| Ruta | Componente | Estado |
|---|---|---|
| `/interno` | AreaMiembros | ✅ En `src/pages/miembros/` |

| `/interno/dashboard` | InternalDashboardPage | ✅ En `src/app/internal/pages/` |
| `/interno/documentos` | InternalDocumentsPage | ✅ En `src/app/internal/pages/` |
| `/interno/anuncios` | InternalAnnouncementsPage | ✅ En `src/app/internal/pages/` |
| `/interno/agenda` | InternalCalendarPage | ✅ En `src/app/internal/pages/` |
| `/interno/unidades/:rama` | PanelRama | ✅ En `src/pages/miembros/` |
| `/interno/perfil` | PerfilView | ✅ En `src/pages/` |
| `/interno/perfil/editar` | Perfil | ✅ En `src/pages/` |
| `/interno/configuracion` | Configuracion | ✅ En `src/pages/` |
| `/interno/mensajes` | Mensajes | ✅ En `src/pages/` |

### 🛡️ PANEL ADMIN (/admin) — 8 rutas

| Ruta | Componente | Estado |
|---|---|---|
| `/admin` | AdminPanel (overview) | ✅ En `src/pages/` |
| `/admin/usuarios` | AdminPanel (users) | ✅ |
| `/admin/solicitudes` | AdminPanel (requests) | ✅ |
| `/admin/grupos` | AdminPanel (groups) | ✅ |
| `/admin/eventos` | AdminPanel (events) | ✅ |
| `/admin/publicaciones` | AdminPanel (threads) | ✅ |
| `/admin/mensajes` | AdminPanel (messages) | ✅ |
| `/admin/paginas` | AdminPanel (pages) | ✅ |

### 📋 PÁGINAS HÍBRIDAS — 2 páginas

| Ruta | Componente | Nota |
|---|---|---|
| `/usuarios` (Comuni 7) | Usuarios | Social hub público con auth gating |
| `/grupos/:id` | GrupoDetail | Chat grupal con auth gating |

---

## Páginas Internas Faltantes (por crear)

Estas son las que el usuario solicita pero no existen todavía:

1. **Uploads** (`/interno/uploads`) — Subida y gestión de archivos
2. **Biblioteca Scout** (`/interno/biblioteca`) — Material educativo, guías, manuales
3. **Formularios** (`/interno/formularios`) — Formularios internos del grupo
4. **Planificación** (`/interno/planificacion`) — Planificación de actividades y ciclo de programa
5. **Materiales Educativos** (`/interno/materiales`) — Recursos para educadores

---

## Arquitectura Target

```
src/
  app/
    public/           ← Sitio público institucional
      pages/          ← Páginas del sitio público
      components/     ← Componentes específicos del sitio público
      layouts/        ← PublicSiteLayout + variantes
    internal/         ← Plataforma interna
      pages/          ← Páginas internas
      components/     ← Componentes específicos del interno
      layouts/        ← InternalPlatformLayout
    admin/            ← Panel administrativo
      pages/          ← Páginas admin
      components/     ← Componentes específicos del admin
      layouts/        ← AdminPlatformLayout
    routes/           ← Definiciones de rutas (ya existen)
    components/       ← Componentes de navegación compartidos (ya existen)
  components/         ← Componentes compartidos + shadcn/ui
  pages/              ← Legacy (se migra progresivamente)
```
