import { formatearFecha as utilsFormatearFecha } from '../../../core/utils/date-utils';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MiPedido {
  id: string;
  fechaPedido: Date | string;
  estado: string;
  total: number;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  direccionEntrega: string;
  metodoPago: string;
  fechaEntrega?: Date | string;
  pedidoOriginal?: any;
}
@Component({
  selector: 'app-mi-pedido-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-pedido-card.component.html',
  styleUrl: './mi-pedido-card.component.css'
})
export class MiPedidoCardComponent {
  @Input() pedido!: MiPedido;
  @Output() verDetalles = new EventEmitter<MiPedido>();
  @Output() imprimir = new EventEmitter<MiPedido>();

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '';
    
    try {
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      if (isNaN(fechaObj.getTime())) return '';
      
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  }

  esEntregado(): boolean {
    return (this.pedido?.estado || '').toLowerCase() === 'entregado';
  }

  onImprimir(event: Event): void {
    event.stopPropagation();
    this.imprimir.emit(this.pedido);
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'entregado':
        return 'bg-success text-white';
      case 'procesando':
      case 'en_proceso':
      case 'en proceso':
      case 'en_preparacion':
      case 'confirmado':
        return 'bg-warning text-dark';
      case 'enviado':
        return 'bg-info text-white';
      case 'cancelado':
        return 'bg-danger text-white';
      case 'pendiente':
        return 'bg-secondary text-white';
      default:
        return 'bg-primary text-white';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'entregado':
        return 'Entregado';
      case 'procesando':
      case 'en_proceso':
      case 'en proceso':
      case 'en_preparacion':
      case 'confirmado':
        return 'Procesando';
      case 'enviado':
        return 'Enviado';
      case 'cancelado':
        return 'Cancelado';
      case 'pendiente':
        return 'Pendiente';
      default:
        return estado;
    }
  }

  onVerDetalles(): void {
    this.verDetalles.emit(this.pedido);
  }
}
