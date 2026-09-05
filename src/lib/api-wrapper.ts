/** @deprecated Import `apiFetch` and `BackendError` from `@/lib/backend`. */
import { apiFetch, BackendError, type ApiFetchOptions } from "@/lib/backend";

export class APIError extends BackendError {
  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message, status ?? 0, code ?? "REQUEST_FAILED", undefined, details);
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  getUserMessage(): string {
    if (this.isNetworkError()) return "No se pudo conectar al servidor. Verifica tu conexión a internet.";
    if (this.isAuthError()) return "Tu sesión ha expirado. Inicia sesión nuevamente.";
    if (this.isServerError()) return "Error del servidor. Intenta nuevamente más tarde.";
    return this.message || "Ocurrió un error inesperado.";
  }
}

export async function apiRequest<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  try {
    return await apiFetch<T>(endpoint, options);
  } catch (error) {
    if (error instanceof BackendError) {
      throw new APIError(error.message, error.status, error.code, {
        requestId: error.requestId,
        details: error.details,
      });
    }
    throw error;
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiFetchOptions) => apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, data?: unknown, options?: ApiFetchOptions) => apiRequest<T>(endpoint, { ...options, method: "POST", body: data === undefined ? undefined : JSON.stringify(data) }),
  put: <T = any>(endpoint: string, data?: unknown, options?: ApiFetchOptions) => apiRequest<T>(endpoint, { ...options, method: "PUT", body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T = any>(endpoint: string, data?: unknown, options?: ApiFetchOptions) => apiRequest<T>(endpoint, { ...options, method: "PATCH", body: data === undefined ? undefined : JSON.stringify(data) }),
  delete: <T = any>(endpoint: string, options?: ApiFetchOptions) => apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
