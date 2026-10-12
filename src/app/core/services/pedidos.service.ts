import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface PedidoItem {
  id: number;
  productoId: number;
  productoNombre: string;
  productoImagenUrl: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoDetalle {
  id: number;
  codigo: string;
  usuarioId: number;
  usuarioNombre?: string;
  usuarioEmail?: string;
  fechaPedido: string;
  estado: string;
  subtotal: number;
  envio: number;
  total: number;
  direccion: string;
  ciudad?: string;
  codigoPostal?: string;
  telefonoContacto: string;
  metodoPago: string;
  fechaEntrega?: string;
  detalles: PedidoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private baseUrl = 'http://localhost:8080/api/pedidos';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los pedidos del usuario logueado
  obtenerMisPedidos(): Observable<PedidoDetalle[]> {
    return this.http.get<PedidoDetalle[]>(`${this.baseUrl}/mis-pedidos`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error al obtener mis pedidos:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener un pedido específico por ID
  obtenerPedidoPorId(pedidoId: number): Observable<PedidoDetalle> {
    return this.http.get<PedidoDetalle>(`${this.baseUrl}/${pedidoId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error al obtener pedido:', error);
        return throwError(() => error);
      })
    );
  }

  // Cancelar un pedido (si está permitido)
  cancelarPedido(pedidoId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${pedidoId}/cancelar`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error al cancelar pedido:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener estados de pedido para filtros
  getEstadosPedido(): string[] {
    return ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];
  }

  // Método auxiliar para formatear fechas
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    // Si es string en formato YYYY-MM-DD, crear fecha sin problemas de zona horaria
    if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = fecha.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    }
    
    // Si es string en formato ISO, extraer solo la fecha
    if (typeof fecha === 'string' && fecha.includes('T')) {
      const fechaSolo = fecha.split('T')[0];
      const [year, month, day] = fechaSolo.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Para otros casos, usar directamente pero sin hora para evitar problemas
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Método auxiliar para obtener color del estado
  getColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': '#f59e0b',
      'CONFIRMADO': '#3b82f6', 
      'EN_PREPARACION': '#8b5cf6',
      'ENVIADO': '#06b6d4',
      'ENTREGADO': '#10b981',
      'CANCELADO': '#ef4444'
    };
    return colores[estado.toUpperCase()] || '#6b7280';
  }

  // Método auxiliar para verificar si un pedido se puede cancelar
  puedeSerCancelado(estado: string): boolean {
    return ['PENDIENTE', 'CONFIRMADO'].includes(estado.toUpperCase());
  }
}