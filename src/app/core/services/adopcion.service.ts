import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface AdopcionRequest {
  mascotaId: number;
  experienciaMascotas: string;
  tipoVivienda: string;
  otrasMascotas: string;
  horarioTrabajo: string;
  motivoAdopcion: string;
  contactoEmergencia: string;
  veterinarioReferencia: string;
  aceptaCondiciones: boolean;
  aceptaVisita: boolean;
}

export interface AdopcionResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  mascotaId: number;
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza: string;
  mascotaFotoUrl: string;
  fechaSolicitud: string;
  fechaAprobacion?: string;
  estado: string;
  experienciaMascotas: string;
  tipoVivienda: string;
  otrasMascotas: string;
  horarioTrabajo: string;
  motivoAdopcion: string;
  contactoEmergencia: string;
  veterinarioReferencia: string;
  aceptaCondiciones: boolean;
  aceptaVisita: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdopcionService {
  private apiUrl = 'http://localhost:8080/api/adopciones';

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

  // Enviar solicitud de adopción
  enviarSolicitud(solicitud: AdopcionRequest): Observable<AdopcionResponse> {
    const headers = this.getHttpHeaders();
    return this.http.post<AdopcionResponse>(this.apiUrl, solicitud, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener mis solicitudes (del usuario logueado)
  obtenerMisSolicitudes(): Observable<AdopcionResponse[]> {
    const headers = this.getHttpHeaders();
    return this.http.get<AdopcionResponse[]>(`${this.apiUrl}/mis-solicitudes`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener todas las solicitudes (solo admin)
  obtenerTodasLasSolicitudes(): Observable<AdopcionResponse[]> {
    const headers = this.getHttpHeaders();
    return this.http.get<AdopcionResponse[]>(this.apiUrl, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Actualizar estado de solicitud (solo admin)
  actualizarEstadoSolicitud(id: number, estado: string, comentario?: string): Observable<AdopcionResponse> {
    const headers = this.getHttpHeaders();
    const body = { estado, comentarioAdmin: comentario };
    return this.http.put<AdopcionResponse>(`${this.apiUrl}/${id}/estado`, body, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener solicitud por ID
  obtenerSolicitudPorId(id: number): Observable<AdopcionResponse> {
    const headers = this.getHttpHeaders();
    return this.http.get<AdopcionResponse>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Error en AdopcionService:', error);
    return throwError(() => new Error(errorMessage));
  }
}