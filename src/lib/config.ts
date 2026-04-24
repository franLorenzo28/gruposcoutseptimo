/**
 * Configuración global de la aplicación
 * Centraliza todas las configuraciones y constantes
 */

import {
  getEnvironment,
  getBackendURL,
  isDevelopment,
  isProduction,
} from "./env";

export const config = {
  // Información de la aplicación
  app: {
    name: "Grupo Scout Séptimo",
    shortName: "GS7",
    description: "Sitio oficial del Grupo Scout Séptimo - Montevideo, Uruguay",
    version: "2.0.0",
    author: "Grupo Scout Séptimo",
  },

  // URLs
  urls: {
    backend: getBackendURL(),
    supabase: import.meta.env.VITE_SUPABASE_URL || "",
    website: isDevelopment()
      ? "http://localhost:5173"
      : "https://gruposcoutseptimo.vercel.app",
  },

  // API Keys
  keys: {
    supabase: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    googleMaps: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    analytics: import.meta.env.VITE_GOOGLE_ANALYTICS_ID || "",
    sentry: import.meta.env.VITE_SENTRY_DSN || "",
  },

  // Features flags
  features: {
    devtools: import.meta.env.VITE_ENABLE_DEVTOOLS === "true",
    logging: import.meta.env.VITE_ENABLE_LOGGING === "true",
    debug: import.meta.env.VITE_ENABLE_DEBUG === "true",
    analytics: isProduction() && !!import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    errorTracking: isProduction() && !!import.meta.env.VITE_SENTRY_DSN,
  },

  // Configuración de UI
  ui: {
    // Tema por defecto
    defaultTheme: "system" as "light" | "dark" | "system",

    // Breakpoints (debe coincidir con Tailwind)
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536,
    },

    // Animaciones
    animations: {
      duration: {
        fast: 150,
        normal: 300,
        slow: 500,
      },
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },

    // Límites
    limits: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxImageWidth: 2000,
      maxImageHeight: 2000,
      messageLength: 2000,
      bioLength: 500,
      usernameLength: 30,
    },
  },

  // Configuración de la API
  api: {
    timeout: 30000, // 30 segundos
    retries: 2,
    retryDelay: 1000,
  },

  // Configuración de cache
  cache: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  },

  // Redes sociales (opcional)
  social: {
    facebook: "https://www.facebook.com/gruposcoutseptimomontevideo",
    instagram: "https://www.instagram.com/grupo_scout_septimo/",
    twitter: "https://twitter.com/gruposcout7",
    email: "contacto@gruposcout7.com",
  },

  // Información de contacto
  contact: {
    email: "contacto@gruposcout7.com",
    phone: "+598 09X XXX XXX",
    address: "Montevideo, Uruguay",
    coordinates: {
      lat: -34.9011, // Coordenadas de Montevideo
      lng: -56.1645,
    },
  },

  // Entorno actual
  environment: getEnvironment(),
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
} as const;

// Helper para obtener una URL completa
export function getFullUrl(path: string): string {
  return `${config.urls.website}${path}`;
}

// Helper para verificar si una feature está habilitada
export function isFeatureEnabled(
  feature: keyof typeof config.features,
): boolean {
  return config.features[feature];
}

// Exportar configuración por defecto
export default config;
