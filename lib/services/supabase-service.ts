// ============================================================
// supabase-service.ts - Servicio base
// ServiceError unificado + helpers para Supabase
// ============================================================

// ============================================================
// ServiceError - Error unificado para toda la capa de servicios
// ============================================================

export class ServiceError extends Error {
  public readonly code: string;
  public readonly details: string | null;

  constructor(code: string, message: string, details: string | null = null) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.details = details;
  }
}

// ============================================================
// fromSupabase - Helper para wrappear respuestas de Supabase
// ============================================================

interface SupabaseResponse<T> {
  data: T | null;
  error: {
    code?: string;
    message: string;
    details?: string;
  } | null;
}

/**
 * Procesa una respuesta de Supabase para UNA SOLA fila (.single())
 */
export async function fromSupabaseSingle<T>(
  query: PromiseLike<SupabaseResponse<T>>
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    throw new ServiceError(
      error.code || "DB_ERROR",
      error.message,
      error.details ?? null
    );
  }

  if (data === null || data === undefined) {
    throw new ServiceError("NOT_FOUND", "El recurso solicitado no existe.");
  }

  return data;
}

/**
 * Procesa una respuesta de Supabase que devuelve MULTIPLES filas
 */
export async function fromSupabaseList<T>(
  query: PromiseLike<SupabaseResponse<T[]>>
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    throw new ServiceError(
      error.code || "DB_ERROR",
      error.message,
      error.details ?? null
    );
  }

  return data ?? [];
}