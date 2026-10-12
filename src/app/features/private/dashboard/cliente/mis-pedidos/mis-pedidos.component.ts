import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MiPedido, MiPedidoCardComponent } from '../../../../../shared/components/mi-pedido-card/mi-pedido-card.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { PedidosService, PedidoDetalle } from '../../../../../core/services/pedidos.service';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule, MiPedidoCardComponent],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.css'
})
export class MisPedidosComponent implements OnInit {
  usuarioActual: any;
  mostrarDetalle = false;
  pedidoDetalle: PedidoDetalle | null = null;
  cargandoPedidos = true;
  errorMensaje = '';
  
  pedidos: PedidoDetalle[] = [];

  constructor(
    private authService: AuthService,
    private pedidosService: PedidosService
  ) {}

  ngOnInit(): void {
    // Obtener datos del usuario actual
    this.usuarioActual = this.authService.getCurrentUser();
    
    // Cargar los pedidos del usuario logueado
    this.cargarMisPedidos();
  }

  private cargarMisPedidos(): void {
    this.cargandoPedidos = true;
    this.errorMensaje = '';

    this.pedidosService.obtenerMisPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos = pedidos;
        this.cargandoPedidos = false;
      },
      error: (error) => {
        console.error('Error al cargar mis pedidos:', error);
        this.errorMensaje = 'Error al cargar los pedidos. Por favor, inténtalo de nuevo.';
        this.cargandoPedidos = false;
      }
    });
  }

  verDetallesPedido(pedido: MiPedido): void {
    // Encontrar el pedido completo por ID
    const pedidoCompleto = this.pedidos.find(p => p.id.toString() === pedido.id);
    if (pedidoCompleto) {
      this.pedidoDetalle = pedidoCompleto;
      this.mostrarDetalle = true;
    }
  }

  transformPedido(pedido: PedidoDetalle): MiPedido {
    return {
      id: pedido.id.toString(),
      fechaPedido: new Date(pedido.fechaPedido),
      estado: this.mapearEstado(pedido.estado),
      total: pedido.total,
      productos: pedido.detalles.map(detalle => ({
        nombre: detalle.productoNombre,
        cantidad: detalle.cantidad,
        precio: detalle.precioUnitario
      })),
      direccionEntrega: pedido.direccion,
      metodoPago: pedido.metodoPago,
      fechaEntrega: pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : undefined
    };
  }

  private mapearEstado(estadoBackend: string): 'pendiente' | 'en_proceso' | 'enviado' | 'entregado' | 'cancelado' {
    const mapeoEstados: { [key: string]: 'pendiente' | 'en_proceso' | 'enviado' | 'entregado' | 'cancelado' } = {
      'PENDIENTE': 'pendiente',
      'CONFIRMADO': 'en_proceso',
      'EN_PREPARACION': 'en_proceso',
      'ENVIADO': 'enviado',
      'ENTREGADO': 'entregado',
      'CANCELADO': 'cancelado'
    };
    
    return mapeoEstados[estadoBackend.toUpperCase()] || 'pendiente';
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.pedidoDetalle = null;
  }

  recargarPedidos(): void {
    this.cargarMisPedidos();
  }

  puedeSerCancelado(pedido: PedidoDetalle): boolean {
    return this.pedidosService.puedeSerCancelado(pedido.estado);
  }

  cancelarPedido(pedido: PedidoDetalle): void {
    if (!this.puedeSerCancelado(pedido)) {
      return;
    }

    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      this.pedidosService.cancelarPedido(pedido.id).subscribe({
        next: () => {
          // Actualizar el pedido en la lista local
          const index = this.pedidos.findIndex(p => p.id === pedido.id);
          if (index !== -1) {
            this.pedidos[index].estado = 'CANCELADO';
          }
          
          // Si estamos viendo el detalle del pedido cancelado, actualizar también
          if (this.pedidoDetalle && this.pedidoDetalle.id === pedido.id) {
            this.pedidoDetalle.estado = 'CANCELADO';
          }
        },
        error: (error) => {
          console.error('Error al cancelar pedido:', error);
          alert('Error al cancelar el pedido. Inténtalo de nuevo.');
        }
      });
    }
  }

  getColorEstado(estado: string): string {
    return this.pedidosService.getColorEstado(estado);
  }

  formatearFecha(fecha: string): string {
    return this.pedidosService.formatearFecha(fecha);
  }

  // Método para mostrar mensaje de carga
  get mostrarMensajeCarga(): boolean {
    return this.cargandoPedidos && this.pedidos.length === 0;
  }

  // Método para mostrar mensaje cuando no hay pedidos
  get mostrarMensajeSinPedidos(): boolean {
    return !this.cargandoPedidos && this.pedidos.length === 0 && !this.errorMensaje;
  }

  // Método para formatear precios
  formatPrice(price: number): string {
    return `S/. ${price.toFixed(2)}`;
  }

  // Método para obtener clase CSS del estado
  getEstadoBadgeClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'status-pendiente';
      case 'CONFIRMADO': return 'status-confirmado';
      case 'EN_PREPARACION': return 'status-procesando';
      case 'ENVIADO': return 'status-enviado';
      case 'ENTREGADO': return 'status-entregado';
      case 'CANCELADO': return 'status-cancelado';
      default: return 'status-pendiente';
    }
  }

  // Método para obtener texto del estado
  getEstadoTexto(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'Pendiente';
      case 'CONFIRMADO': return 'Confirmado';
      case 'EN_PREPARACION': return 'En Preparación';
      case 'ENVIADO': return 'Enviado';
      case 'ENTREGADO': return 'Entregado';
      case 'CANCELADO': return 'Cancelado';
      default: return estado || 'Desconocido';
    }
  }
}
