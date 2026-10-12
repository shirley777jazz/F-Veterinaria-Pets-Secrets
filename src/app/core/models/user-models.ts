export interface UserResponse {
  id: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  rol: string;
  fechaRegistro: string;
}

export interface UpdateUserRequest {
  nombreCompleto: string;
  email: string;
  telefono: string;
  rol: 'usuario' | 'admin';
  password?: string;
}