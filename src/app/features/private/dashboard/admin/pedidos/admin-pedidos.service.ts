import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../../../core/services/auth.service';
import { PedidoDetalle } from '../../../../../core/services/pedidos.service';

export interface PedidoEstadisticas {
  totalPedidos: number;
  pendiente: number;
  procesando: number;
  enviado: number;
  entregado: number;
  cancelado: number;
  valorTotal: number;
}

export interface FiltrosPedidos {
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPedidosService {
  private baseUrl = 'http://localhost:8080/api/pedidos';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Obtener todos los pedidos (admin)
  obtenerTodosLosPedidos(): Observable<PedidoDetalle[]> {
    console.log('=== SERVICIO: Obteniendo todos los pedidos ===');
    console.log('URL:', this.baseUrl);
    
    return this.http.get<PedidoDetalle[]>(this.baseUrl, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error: any) => {
        console.error('Error al obtener todos los pedidos:', error);
        return throwError(() => error);
      })
    );
  }

  // Obtener pedidos por estado
  obtenerPedidosPorEstado(estado: string): Observable<PedidoDetalle[]> {
    return this.http.get<PedidoDetalle[]>(`${this.baseUrl}/estado/${estado}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error: any) => {
        console.error('Error al obtener pedidos por estado:', error);
        return throwError(() => error);
      })
    );
  }

  // Actualizar estado de un pedido
  actualizarEstadoPedido(pedidoId: number, nuevoEstado: string): Observable<PedidoDetalle> {
    console.log('=== SERVICIO: Actualizando estado ===');
    console.log('URL:', `${this.baseUrl}/${pedidoId}/estado`);
    console.log('Pedido ID:', pedidoId);
    console.log('Nuevo estado:', nuevoEstado);
    
    const params = new HttpParams().set('estado', nuevoEstado);
    console.log('Parámetros:', params.toString());
    
    return this.http.put<PedidoDetalle>(`${this.baseUrl}/${pedidoId}/estado`, 
      null, 
      { headers: this.getHeaders(), params: params }
    ).pipe(
      catchError((error: any) => {
        console.error('=== ERROR EN SERVICIO DE ESTADO ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Actualizar fecha de entrega de un pedido
  actualizarFechaEntrega(pedidoId: number, fechaEntrega: string): Observable<PedidoDetalle> {
    console.log('=== SERVICIO: Actualizando fecha de entrega ===');
    console.log('URL:', `${this.baseUrl}/${pedidoId}/fecha-entrega`);
    console.log('Pedido ID:', pedidoId);
    console.log('Fecha de entrega:', fechaEntrega);
    
    const params = new HttpParams().set('fechaEntrega', fechaEntrega);
    console.log('Parámetros:', params.toString());
    
    return this.http.put<PedidoDetalle>(`${this.baseUrl}/${pedidoId}/fecha-entrega`, 
      null, 
      { headers: this.getHeaders(), params: params }
    ).pipe(
      catchError((error: any) => {
        console.error('=== ERROR EN SERVICIO DE FECHA ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.error);
        return throwError(() => error);
      })
    );
  }

  // Obtener estadísticas de pedidos
  obtenerEstadisticas(): Observable<PedidoEstadisticas> {
    return this.obtenerTodosLosPedidos().pipe(
      map((pedidos: PedidoDetalle[]) => this.calcularEstadisticas(pedidos))
    );
  }

  private calcularEstadisticas(pedidos: PedidoDetalle[]): PedidoEstadisticas {
    const stats: PedidoEstadisticas = {
      totalPedidos: pedidos.length,
      pendiente: 0,
      procesando: 0,
      enviado: 0,
      entregado: 0,
      cancelado: 0,
      valorTotal: 0
    };

    pedidos.forEach(pedido => {
      // Contar por estado (comparar en minúsculas como vienen del backend)
      switch (pedido.estado.toLowerCase()) {
        case 'pendiente':
          stats.pendiente++;
          break;
        case 'procesando':
          stats.procesando++;
          break;
        case 'enviado':
          stats.enviado++;
          break;
        case 'entregado':
          stats.entregado++;
          break;
        case 'cancelado':
          stats.cancelado++;
          break;
      }
      
      // Sumar valor total
      stats.valorTotal += pedido.total;
    });

    return stats;
  }

  // Filtrar pedidos
  filtrarPedidos(filtros: FiltrosPedidos): Observable<PedidoDetalle[]> {
    return this.obtenerTodosLosPedidos().pipe(
      map((pedidos: PedidoDetalle[]) => {
        let pedidosFiltrados = pedidos;

        // Filtrar por estado
        if (filtros.estado) {
          pedidosFiltrados = pedidosFiltrados.filter(pedido => 
            pedido.estado === filtros.estado
          );
        }

        // Filtrar por búsqueda
        if (filtros.busqueda) {
          pedidosFiltrados = pedidosFiltrados.filter(pedido =>
            pedido.codigo.toLowerCase().includes(filtros.busqueda!.toLowerCase()) ||
            pedido.usuarioNombre?.toLowerCase().includes(filtros.busqueda!.toLowerCase()) ||
            pedido.usuarioEmail?.toLowerCase().includes(filtros.busqueda!.toLowerCase())
          );
        }

        // Filtrar por fecha
        if (filtros.fechaDesde) {
          pedidosFiltrados = pedidosFiltrados.filter(pedido => 
            new Date(pedido.fechaPedido) >= new Date(filtros.fechaDesde!)
          );
        }

        if (filtros.fechaHasta) {
          pedidosFiltrados = pedidosFiltrados.filter(pedido => 
            new Date(pedido.fechaPedido) <= new Date(filtros.fechaHasta!)
          );
        }

        return pedidosFiltrados;
      })
    );
  }

  // Obtener nombre legible del estado
  getNombreEstado(estado: string): string {
    const mapeoEstados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'procesando': 'Procesando',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    
    return mapeoEstados[estado.toLowerCase()] || estado;
  }

  // Obtener color del estado
  getColorEstado(estado: string): string {
    const colores: { [key: string]: string } = {
      'pendiente': '#f59e0b',
      'procesando': '#8b5cf6',
      'enviado': '#06b6d4',
      'entregado': '#10b981',
      'cancelado': '#ef4444'
    };
    return colores[estado.toLowerCase()] || '#6b7280';
  }

  // Obtener lista de estados disponibles
  getEstadosDisponibles(): string[] {
    return ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
  }
}