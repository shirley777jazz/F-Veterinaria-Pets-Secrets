import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdopcionService, AdopcionResponse } from '../../../../../core/services/adopcion.service';
import { MascotaService } from '../../../../../core/services/mascota.service';

// Interfaz para estadísticas del admin
interface AdopcionStats {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
}

@Component({
  selector: 'app-adopciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adopciones.component.html',
  styleUrl: './adopciones.component.css'
})
export class AdopcionesComponent implements OnInit {
  solicitudes: AdopcionResponse[] = [];
  solicitudesFiltradas: AdopcionResponse[] = [];
  searchTerm: string = '';
  filtroEstado: string = '';
  mostrarModal: boolean = false;
  solicitudSeleccionada: AdopcionResponse | null = null;
  cargando = false;
  procesandoSolicitud = false;
  error: string | null = null;

  // Estadísticas
  stats: AdopcionStats = {
    totalSolicitudes: 0,
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0
  };

  constructor(
    private adopcionService: AdopcionService,
    private mascotaService: MascotaService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.error = null;
    
    this.adopcionService.obtenerTodasLasSolicitudes().subscribe({
      next: (adopciones: AdopcionResponse[]) => {
        this.solicitudes = adopciones;
        this.calcularEstadisticas();
        this.filtrarSolicitudes();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar solicitudes:', error);
        this.error = 'Error al cargar las solicitudes de adopción';
        this.cargando = false;
      }
    });
  }

  calcularEstadisticas(): void {
    this.stats.totalSolicitudes = this.solicitudes.length;
    this.stats.solicitudesPendientes = this.solicitudes.filter(s => 
      s.estado === 'PENDIENTE' || s.estado === 'pendiente').length;
    this.stats.solicitudesAprobadas = this.solicitudes.filter(s => 
      s.estado === 'APROBADA' || s.estado === 'aprobada').length;
    this.stats.solicitudesRechazadas = this.solicitudes.filter(s => 
      s.estado === 'RECHAZADA' || s.estado === 'rechazada').length;
  }

  filtrarSolicitudes(): void {
    let resultado = [...this.solicitudes];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const busqueda = this.searchTerm.toLowerCase();
      resultado = resultado.filter(solicitud =>
        solicitud.mascotaNombre?.toLowerCase().includes(busqueda) ||
        solicitud.usuarioNombre?.toLowerCase().includes(busqueda) ||
        solicitud.usuarioEmail?.toLowerCase().includes(busqueda) ||
        solicitud.mascotaRaza?.toLowerCase().includes(busqueda) ||
        solicitud.mascotaEspecie?.toLowerCase().includes(busqueda)
      );
    }

    // Filtrar por estado
    if (this.filtroEstado && this.filtroEstado !== 'Todos') {
      resultado = resultado.filter(solicitud => 
        solicitud.estado?.toUpperCase() === this.filtroEstado.toUpperCase());
    }

    this.solicitudesFiltradas = resultado;
  }

  verSolicitud(solicitud: AdopcionResponse): void {
    this.solicitudSeleccionada = solicitud;
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.solicitudSeleccionada = null;
  }

  aprobarSolicitud(): void {
    if (this.solicitudSeleccionada && !this.procesandoSolicitud) {
      this.procesandoSolicitud = true;
      
      // Aprobar la solicitud de adopción
      this.adopcionService.actualizarEstadoSolicitud(this.solicitudSeleccionada.id, 'aprobada').subscribe({
        next: () => {
          if (this.solicitudSeleccionada) {
            // Actualizar la solicitud localmente
            this.solicitudSeleccionada.estado = 'aprobada';
            
            // Actualizar también en la lista principal
            const index = this.solicitudes.findIndex(s => s.id === this.solicitudSeleccionada!.id);
            if (index !== -1) {
              this.solicitudes[index].estado = 'aprobada';
            }
            
            this.calcularEstadisticas();
            this.filtrarSolicitudes();
          }
          this.procesandoSolicitud = false;
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al aprobar solicitud:', error);
          this.procesandoSolicitud = false;
        }
      });
    }
  }

  rechazarSolicitud(): void {
    if (this.solicitudSeleccionada && !this.procesandoSolicitud) {
      this.procesandoSolicitud = true;
      
      // Rechazar la solicitud de adopción
      this.adopcionService.actualizarEstadoSolicitud(this.solicitudSeleccionada.id, 'rechazada').subscribe({
        next: () => {
          if (this.solicitudSeleccionada) {
            // Actualizar la solicitud localmente
            this.solicitudSeleccionada.estado = 'rechazada';
            
            // Actualizar también en la lista principal
            const index = this.solicitudes.findIndex(s => s.id === this.solicitudSeleccionada!.id);
            if (index !== -1) {
              this.solicitudes[index].estado = 'rechazada';
            }
            
            this.calcularEstadisticas();
            this.filtrarSolicitudes();
          }
          this.procesandoSolicitud = false;
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al rechazar solicitud:', error);
          this.procesandoSolicitud = false;
        }
      });
    }
  }



  obtenerEstadoClass(estado?: string): string {
    if (!estado) return 'estado-badge';
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'pendiente': return 'estado-pendiente';
      case 'aprobada': return 'estado-aprobada';
      case 'rechazada': return 'estado-rechazada';
      default: return 'estado-badge';
    }
  }

  obtenerEstadoClassLarge(estado?: string): string {
    if (!estado) return 'estado-badge-large';
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'pendiente': return 'estado-badge-large estado-pendiente';
      case 'aprobada': return 'estado-badge-large estado-aprobada';
      case 'rechazada': return 'estado-badge-large estado-rechazada';
      default: return 'estado-badge-large';
    }
  }

  obtenerEstadoLabel(estado?: string): string {
    if (!estado) return 'Sin estado';
    const estadoUpper = estado.toUpperCase();
    switch (estadoUpper) {
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADA': return 'Aprobada';
      case 'RECHAZADA': return 'Rechazada';
      default: return estado;
    }
  }

  formatearFecha(fecha?: string | Date): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
