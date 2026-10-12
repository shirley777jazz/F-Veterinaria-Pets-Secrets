import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Mascota, MascotaRequest, MascotaEstadisticas } from '../models/mascota';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private apiUrl = 'http://localhost:8080/api/mascotas';

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

  // Obtener todas las mascotas
  obtenerTodasLasMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener mascotas disponibles para adopción
  obtenerMascotasDisponibles(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${this.apiUrl}/disponibles`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener mascota por ID
  obtenerMascotaPorId(id: number): Observable<Mascota> {
    return this.http.get<Mascota>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener mis mascotas (del usuario logueado)
  obtenerMisMascotas(): Observable<Mascota[]> {
    const headers = this.getHttpHeaders();
    return this.http.get<Mascota[]>(`${this.apiUrl}/mis-mascotas`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Crear nueva mascota
  crearMascota(mascota: MascotaRequest): Observable<Mascota> {
    const headers = this.getHttpHeaders();
    return this.http.post<Mascota>(this.apiUrl, mascota, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Actualizar mascota
  actualizarMascota(id: number, mascota: MascotaRequest): Observable<Mascota> {
    const headers = this.getHttpHeaders();
    return this.http.put<Mascota>(`${this.apiUrl}/${id}`, mascota, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Eliminar mascota
  eliminarMascota(id: number): Observable<any> {
    const headers = this.getHttpHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cambiar estado de adopción (solo admin)
  cambiarEstadoAdopcion(id: number, estado: string): Observable<Mascota> {
    const headers = this.getHttpHeaders();
    const params = new HttpParams().set('estado', estado);
    
    return this.http.put<Mascota>(`${this.apiUrl}/${id}/estado`, null, { headers, params })
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
    
    console.error('Error en MascotaService:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Métodos utilitarios
  obtenerNombreEspecie(especie: string): string {
    const especies: { [key: string]: string } = {
      'perro': 'Perro',
      'gato': 'Gato',
      'conejo': 'Conejo',
      'ave': 'Ave',
      'otro': 'Otro'
    };
    return especies[especie] || especie;
  }

  obtenerNombreEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'disponible': 'Disponible',
      'adoptado': 'Adoptado',
      'en_proceso': 'En Proceso',
      'no_disponible': 'No Disponible'
    };
    return estados[estado] || estado;
  }

  obtenerClaseEstado(estado: string): string {
    const clases: { [key: string]: string } = {
      'disponible': 'badge-disponible',
      'adoptado': 'badge-adoptado',
      'en_proceso': 'badge-proceso',
      'no_disponible': 'badge-no-disponible'
    };
    return clases[estado] || 'badge-disponible';
  }
}
