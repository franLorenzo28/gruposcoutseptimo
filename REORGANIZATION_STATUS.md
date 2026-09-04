# Reorganización del Ecosistema — Grupo Scout Séptimo

## Estado: CONSOLIDADO (Septiembre 2026)

---

## Mapa Completo de Páginas

### 🌐 SITIO PÚBLICO (/)

| Ruta | Componente | Acceso / Guard | Estado |
|---|---|---|---|
| `/` | Inicio | Público | ✅ En `src/pages/inicio/` |
| `/historia` | Historia | Público | ✅ En `src/pages/historia/` |
| `/linea-temporal` | Redirección a `/historia` | Público | ✅ |
| `/movimiento-scout` | MovimientoScout | Público | ✅ En `src/pages/` |
| `/contacto` | Contacto | Público | ✅ En `src/pages/` |
| `/bauen` | Bauen | Público | ✅ En `src/pages/eventos/` |
| `/eventos` | Eventos | Público | ✅ En `src/pages/eventos/` |
| `/unidades/manada` | Manada | Público | ✅ En `src/pages/ramas/` |
| `/unidades/tropa` | Tropa | Público | ✅ En `src/pages/ramas/` |
| `/unidades/pioneros` | Pioneros | Público | ✅ En `src/pages/ramas/` |
| `/unidades/rovers` | Rovers | Público | ✅ En `src/pages/ramas/` |
| `/unidades/staff` | Staff | Público | ✅ En `src/pages/ramas/` |
| `/unidades/comite` | Comite | Público | ✅ En `src/pages/ramas/` |
| `/verificar-email` | VerificarEmail | Público | ✅ En `src/pages/` |
| `/perfil-public/:id` | PerfilPublic | Público | ✅ En `src/pages/` |
| `/veteranos` | Veteranos | AdminGuard | ✅ En `src/pages/` |
| `/educadores` | DirigEn | AdminGuard | ✅ En `src/pages/` |

### 🔒 SITIO PÚBLICO (auth gated con `RequireAuthenticatedUser`)

| Ruta | Componente | Requisito | Estado |
|---|---|---|---|
| `/archivo` | Archivo | RequireAuthenticatedUser | ✅ |
| `/archivo/scoutpedia` | Scoutpedia | RequireAuthenticatedUser | ✅ |
| `/archivo/compania` | Compania | RequireAuthenticatedUser | ✅ |
| `/archivo/capsula-del-tiempo` | CapsulaTiempo | RequireAuthenticatedUser | ✅ |
| `/archivo/am-lagerfeuer` | AmLagerfeuer | RequireAuthenticatedUser | ✅ |
| `/archivo/locales` | Locales | RequireAuthenticatedUser | ✅ |
| `/cancionero` | Cancionero | RequireAuthenticatedUser | ✅ |
| `/galeria` | Galeria | RequireAuthenticatedUser | ✅ |
| `/eventos/jamborees` | Jamborees | RequireAuthenticatedUser | ✅ |
| `/eventos/jamboree-1981` | Jamboree1981 | RequireAuthenticatedUser | ✅ |
| `/eventos/jamboree-2014` | Jamboree2014 | RequireAuthenticatedUser | ✅ |
| `/eventos/jamboree-2023` | Jamboree2023 | RequireAuthenticatedUser | ✅ |

### 🔐 PLATAFORMA INTERNA (/interno)

| Ruta | Componente | Guard | Estado |
|---|---|---|---|
| `/interno` | Redirección a `/interno/dashboard` | — | ✅ |
| `/interno/auth` | Auth | — | ✅ |
| `/interno/dashboard` | InternalDashboardPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/documentos` | InternalDocumentsPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/anuncios` | InternalAnnouncementsPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/agenda` | InternalCalendarPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/subidas` | InternalUploadsPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/uploads` | Redirección a `/interno/subidas` | RequireMemberAuth | ✅ |
| `/interno/planificacion` | InternalPlanningPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/biblioteca` | InternalLibraryPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/formularios` | InternalFormsPage | RequireMemberAuth | ✅ En `src/app/internal/pages/` |
| `/interno/unidades/:rama` | InternalRamaRoute + PanelRama | RequireRamaAccess | ✅ En `src/pages/miembros/` |
| `/interno/galeria` | Galeria | RequireMemberAuth | ✅ |
| `/interno/narrativas` | Narrativas | RequireMemberAuth | ✅ |
| `/interno/jamborees/*` | Jamborees | RequireMemberAuth | ✅ |
| `/interno/am-lagerfeuer` | AmLagerfeuer | RequireMemberAuth | ✅ |
| `/interno/capsula-tiempo` | ArchivoCapsulaTiempo | RequireMemberAuth | ✅ |
| `/interno/usuarios` | Usuarios (Comuni 7) | RequireMemberAuth | ✅ |
| `/interno/mensajes` | Mensajes | RequireMemberAuth | ✅ |
| `/interno/grupos/:id` | GrupoDetail | RequireMemberAuth | ✅ |
| `/interno/perfil` | PerfilView | RequireApproval | ✅ |
| `/interno/perfil/editar` | Perfil | RequireApproval | ✅ |
| `/interno/configuracion` | Configuracion | RequireApproval | ✅ |

### 🛡️ PANEL ADMIN (/admin)

| Ruta | Componente | Guard | Estado |
|---|---|---|---|
| `/admin` | AdminPanel (overview) | RequireApproval + AdminGuard | ✅ |
| `/admin/usuarios` | AdminPanel (users) | RequireApproval + AdminGuard | ✅ |
| `/admin/solicitudes` | AdminPanel (requests) | RequireApproval + AdminGuard | ✅ |
| `/admin/grupos` | AdminPanel (groups) | RequireApproval + AdminGuard | ✅ |
| `/admin/eventos` | AdminPanel (events) | RequireApproval + AdminGuard | ✅ |
| `/admin/publicaciones` | AdminPanel (threads) | RequireApproval + AdminGuard | ✅ |
| `/admin/mensajes` | AdminPanel (messages) | RequireApproval + AdminGuard | ✅ |
| `/admin/paginas` | AdminPanel (pages) | RequireApproval + AdminGuard | ✅ |

---

## Estado de las Páginas Internas

1. **Uploads** (`/interno/subidas`, alias `/interno/uploads`) — ✅ Completado y enlazado.
2. **Biblioteca Scout** (`/interno/biblioteca`) — ✅ Completado y enlazado en nav y dashboard.
3. **Formularios** (`/interno/formularios`) — ✅ Completado y enlazado en nav y dashboard.
4. **Planificación** (`/interno/planificacion`) — ✅ Completado y enlazado en nav y dashboard.
5. **Paneles de Rama** (`/interno/unidades/:rama`) — ✅ Conectado con `InternalRamaRoute` y `RequireRamaAccess`.

---

## Arquitectura

```
src/
  app/
    layouts/          ← PublicSiteLayout, InternalPlatformLayout, AdminPlatformLayout
    routes/           ← public-routes.tsx, internal-routes.tsx, admin-routes.tsx, compatibility-routes.tsx
    components/       ← InternalPlatformNav, AdminPlatformNav
    internal/         ← Plataforma interna modular
      pages/          ← InternalDashboardPage, InternalDocumentsPage, InternalFormsPage, etc.
      components/     ← InternalPageHeader, etc.
  components/         ← Componentes compartidos + shadcn/ui
  pages/              ← Vistas (migrándose progresivamente)
```

