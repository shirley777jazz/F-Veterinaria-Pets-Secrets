import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MiAdopcion {
  id: string;
  nombreMascota: string;
  raza: string;
  edad: number;
  foto: string;
  fechaSolicitud: Date | string;
  estado: string;
  fechaAprobacion?: Date | string;
  fechaEntrega?: Date | string;
  observaciones?: string;
}

@Component({
  selector: 'app-mi-adopcion-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-adopcion-card.component.html',
  styleUrl: './mi-adopcion-card.component.css'
})
export class MiAdopcionCardComponent {
  @Input() adopcion!: MiAdopcion;
  @Output() verDetalles = new EventEmitter<MiAdopcion>();
  @Output() cancelar = new EventEmitter<MiAdopcion>();

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
      case 'aprobada':
      case 'entregada':
        return 'bg-success';
      case 'pendiente':
        return 'bg-warning';
      case 'rechazada':
      case 'cancelada':
        return 'bg-danger';
      case 'en_revision':
      case 'en revision':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'aprobada':
        return 'Aprobada';
      case 'entregada':
        return 'Entregada';
      case 'pendiente':
        return 'Pendiente';
      case 'rechazada':
        return 'Rechazada';
      case 'cancelada':
        return 'Cancelada';
      case 'en_revision':
      case 'en revision':
        return 'En Revisión';
      default:
        return estado;
    }
  }

  onVerDetalles(): void {
    this.verDetalles.emit(this.adopcion);
  }

  onCancelar(): void {
    this.cancelar.emit(this.adopcion);
  }
}
