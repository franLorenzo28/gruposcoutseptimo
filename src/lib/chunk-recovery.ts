const RELOAD_KEY = "grupo7_chunk_reload_build";

// Vite replaces this with the URL of the emitted module, including its build hash.
const BUILD_URL = import.meta.url;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|Unable to preload CSS/i.test(message);
}

export function reloadPage(): void {
  // Keep the current route, query and hash while obtaining the latest entry point.
  window.location.reload();
}

export function recoverChunkLoad(error: unknown): boolean {
  if (!isChunkLoadError(error) || !window.navigator.onLine) return false;

  try {
    if (window.sessionStorage.getItem(RELOAD_KEY) === BUILD_URL) return false;
    // Persist BEFORE reloading. Never reset on mount: that would cause reload loops.
    window.sessionStorage.setItem(RELOAD_KEY, BUILD_URL);
  } catch {
    // Without persistent storage, automatic reloads cannot be safely bounded.
    return false;
  }

  reloadPage();
  return true;
}

export function installChunkRecovery(): () => void {
  const onPreloadError = (event: Event) => {
    recoverChunkLoad((event as Event & { payload: unknown }).payload);
    // Let the error boundary handle persistent/offline/unrelated failures.
  };

  window.addEventListener("vite:preloadError", onPreloadError);
  return () => window.removeEventListener("vite:preloadError", onPreloadError);
}
