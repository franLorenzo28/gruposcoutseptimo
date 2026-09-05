/**
 * Utilidades para detectar y manejar diferentes entornos de ejecución
 */

export type Environment = "development" | "staging" | "production";

/**
 * Obtener el entorno actual
 */
export function getEnvironment(): Environment {
  const env = import.meta.env.VITE_ENV as Environment;
  return env || "development";
}

/**
 * Verificar si estamos en desarrollo
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Verificar si estamos en staging
 */
export function isStaging(): boolean {
  return getEnvironment() === "staging";
}

/**
 * Verificar si estamos en producción
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Verificar si las dev tools deben estar habilitadas
 */
export function isDevToolsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_DEVTOOLS === "true";
}

/**
 * Verificar si el logging debe estar habilitado
 */
export function isLoggingEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_LOGGING === "true";
}

/**
 * Verificar si el modo debug está habilitado
 */
export function isDebugEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_DEBUG === "true";
}

/**
 * Obtener la URL del backend según el entorno
 */
export function getBackendURL(): string {
  return import.meta.env.VITE_API_BASE || "http://localhost:4000";
}

/**
 * Obtener configuración del entorno actual
 */
export function getEnvConfig() {
  return {
    environment: getEnvironment(),
    isDev: isDevelopment(),
    isStaging: isStaging(),
    isProd: isProduction(),
    backendURL: getBackendURL(),
    backendMode: import.meta.env.VITE_BACKEND || "supabase",
    features: {
      devtools: isDevToolsEnabled(),
      logging: isLoggingEnabled(),
      debug: isDebugEnabled(),
    },
  };
}

/**
 * Log de configuración del entorno (solo en desarrollo)
 */
export function logEnvConfig() {
  if (isDevelopment()) {
    console.log("🌍 Environment Configuration:", getEnvConfig());
  }
}
