/**
 * Supabase Logger Suppression Utility
 * Suprime logs de error esperados (403 RLS, etc) sin afectar funcionalidad
 */

/**
 * Ejecuta una función Supabase con logs de error suprimidos
 * Útil para queries que pueden fallar por RLS pero no son críticas
 */
export async function silenceSupabaseErrors<T>(
  fn: () => Promise<T>,
  options: { suppressConsoleError?: boolean; suppressWarnings?: boolean } = {}
): Promise<T> {
  const { suppressConsoleError = true, suppressWarnings = false } = options;

  if (!suppressConsoleError) {
    return fn();
  }

  // Guardar referencias originales
  const originalError = console.error;
  const originalWarn = console.warn;

  try {
    // Suprimir console.error temporalmente
    console.error = (...args: any[]) => {
      // Permitir errores que no sean de Supabase/red
      const message = String(args[0] || '');
      const isSupabaseError = message.includes('403') || 
                             message.includes('Forbidden') || 
                             message.includes('RLS') ||
                             message.includes('row level security') ||
                             message.includes('policy') ||
                             (args[1] && String(args[1]).includes('Supabase'));
      
      if (!isSupabaseError) {
        originalError.apply(console, args);
      }
    };

    if (suppressWarnings) {
      console.warn = (...args: any[]) => {
        const message = String(args[0] || '');
        const isSupabaseWarning = message.includes('403') || message.includes('Supabase');
        if (!isSupabaseWarning) {
          originalWarn.apply(console, args);
        }
      };
    }

    return await fn();
  } finally {
    // Restaurar consola original
    console.error = originalError;
    console.warn = originalWarn;
  }
}

/**
 * Wrapper para queries de Supabase que pueden fallar sin ser críticas
 * Acepta cualquier cosa awaitable (Promise, PostgrestFilterBuilder, etc)
 */
export async function querySilent<T extends { data: any; error: any }>(
  queryFn: () => Promise<T> | PromiseLike<T>
): Promise<T> {
  return silenceSupabaseErrors(
    async () => queryFn() as Promise<T>,
    { suppressConsoleError: true }
  );
}
