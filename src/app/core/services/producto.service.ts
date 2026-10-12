import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

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
    return this.http.post<Producto>(`${this.baseUrl}/productos`, request);
  }

  actualizarProducto(id: number, request: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id}`, request);
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productos/${id}`);
  }

  actualizarStock(id: number, stock: number): Observable<Producto> {
    const params = new HttpParams().set('stock', stock.toString());
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id}/stock`, null, { params });
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    const params = new HttpParams().set('estado', estado);
    return this.http.patch(`${this.baseUrl}/productos/${id}/estado`, null, { params });
  }

  // Métodos para manejo de archivos
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/files/upload-image`, formData);
  }

  deleteImage(filename: string): Observable<any> {
    const params = new HttpParams().set('filename', filename);
    return this.http.delete(`${this.baseUrl}/files/delete-image`, { params });
  }

  // Métodos para categorías
  getAllCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  getCategoriaById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/categorias/${id}`);
  }

  crearCategoria(request: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.baseUrl}/categorias`, request);
  }

  actualizarCategoria(id: number, request: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/categorias/${id}`, request);
  }

  eliminarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categorias/${id}`);
  }

  buscarCategorias(nombre: string): Observable<Categoria[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias/buscar`, { params });
  }
}