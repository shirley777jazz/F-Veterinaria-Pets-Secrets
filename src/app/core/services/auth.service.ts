import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario';
import { LoginRequest, RegisterRequest, LoginResponse, MessageResponse } from '../models/api-responses';

type AuthState = { isLoggedIn: boolean; user: Usuario | null };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  
  // Claves de storage
  private readonly KEY_LOGGED = 'logueado';
  private readonly KEY_USER_ACTIVE = 'usuarioActivo';
  private readonly KEY_TOKEN = 'authToken';
  private readonly KEY_REDIRECT = 'redirectAfterLogin';

  // Estado reactivo
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private authStateSubject = new BehaviorSubject<AuthState>({ isLoggedIn: false, user: null });
  public authState$ = this.authStateSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    this.bootstrapFromStorage();
  }

  /** Lee de localStorage y sincroniza estado */
  private bootstrapFromStorage(): void {
    const isLoggedIn = localStorage.getItem(this.KEY_LOGGED) === 'true';
    const rawUser = localStorage.getItem(this.KEY_USER_ACTIVE);

    if (isLoggedIn && rawUser) {
      const user = this.safeParse(rawUser);
      if (user) {
        this.pushState(true, this.normalizeUser(user));
        return;
      }
    }
    
    // Si no hay datos válidos, limpiar todo
    this.pushState(false, null);
  }

  /** Normaliza cualquier objeto a Usuario válido (crea id si falta) */
  private normalizeUser(u: any): Usuario {
    const id: number =
      typeof u?.id === 'number' ? u.id :
      Number(localStorage.getItem('usuario_id_seq')) ||
      Date.now();

    // si generamos id por primera vez, dejamos una semilla sencilla
    if (typeof u?.id !== 'number') {
      localStorage.setItem('usuario_id_seq', String(id));
    }

    const user: Usuario = {
      id,
      nombreCompleto: u?.nombreCompleto ?? u?.nombre ?? u?.name ?? 'Usuario',
      email: u?.email ?? 'sin-correo@example.com',
      telefono: u?.telefono ?? u?.phone ?? '',
      password: u?.password ?? '',
      rol: u?.rol ?? 'usuario',
      fechaRegistro: u?.fechaRegistro ?? new Date().toISOString()
    };
    return user;
  }

  private safeParse(str: string): any | null {
    try { return JSON.parse(str); } catch { return null; }
  }

  /** Persiste login + usuario en storage coherente */
  private persistAuth(isLoggedIn: boolean, user: Usuario | null, token?: string): void {
    localStorage.setItem(this.KEY_LOGGED, String(isLoggedIn));
    if (user) {
      localStorage.setItem(this.KEY_USER_ACTIVE, JSON.stringify(user));
      if (token) {
        localStorage.setItem(this.KEY_TOKEN, token);
      }
    } else {
      localStorage.removeItem(this.KEY_USER_ACTIVE);
      localStorage.removeItem(this.KEY_TOKEN);
    }
  }

  /** Emite a ambos subjects para mantener compatibilidad */
  private pushState(isLoggedIn: boolean, user: Usuario | null): void {
    this.currentUserSubject.next(user);
    this.authStateSubject.next({ isLoggedIn, user });
  }

  /** Sincroniza desde storage hacia subjects */
  private updateAuthState(): void {
    const isLogged = this.isLoggedIn();
    const user = this.getCurrentUser();
    this.pushState(isLogged, user);
  }

  // ----------------- API pública -----------------

  isLoggedIn(): boolean {
    return localStorage.getItem(this.KEY_LOGGED) === 'true';
  }

  getCurrentUser(): Usuario | null {
    const str = localStorage.getItem(this.KEY_USER_ACTIVE);
    return str ? this.normalizeUser(this.safeParse(str)) : null;
  }

  /** Login con backend */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };
    
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap((response: any) => {
          const user = this.mapResponseToUser(response);
          this.persistAuth(true, user, response.token);
          this.pushState(true, user);
        }),
        catchError((error: any) => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  /** Registro con backend */
  register(registerData: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/register`, registerData)
      .pipe(
        catchError((error: any) => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  private mapResponseToUser(response: any): Usuario {
    return {
      id: response.id,
      nombreCompleto: response.nombreCompleto,
      email: response.email,
      telefono: response.telefono,
      password: '',
      rol: response.rol as 'usuario' | 'admin',
      fechaRegistro: response.fechaRegistro || new Date().toISOString()
    };
  }

  /** Permite login con un objeto "libre" (registro manual, formularios diversos) */
  loginWithLocalUser(user: any): void {
    const normalized = this.normalizeUser(user);
    this.persistAuth(true, normalized);
    this.updateAuthState();
  }

  /** Login directo cuando ya tienes un Usuario o parcial (compat con componentes) */
  setLoggedIn(user: any): void {
    const normalized = this.normalizeUser(user);
    this.persistAuth(true, normalized);
    this.updateAuthState();
  }

  /** Protege rutas; si no está logueado, guarda redirect y navega a /login */
  requireAuth(redirectTo?: string): boolean {
    if (this.isLoggedIn()) return true;
    if (redirectTo) localStorage.setItem(this.KEY_REDIRECT, redirectTo);
    this.router.navigate(['/login']);
    return false;
  }

  getRedirectAfterLogin(): string | null {
    return localStorage.getItem(this.KEY_REDIRECT);
  }

  clearRedirectAfterLogin(): void {
    localStorage.removeItem(this.KEY_REDIRECT);
  }

  /** Actualización parcial del usuario (perfil) */
  updateUser(userData: Partial<Usuario>): void {
    const current = this.getCurrentUser();
    if (!current) return;
    const updated = this.normalizeUser({ ...current, ...userData });
    this.persistAuth(true, updated);
    this.updateAuthState();
  }

  /** Actualización del perfil con llamada HTTP al backend */
  updateProfile(userData: Partial<Usuario>): Observable<Usuario> {
    const current = this.getCurrentUser();
    if (!current) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }

    // Construir objeto solo con campos válidos
    const updateData: any = {
      nombreCompleto: userData.nombreCompleto?.trim(),
      email: userData.email?.trim(),
      telefono: userData.telefono?.trim()
    };

    // Solo incluir password si se proporciona y no está vacío
    if (userData.password && userData.password.trim().length > 0) {
      updateData.password = userData.password.trim();
    }

    // Remover campos undefined o vacíos
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    });

    console.log('Enviando datos de actualización:', updateData);

    return this.http.put<any>(`http://localhost:8080/api/usuarios/${current.id}`, updateData, { headers })
      .pipe(
        tap((response: any) => {
          // El backend devuelve un UserResponse, extraemos el usuario
          const updatedUser = response.usuario || response;
          const normalized = this.normalizeUser(updatedUser);
          const token = this.getToken();
          this.persistAuth(true, normalized, token || undefined);
          this.updateAuthState();
        }),
        catchError(error => {
          console.error('Error updating profile:', error);
          return throwError(() => error);
        })
      );
  }

  /** Obtener token de autenticación */
  getToken(): string | null {
    return localStorage.getItem(this.KEY_TOKEN);
  }

  /** Cierra sesión y redirige a /login */
  logout(): void {
    this.persistAuth(false, null);
    this.clearRedirectAfterLogin();
    this.updateAuthState();
    this.router.navigate(['/login']);
  }
}

