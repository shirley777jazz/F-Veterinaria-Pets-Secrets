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

  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'entregado':
        return 'bg-success';
      case 'en_proceso':
      case 'en proceso':
        return 'bg-warning';
      case 'enviado':
        return 'bg-info';
      case 'cancelado':
        return 'bg-danger';
      case 'pendiente':
        return 'bg-secondary';
      default:
        return 'bg-primary';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'entregado':
        return 'Entregado';
      case 'en_proceso':
      case 'en proceso':
        return 'En Proceso';
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
