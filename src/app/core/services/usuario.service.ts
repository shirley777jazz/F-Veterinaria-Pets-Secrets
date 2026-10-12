import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserResponse, UpdateUserRequest } from '../models/user-models';
import { RegisterRequest, MessageResponse } from '../models/api-responses';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_URL = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    const token = localStorage.getItem('authToken');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      })
    };
  }

  // Obtener todos los usuarios
  obtenerUsuarios(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.API_URL, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('Error al obtener usuarios:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener usuario por ID
  obtenerUsuarioPorId(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API_URL}/${id}`, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('Error al obtener usuario:', error);
          return throwError(() => error);
        })
      );
  }

  // Crear nuevo usuario
  crearUsuario(usuario: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.API_URL, usuario, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('Error al crear usuario:', error);
          return throwError(() => error);
        })
      );
  }

  // Actualizar usuario
  actualizarUsuario(id: number, usuario: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.API_URL}/${id}`, usuario, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('Error al actualizar usuario:', error);
          return throwError(() => error);
        })
      );
  }

  // Eliminar usuario
  eliminarUsuario(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.API_URL}/${id}`, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('Error al eliminar usuario:', error);
          return throwError(() => error);
        })
      );
  }
}