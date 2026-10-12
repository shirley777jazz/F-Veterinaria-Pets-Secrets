import { Component, OnInit } from '@angular/core';
import { Cita } from '../../../../../core/models/cita';
import { MiCita, MiCitaCardComponent } from '../../../../../shared/components/index-dashboard-user';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { CitaService, CitaResponse } from '../../../../../core/services/cita.service';

declare var bootstrap: any;



@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, RouterModule, MiCitaCardComponent],
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.css'
})
export class MisCitasComponent implements OnInit {
  usuarioActual: any;
  
  // Datos reales de citas
  citas: CitaResponse[] = [];
  citasProximas: CitaResponse[] = [];
  historialCitas: CitaResponse[] = [];
  citaSeleccionada: CitaResponse | null = null;
  
  // Estados de carga
  cargando = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private citaService: CitaService
  ) {}

  ngOnInit(): void {
    // Obtener datos del usuario actual
    this.usuarioActual = this.authService.getCurrentUser();
    
    // Cargar citas reales del backend
    this.cargarMisCitas();
  }

  /**
   * Cargar mis citas del backend
   */
  cargarMisCitas(): void {
    this.cargando = true;
    this.error = null;

    this.citaService.obtenerMisCitas().subscribe({
      next: (citas) => {
        this.citas = citas;
        this.organizarCitas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar mis citas:', error);
        this.error = `Error al cargar las citas: ${error.status} - ${error.message || 'Error desconocido'}`;
        this.cargando = false;
      }
    });
  }

  /**
   * Organizar citas en próximas e historial
   */
  organizarCitas(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparación de fechas
    
    this.citasProximas = this.citas.filter(cita => {
      const fechaCita = new Date(cita.fecha);
      fechaCita.setHours(0, 0, 0, 0);
      return fechaCita >= hoy && (cita.estado === 'pendiente' || cita.estado === 'confirmada');
    });

    this.historialCitas = this.citas.filter(cita => {
      const fechaCita = new Date(cita.fecha);
      fechaCita.setHours(0, 0, 0, 0);
      return fechaCita < hoy || cita.estado === 'completada' || cita.estado === 'cancelada';
    });
  }

  /**
   * Obtener clase CSS para el estado de la cita
   */
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'bg-success';
      case 'pendiente': return 'bg-warning';
      case 'completada': return 'bg-info';
      case 'cancelada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  /**
   * Obtener etiqueta legible para el estado
   */
  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'Confirmada';
      case 'pendiente': return 'Pendiente';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  }

  /**
   * Cancelar una cita
   */
  cancelarCita(cita: CitaResponse): void {
    if (confirm(`¿Estás seguro de cancelar la cita de ${cita.mascotaNombre}?`)) {
      // TODO: Implementar llamada al backend para cancelar cita
      console.log('Cancelar cita:', cita.id);
      // Por ahora solo actualizamos localmente
      cita.estado = 'cancelada';
      this.organizarCitas();
    }
  }

  /**
   * Reprogramar una cita
   */
  reprogramarCita(cita: CitaResponse): void {
    // TODO: Implementar reprogramación
    console.log('Reprogramar cita:', cita.id);
  }

  /**
   * Ver detalles de una cita en modal
   */
  verDetallesCita(cita: any): void {
    // Buscar cita por ID si es necesario
    if (typeof cita.id === 'string') {
      this.citaSeleccionada = this.citas.find(c => c.id.toString() === cita.id) || null;
    } else {
      this.citaSeleccionada = cita;
    }
    
    if (this.citaSeleccionada) {
      // Abrir el modal usando Bootstrap
      setTimeout(() => {
        const modalElement = document.getElementById('modalDetallesCita');
        if (modalElement && typeof bootstrap !== 'undefined') {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }, 100);
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatear hora para mostrar
   */
  formatearHora(hora: string): string {
    // Si la hora viene en formato HH:mm, convertir a formato AM/PM
    const [hours, minutes] = hora.split(':');
    const hoursNum = parseInt(hours, 10);
    const ampm = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${ampm}`;
  }

  /**
   * Transformar CitaResponse a MiCita para compatibilidad con componente existente
   */
  transformCita(cita: CitaResponse): MiCita {
    return {
      id: cita.id.toString(),
      nombreMascota: cita.mascotaNombre,
      servicioRequerido: cita.servicioNombre,
      fechaPreferida: new Date(cita.fecha),
      horaPreferida: this.formatearHora(cita.hora),
      veterinario: `Servicio: ${cita.servicioNombre}`,
      estado: cita.estado as any,
      observaciones: cita.notas || ''
    };
  }
}
