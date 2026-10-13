export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  nombreCompleto: string;
  telefono: string;
  rol: string;
}

export interface MessageResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombreCompleto: string;
  email: string;
  telefono: string;
  password: string;
  rol?: 'usuario' | 'admin';
}