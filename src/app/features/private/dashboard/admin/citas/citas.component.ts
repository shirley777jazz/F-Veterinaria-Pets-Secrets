import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CitaService, CitaResponse } from '../../../../../core/services/cita.service';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit, OnDestroy {
  citas: CitaResponse[] = [];
  citasFiltradas: CitaResponse[] = [];
  busqueda = '';
  filtroFecha = '';
  filtroEstado = '';
  loading = false;
  error: string | null = null;
  showEditForm = false;
  citaEditando?: CitaResponse;
  nuevoEstado = '';
  citaToDelete?: CitaResponse;
  showDeleteModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private citaService: CitaService
  ) {}

  ngOnInit() {
    this.cargarCitas();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCitas() {
    this.loading = true;
    this.error = null;

    this.citaService.obtenerTodasLasCitas()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (citas: CitaResponse[]) => {
          this.citas = citas;
          this.aplicarFiltros();
        },
        error: (error: any) => {
          console.error('Error al cargar las citas:', error);
          this.error = 'No se pudieron cargar las citas. Por favor, intenta de nuevo.';
        }
      });
  }

  aplicarFiltros() {
    this.citasFiltradas = this.citas.filter(cita => {
      const coincideBusqueda = !this.busqueda || 
        cita.usuarioNombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        cita.mascotaNombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        cita.servicioNombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        cita.usuarioEmail.toLowerCase().includes(this.busqueda.toLowerCase());
      
      // Normalizar fecha para comparación correcta
      const coincideFecha = !this.filtroFecha || 
        this.normalizarFechaParaComparacion(cita.fecha) === this.filtroFecha;
      
      const coincideEstado = !this.filtroEstado || 
        cita.estado.toLowerCase() === this.filtroEstado.toLowerCase();
      
      return coincideBusqueda && coincideFecha && coincideEstado;
    });
  }

  private normalizarFechaParaComparacion(fecha: any): string {
    // Si es un array [año, mes, día] (formato típico de LocalDate serializado)
    if (Array.isArray(fecha) && fecha.length >= 3) {
      const año = fecha[0];
      const mes = String(fecha[1]).padStart(2, '0');
      const dia = String(fecha[2]).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    }
    
    // Si es string
    const fechaStr = String(fecha);
    
    // Si ya está en formato YYYY-MM-DD
    if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fechaStr;
    }
    
    // Si tiene formato ISO (con T)
    if (fechaStr.includes('T')) {
      return fechaStr.split('T')[0];
    }
    
    // Si es otro formato, intentar parsearlo
    try {
      const fechaObj = new Date(fechaStr);
      // Usar getFullYear, getMonth, getDate para evitar problemas de timezone
      const año = fechaObj.getFullYear();
      const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaObj.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      console.warn('Error al normalizar fecha:', fecha);
      return fechaStr;
    }
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroFecha = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  editarCita(cita: CitaResponse) {
    this.citaEditando = { ...cita };
    this.nuevoEstado = cita.estado;
    this.showEditForm = true;
  }

  guardarCambios() {
    if (this.citaEditando && this.nuevoEstado !== this.citaEditando.estado) {
      this.loading = true;
      
      this.citaService.cambiarEstadoCita(this.citaEditando.id, this.nuevoEstado)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: (citaActualizada: CitaResponse) => {
            const index = this.citas.findIndex(c => c.id === citaActualizada.id);
            if (index !== -1) {
              this.citas[index] = citaActualizada;
              this.aplicarFiltros();
            }
            this.cancelarEdicion();
          },
          error: (error: any) => {
            console.error('Error al actualizar la cita:', error);
            this.error = 'No se pudo actualizar el estado de la cita.';
          }
        });
    } else {
      this.cancelarEdicion();
    }
  }

  cancelarEdicion() {
    this.showEditForm = false;
    this.citaEditando = undefined;
    this.nuevoEstado = '';
  }

  confirmarEliminar(cita: CitaResponse) {
    this.citaToDelete = cita;
    this.showDeleteModal = true;
  }

  eliminarCita() {
    if (this.citaToDelete) {
      this.loading = true;
      
      this.citaService.cancelarCita(this.citaToDelete.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: () => {
            this.cargarCitas(); // Recargar todas las citas
            this.cerrarModalEliminar();
          },
          error: (error: any) => {
            console.error('Error al cancelar la cita:', error);
            this.error = 'No se pudo cancelar la cita.';
          }
        });
    }
  }

  cerrarModalEliminar() {
    this.showDeleteModal = false;
    this.citaToDelete = undefined;
  }

  navegarAFormulario() {
    this.router.navigate(['/private/admin/formulario']);
  }

  getEstadoClass(estado: string): string {
    const normalizedState = estado.toLowerCase();
    switch(normalizedState) {
      case 'pendiente':
        return 'estado-pendiente';
      case 'confirmada':
        return 'estado-confirmada';
      case 'completada':
        return 'estado-completada';
      case 'cancelada':
        return 'estado-cancelada';
      default:
        return '';
    }
  }

  getEstadoIcon(estado: string): string {
    const normalizedState = estado.toLowerCase();
    switch(normalizedState) {
      case 'pendiente':
        return 'bi-clock-history';
      case 'confirmada':
        return 'bi-check-circle';
      case 'completada':
        return 'bi-check2-all';
      case 'cancelada':
        return 'bi-x-circle';
      default:
        return 'bi-question-circle';
    }
  }

  getCitasEstadisticas() {
    return {
      pendientes: this.citas.filter(c => c.estado.toLowerCase() === 'pendiente').length,
      confirmadas: this.citas.filter(c => c.estado.toLowerCase() === 'confirmada').length,
      completadas: this.citas.filter(c => c.estado.toLowerCase() === 'completada').length,
      canceladas: this.citas.filter(c => c.estado.toLowerCase() === 'cancelada').length
    };
  }

  formatearFecha(fecha: string): string {
    // Evitar problemas de timezone parseando directamente el string
    if (!fecha) return 'Fecha no disponible';
    
    // Si la fecha está en formato YYYY-MM-DD, formatearla directamente
    if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const partes = fecha.split('-');
      const año = partes[0];
      const mes = partes[1];
      const dia = partes[2];
      return `${dia}/${mes}/${año}`;
    }
    
    // Si tiene otros formatos, intentar usar Date pero con precaución
    try {
      // Agregar 'T12:00:00' para evitar problemas de timezone
      const fechaSegura = fecha.includes('T') ? fecha : `${fecha}T12:00:00`;
      const fechaObj = new Date(fechaSegura);
      return fechaObj.toLocaleDateString('es-ES');
    } catch (error) {
      console.warn('Error al formatear fecha:', fecha);
      return fecha;
    }
  }

  formatearHora(hora: string): string {
    if (!hora) return 'No definida';
    // Si viene en formato HH:MM:SS, tomar solo HH:MM
    if (hora.includes(':')) {
      const partes = hora.split(':');
      return `${partes[0]}:${partes[1]}`;
    }
    return hora;
  }

  onBusquedaChange() {
    this.aplicarFiltros();
  }

  onFiltroFechaChange() {
    this.aplicarFiltros();
  }

  onFiltroEstadoChange() {
    this.aplicarFiltros();
  }
}