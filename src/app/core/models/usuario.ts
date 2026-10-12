export interface Usuario {
  id: number;
  nombreCompleto: string;  // Cambio: nombre -> nombreCompleto para consistencia con backend
  email: string;
  telefono: string;
  password?: string;  // Cambio: opcional por seguridad
  rol: 'usuario' | 'admin';  // Cambio: requerido
  fechaRegistro?: string;  // Nuevo: para compatibilidad con backend
}

// Re-exportar interfaces del backend para compatibilidad
export type { UserResponse, UpdateUserRequest } from './user-models';