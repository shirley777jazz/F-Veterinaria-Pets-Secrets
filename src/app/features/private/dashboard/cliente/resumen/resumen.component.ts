import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { Usuario } from '../../../../../core/models/usuario';
import { DashboardStats } from '../../../../../core/models/dashboard';
import { MascotaService } from '../../../../../core/services/mascota.service';
import { AdopcionService } from '../../../../../core/services/adopcion.service';
import { PedidosService } from '../../../../../core/services/pedidos.service';
import { CitaService, CitaResponse } from '../../../../../core/services/cita.service';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenComponent implements OnInit {
  currentUser: Usuario | null = null;
  userName: string = '';
  
  stats: DashboardStats = {
    mascotas: 0,
    adopciones: 0,
    pedidos: 0,
    citas: 0
  };

  proximasCitas: CitaResponse[] = [];
  solicitudesPendientesCount: number = 0;

  cargandoStats: boolean = true;
  cargandoCitas: boolean = true;
  errorCitas: string | null = null;

  constructor(
    private authService: AuthService,
    private mascotaService: MascotaService,
    private adopcionService: AdopcionService,
    private pedidosService: PedidosService,
    private citaService: CitaService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.userName = user?.nombreCompleto || 'Usuario';
    });

    this.cargarDatosResumen();
  }

  cargarDatosResumen(): void {
    if (!this.authService.isLoggedIn()) {
      this.cargandoStats = false;
      this.cargandoCitas = false;
      return;
    }

    this.cargandoStats = true;
    this.cargandoCitas = true;
    this.errorCitas = null;

    // 1. Cargar Mascotas del usuario
    this.mascotaService.obtenerMisMascotas().subscribe({
      next: (mascotas) => {
        this.stats.mascotas = mascotas ? mascotas.length : 0;
      },
      error: (error) => {
        console.error('Error al cargar mascotas en resumen:', error);
        this.stats.mascotas = 0;
      }
    });

    // 2. Cargar Solicitudes de Adopción del usuario
    this.adopcionService.obtenerMisSolicitudes().subscribe({
      next: (adopciones) => {
        this.stats.adopciones = adopciones ? adopciones.length : 0;
        this.solicitudesPendientesCount = adopciones
          ? adopciones.filter(a => a.estado?.toString().toLowerCase() === 'pendiente').length
          : 0;
      },
      error: (error) => {
        console.error('Error al cargar adopciones en resumen:', error);
        this.stats.adopciones = 0;
        this.solicitudesPendientesCount = 0;
      }
    });

    // 3. Cargar Pedidos del usuario
    this.pedidosService.obtenerMisPedidos().subscribe({
      next: (pedidos) => {
        this.stats.pedidos = pedidos ? pedidos.length : 0;
      },
      error: (error) => {
        console.error('Error al cargar pedidos en resumen:', error);
        this.stats.pedidos = 0;
      }
    });

    // 4. Cargar Citas del usuario y filtrar próximas
    this.citaService.obtenerMisCitas().subscribe({
      next: (citas) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const proximas = (citas || []).filter(cita => {
          if (!cita.fecha) return false;
          let fechaCita: Date;
          if (typeof cita.fecha === 'string' && cita.fecha.includes('-')) {
            const partes = cita.fecha.split('-').map(Number);
            fechaCita = new Date(partes[0], partes[1] - 1, partes[2]);
          } else {
            fechaCita = new Date(cita.fecha);
          }
          fechaCita.setHours(0, 0, 0, 0);

          const estado = cita.estado?.toString().toLowerCase();
          return fechaCita >= hoy && (estado === 'pendiente' || estado === 'confirmada');
        });

        // Ordenar cronológicamente (más cercana primero)
        proximas.sort((a, b) => {
          const horaA = a.hora || '00:00:00';
          const horaB = b.hora || '00:00:00';
          const fechaHoraA = new Date(`${a.fecha}T${horaA}`).getTime();
          const fechaHoraB = new Date(`${b.fecha}T${horaB}`).getTime();
          return fechaHoraA - fechaHoraB;
        });

        this.proximasCitas = proximas.slice(0, 5); // Mostrar hasta 5 próximas citas
        this.stats.citas = proximas.length;
        this.cargandoCitas = false;
        this.cargandoStats = false;
      },
      error: (error) => {
        console.error('Error al cargar citas en resumen:', error);
        this.errorCitas = 'No se pudieron cargar las citas';
        this.stats.citas = 0;
        this.proximasCitas = [];
        this.cargandoCitas = false;
        this.cargandoStats = false;
      }
    });
  }

  formatearFechaHora(cita: CitaResponse): string {
    if (!cita.fecha) return '';
    try {
      let fechaObj: Date;
      if (typeof cita.fecha === 'string' && cita.fecha.includes('-')) {
        const [year, month, day] = cita.fecha.split('-').map(Number);
        fechaObj = new Date(year, month - 1, day);
      } else {
        fechaObj = new Date(cita.fecha);
      }

      const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const fechaFormateada = fechaObj.toLocaleDateString('es-ES', opciones);
      // Capitalizar mes si es necesario
      const fechaCapitalizada = fechaFormateada.replace(/(de )([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

      const horaFormateada = cita.hora ? this.formatearHora(cita.hora) : '';
      return horaFormateada ? `${fechaCapitalizada} - ${horaFormateada}` : fechaCapitalizada;
    } catch {
      return `${cita.fecha} ${cita.hora || ''}`;
    }
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    const partes = hora.split(':');
    const horas = parseInt(partes[0], 10);
    const minutos = partes[1] || '00';
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 || 12;
    return `${horas12}:${minutos} ${ampm}`;
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toString().toLowerCase()) {
      case 'confirmada': return 'bg-success';
      case 'pendiente': return 'bg-warning text-dark';
      case 'completada': return 'bg-info text-dark';
      case 'cancelada': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado?.toString().toLowerCase()) {
      case 'confirmada': return 'Confirmada';
      case 'pendiente': return 'Pendiente';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return estado || 'Pendiente';
    }
  }
}
