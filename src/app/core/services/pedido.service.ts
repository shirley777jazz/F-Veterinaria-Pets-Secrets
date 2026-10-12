import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PedidoRequest, PedidoResponse } from '../models/pedido';

// Configuración de environment
const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private baseUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // Crear un nuevo pedido
  crearPedido(pedidoData: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${this.baseUrl}/crear-desde-carrito`, pedidoData, {
      headers: this.getHeaders()
    });
  }

  // Obtener pedidos del usuario actual
  obtenerPedidosUsuario(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.baseUrl}/usuario`, {
      headers: this.getHeaders()
    });
  }

  // Obtener un pedido específico por ID
  obtenerPedidoPorId(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Actualizar estado del pedido (solo para admin)
  actualizarEstadoPedido(id: number, estado: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.baseUrl}/${id}/estado`, { estado }, {
      headers: this.getHeaders()
    });
  }

  // Cancelar pedido
  cancelarPedido(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}/cancelar`, {}, {
      headers: this.getHeaders()
    });
  }
}