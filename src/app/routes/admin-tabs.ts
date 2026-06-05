export const adminTabRouteMap = {
  overview: "/admin",
  users: "/admin/usuarios",
  requests: "/admin/solicitudes",
  groups: "/admin/grupos",
  events: "/admin/eventos",
  threads: "/admin/publicaciones",
  messages: "/admin/mensajes",
  pages: "/admin/paginas",
} as const;

export type AdminDashboardTab = keyof typeof adminTabRouteMap;
