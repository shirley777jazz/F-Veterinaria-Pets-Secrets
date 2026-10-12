import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Interfaces para el frontend
export interface CitaRequest {
  mascotaId: number;
  servicioId: number;
  sedeId: number;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  notas?: string;
}

export interface CitaResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioTelefono: string;
  
  mascotaId: number;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza: string;
  mascotaFotoUrl: string;
  
  servicioId: number;
  servicioNombre: string;
  servicioDescripcion: string;
  servicioPrecio: number;
  
  sedeId: number;
  sedeNombre: string;
  sedeDireccion: string;
  sedeTelefono: string;
  
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas: string;
  fechaCreacion: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
}

export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  ciudad: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Obtener headers con token JWT
  private getHttpHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // **CITAS**

  // Crear nueva cita
  crearCita(citaRequest: CitaRequest): Observable<CitaResponse> {
    const headers = this.getHttpHeaders();
    return this.http.post<CitaResponse>(`${this.apiUrl}/citas`, citaRequest, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener mis citas
  obtenerMisCitas(): Observable<CitaResponse[]> {
    const headers = this.getHttpHeaders();
    return this.http.get<CitaResponse[]>(`${this.apiUrl}/citas/mis-citas`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener citas próximas
  obtenerCitasProximas(): Observable<CitaResponse[]> {
    const headers = this.getHttpHeaders();
    return this.http.get<CitaResponse[]>(`${this.apiUrl}/citas/proximas`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener todas las citas (solo admin)
  obtenerTodasLasCitas(): Observable<CitaResponse[]> {
    const headers = this.getHttpHeaders();
    return this.http.get<CitaResponse[]>(`${this.apiUrl}/citas`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Reprogramar cita
  reprogramarCita(citaId: number, fecha: string, hora: string): Observable<CitaResponse> {
    const headers = this.getHttpHeaders();
    const params = `fecha=${fecha}&hora=${hora}`;
    return this.http.put<CitaResponse>(`${this.apiUrl}/citas/${citaId}/reprogramar?${params}`, {}, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cancelar cita
  cancelarCita(citaId: number): Observable<any> {
    const headers = this.getHttpHeaders();
    return this.http.put(`${this.apiUrl}/citas/${citaId}/cancelar`, {}, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cambiar estado de cita (admin)
  cambiarEstadoCita(citaId: number, nuevoEstado: string): Observable<CitaResponse> {
    const headers = this.getHttpHeaders();
    return this.http.put<CitaResponse>(`${this.apiUrl}/citas/${citaId}/estado`, { estado: nuevoEstado }, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Verificar disponibilidad
  verificarDisponibilidad(fecha: string, hora: string, sedeId: number): Observable<{disponible: boolean, mensaje: string}> {
    const params = `fecha=${fecha}&hora=${hora}&sedeId=${sedeId}`;
    return this.http.get<{disponible: boolean, mensaje: string}>(`${this.apiUrl}/citas/disponibilidad?${params}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // **SERVICIOS**

  // Obtener todos los servicios activos
  obtenerServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/servicios`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // **SEDES**

  // Obtener todas las sedes
  obtenerSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.apiUrl}/sedes`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
  private handleError = (error: any): Observable<never> => {
    console.error('Error en CitaService:', error);
    throw error;
  };
}