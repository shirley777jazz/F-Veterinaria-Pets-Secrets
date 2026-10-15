import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// Configuración de ambiente directa
const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};

// Interfaces para el backend
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagenUrl?: string;
  estado: string;
  fechaCreacion: string;
  categoria: Categoria;
}

export interface ProductoRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagenUrl?: string;
  estado?: string;
  categoriaId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helper para headers con token JWT en peticiones JSON
  private getHttpHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('authToken') || localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Helper para headers con token JWT en subida de archivos (FormData)
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken() || localStorage.getItem('authToken') || localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Métodos para productos
  getAllProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/productos`);
  }

  getProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/productos/activos`);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/productos/${id}`);
  }

  getProductosByCategoria(categoriaId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/productos/categoria/${categoriaId}`);
  }

  buscarProductos(nombre: string): Observable<Producto[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Producto[]>(`${this.baseUrl}/productos/buscar`, { params });
  }

  getProductosByPrecioRange(precioMin: number, precioMax: number): Observable<Producto[]> {
    const params = new HttpParams()
      .set('precioMin', precioMin.toString())
      .set('precioMax', precioMax.toString());
    return this.http.get<Producto[]>(`${this.baseUrl}/productos/precio-rango`, { params });
  }

  crearProducto(request: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}/productos`, request, { headers: this.getHttpHeaders() });
  }

  actualizarProducto(id: number, request: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id}`, request, { headers: this.getHttpHeaders() });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productos/${id}`, { headers: this.getHttpHeaders() });
  }

  actualizarStock(id: number, stock: number): Observable<Producto> {
    const params = new HttpParams().set('stock', stock.toString());
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id}/stock`, null, { params, headers: this.getHttpHeaders() });
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    const params = new HttpParams().set('estado', estado);
    return this.http.patch(`${this.baseUrl}/productos/${id}/estado`, null, { params, headers: this.getHttpHeaders() });
  }

  // Métodos para manejo de archivos
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/files/upload-image`, formData, { headers: this.getAuthHeaders() });
  }

  deleteImage(filename: string): Observable<any> {
    const params = new HttpParams().set('filename', filename);
    return this.http.delete(`${this.baseUrl}/files/delete-image`, { params, headers: this.getHttpHeaders() });
  }

  // Métodos para categorías
  getAllCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  getCategoriaById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/categorias/${id}`);
  }

  crearCategoria(request: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.baseUrl}/categorias`, request, { headers: this.getHttpHeaders() });
  }

  actualizarCategoria(id: number, request: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, request, { headers: this.getHttpHeaders() });
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categorias/${id}`, { headers: this.getHttpHeaders() });
  }

  buscarCategorias(nombre: string): Observable<Categoria[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias/buscar`, { params });
  }
}