import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MiAdopcion, MiAdopcionCardComponent } from '../../../../../shared/components/mi-adopcion-card/mi-adopcion-card.component';
import { Adopcion } from '../../../../../core/models/dashboard';
import { AuthService } from '../../../../../core/services/auth.service';
import { AdopcionService, AdopcionResponse } from '../../../../../core/services/adopcion.service';

declare var bootstrap: any;


@Component({
  selector: 'app-mis-adopciones',
  standalone: true,
  imports: [CommonModule, RouterModule, MiAdopcionCardComponent],
  templateUrl: './mis-adopciones.component.html',
  styleUrl: './mis-adopciones.component.css'
})
export class MisAdopcionesComponent implements OnInit {
  adopcionSeleccionada: any = null;
  usuarioActual: any;
  adopciones: AdopcionResponse[] = [];
  cargando = false;

  constructor(
    private authService: AuthService,
    private adopcionService: AdopcionService
  ) {}


  ngOnInit(): void {
    // Obtener datos del usuario actual
    this.usuarioActual = this.authService.getCurrentUser();
    
    // Cargar adopciones del usuario desde el backend
    this.cargarAdopcionesUsuario();
  }

  private cargarAdopcionesUsuario(): void {
    if (!this.authService.isLoggedIn()) {
      console.error('Usuario no logueado');
      return;
    }

    this.cargando = true;
    this.adopcionService.obtenerMisSolicitudes().subscribe({
      next: (adopciones: AdopcionResponse[]) => {
        this.adopciones = adopciones;
        console.log('Adopciones cargadas:', adopciones);
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar adopciones:', error);
        this.cargando = false;
        // Mostrar mensaje de error al usuario
        alert('Error al cargar las solicitudes de adopción. Por favor, intenta nuevamente.');
      }
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'bg-success';
      case 'pendiente': return 'bg-warning';
      case 'rechazado': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'En Revisión';
      case 'rechazado': return 'Rechazado';
      default: return estado;
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'bi-check-circle-fill';
      case 'pendiente': return 'bi-clock-fill';
      case 'rechazado': return 'bi-x-circle-fill';
      default: return 'bi-question-circle-fill';
    }
  }

  cancelarSolicitud(adopcion: Adopcion): void {
    if (confirm(`¿Estás seguro de cancelar la solicitud de adopción de ${adopcion.nombreMascota}?`)) {
      // Aquí implementarías la lógica para cancelar la solicitud
      console.log('Cancelar solicitud:', adopcion.id);
    }
  }

  verDetallesAdopcion(adopcion: MiAdopcion): void {
    // Encontrar la adopción completa usando el ID
    const adopcionCompleta = this.adopciones.find(a => a.id === Number(adopcion.id));
    
    if (adopcionCompleta) {
      // Mapear los datos para el modal
      this.adopcionSeleccionada = {
        ...adopcionCompleta,
        // Mapear campos de la mascota para compatibilidad con el modal
        nombreMascota: adopcionCompleta.mascotaNombre,
        raza: adopcionCompleta.mascotaRaza,
        edad: '2 años', // Valor temporal hasta obtener edad real
        especie: adopcionCompleta.mascotaEspecie,
        foto: adopcionCompleta.mascotaFotoUrl,
        fecha: adopcionCompleta.fechaSolicitud,
        // Mapear campos del usuario para compatibilidad con el modal
        nombreSolicitante: adopcionCompleta.usuarioNombre,
        email: adopcionCompleta.usuarioEmail,
        telefono: this.usuarioActual?.telefono || 'No especificado',
        experiencia: this.mapearExperienciaParaVista(adopcionCompleta.experienciaMascotas),
        motivacion: adopcionCompleta.motivoAdopcion,
        veterinario: adopcionCompleta.veterinarioReferencia,
        aceptaTerminos: adopcionCompleta.aceptaCondiciones,
        mensaje: this.obtenerMensajePorEstado(adopcionCompleta.estado.toString())
      };
      
      // Abrir el modal usando Bootstrap
      setTimeout(() => {
        const modalElement = document.getElementById('modalDetallesAdopcion');
        if (modalElement && typeof bootstrap !== 'undefined') {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }, 100);
    }
  }

  private mapearExperienciaParaVista(experiencia: string): string {
    const mapeoExperiencia: { [key: string]: string } = {
      'nula': 'Primera vez - Sin experiencia previa',
      'básica': 'Básica - Algo de experiencia',
      'intermedia': 'Intermedia - Experiencia moderada',
      'avanzada': 'Avanzada - Muy experimentado'
    };
    return mapeoExperiencia[experiencia] || experiencia;
  }

  mapearTipoViviendaParaVista(tipoVivienda: string): string {
    const mapeoVivienda: { [key: string]: string } = {
      'casa': 'Casa',
      'departamento': 'Departamento/Apartamento',
      'finca': 'Finca/Casa de campo',
      'otro': 'Otro tipo de vivienda'
    };
    return mapeoVivienda[tipoVivienda] || tipoVivienda;
  }

  cancelarSolicitudAdopcion(adopcion: MiAdopcion): void {
    if (confirm(`¿Estás seguro de cancelar la solicitud de adopción de ${adopcion.nombreMascota}?`)) {
      console.log('Cancelar solicitud:', adopcion.id);
      // TODO: Implementar lógica para cancelar la solicitud usando el backend
      // this.adopcionService.cancelarSolicitud(Number(adopcion.id)).subscribe(...)
    }
  }

  // Método para recargar las adopciones
  recargarAdopciones(): void {
    this.cargarAdopcionesUsuario();
  }

  formatearFecha(fecha: Date | string | undefined): string {
    console.log('formatearFecha recibió:', fecha, 'tipo:', typeof fecha);
    
    if (!fecha) return '';
    
    try {
      let fechaObj: Date;
      
      if (typeof fecha === 'string') {
        // Si es string, puede ser formato ISO o formato 'YYYY-MM-DD'
        if (fecha.includes('-') && fecha.length === 10) {
          const partes = fecha.split('-');
          fechaObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        } else {
          fechaObj = new Date(fecha);
        }
      } else if (fecha instanceof Date) {
        fechaObj = fecha;
      } else {
        console.error('Tipo de fecha no reconocido:', typeof fecha, fecha);
        return '';
      }
      
      if (isNaN(fechaObj.getTime())) {
        console.error('Fecha inválida después de conversión:', fechaObj);
        return '';
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'fecha original:', fecha);
      return '';
    }
  }

  transformAdopcion(adopcion: AdopcionResponse): MiAdopcion {
    return {
      id: adopcion.id.toString(),
      nombreMascota: adopcion.mascotaNombre || 'Nombre no disponible',
      raza: adopcion.mascotaRaza || 'No especificada',
      edad: this.calcularEdadMascota(adopcion.mascotaId), // Calcular edad basándose en datos disponibles
      foto: adopcion.mascotaFotoUrl || '/assets/general/perro.webp', // Imagen por defecto
      fechaSolicitud: new Date(adopcion.fechaSolicitud),
      fechaAprobacion: adopcion.fechaAprobacion ? new Date(adopcion.fechaAprobacion) : undefined,
      estado: this.mapearEstadoBackendAFrontend(adopcion.estado.toString()),
      observaciones: this.obtenerMensajePorEstado(adopcion.estado.toString())
    };
  }

  private calcularEdadMascota(mascotaId: number): number {
    // Por ahora retornar un valor por defecto
    // TODO: Obtener edad real de la mascota desde el servicio de mascotas
    // Se puede implementar un método que consulte la API de mascotas
    const edadesEjemplo: { [key: number]: number } = {
      1: 2, 2: 3, 3: 1, 4: 4, 5: 2
    };
    return edadesEjemplo[mascotaId] || 2; // Valor por defecto
  }

  private mapearEstadoBackendAFrontend(estadoBackend: string): string {
    const mapeoEstados: { [key: string]: string } = {
      'pendiente': 'pendiente',
      'aprobada': 'aprobada', 
      'rechazada': 'rechazada',
      'completada': 'completada'
    };
    return mapeoEstados[estadoBackend] || 'pendiente';
  }

  private obtenerMensajePorEstado(estado: string): string {
    const mensajes: { [key: string]: string } = {
      'pendiente': 'Tu solicitud está siendo revisada por nuestro equipo.',
      'aprobada': '¡Felicidades! Tu solicitud ha sido aprobada. Te contactaremos pronto.',
      'rechazada': 'Lamentablemente tu solicitud no pudo ser aprobada en esta ocasión.',
      'completada': '¡Adopción completada exitosamente! Disfruta de tu nueva mascota.'
    };
    return mensajes[estado] || 'Estado de la solicitud actualizado.';
  }

}
