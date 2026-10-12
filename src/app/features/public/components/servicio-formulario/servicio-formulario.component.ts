import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CitaService, CitaRequest, Servicio, Sede } from '../../../../core/services/cita.service';
import { MascotaService } from '../../../../core/services/mascota.service';
import { Mascota } from '../../../../core/models/mascota';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-servicio-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './servicio-formulario.component.html',
  styleUrl: './servicio-formulario.component.css'
})
export class ServicioFormularioComponent implements OnInit {
  
  constructor(
    private router: Router,
    private citaService: CitaService,
    private mascotaService: MascotaService,
    private authService: AuthService
  ) {}

  // Datos del formulario
  formulario = {
    mascotaId: 0,
    servicioId: 0,
    sedeId: 0,
    fecha: '',
    hora: '',
    notas: ''
  };

  // Datos para mostrar
  misMascotas: Mascota[] = [];
  servicios: Servicio[] = [];
  sedes: Sede[] = [];
  
  // Estados del formulario
  cargando = false;
  enviando = false;
  error: string | null = null;
  exito = false;

  // Opciones de horarios disponibles
  horas = [
    '09:00',
    '10:00',
    '11:00',
    '15:00',
    '16:00'
  ];

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  /**
   * Cargar datos necesarios para el formulario
   */
  cargarDatosIniciales(): void {
    this.cargando = true;
    this.error = null;
    
    // Cargar mis mascotas, servicios y sedes en paralelo
    Promise.all([
      this.mascotaService.obtenerMisMascotas().toPromise(),
      this.citaService.obtenerServicios().toPromise(),
      this.citaService.obtenerSedes().toPromise()
    ]).then(([mascotas, servicios, sedes]) => {
      this.misMascotas = mascotas || [];
      this.servicios = servicios || [];
      this.sedes = sedes || [];
      this.cargando = false;
    }).catch((error) => {
      console.error('Error al cargar datos:', error);
      this.error = 'Error al cargar los datos necesarios. Por favor, inténtalo de nuevo.';
      this.cargando = false;
    });
  }

  /**
   * Enviar formulario para crear cita
   */
  onSubmit(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.enviando = true;
    this.error = null;

    // Crear request para el backend
    const citaRequest: CitaRequest = {
      mascotaId: this.formulario.mascotaId,
      servicioId: this.formulario.servicioId,
      sedeId: this.formulario.sedeId,
      fecha: this.formulario.fecha,
      hora: this.formulario.hora,
      notas: this.formulario.notas || ''
    };

    // Enviar al backend
    this.citaService.crearCita(citaRequest).subscribe({
      next: (response) => {
        console.log('Cita creada exitosamente:', response);
        this.exito = true;
        this.enviando = false;
        
        // Redirigir a mis citas después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/usuario/citas']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al crear cita:', error);
        this.error = error.error?.message || 'Error al agendar la cita. Por favor, inténtalo de nuevo.';
        this.enviando = false;
      }
    });
  }

  /**
   * Validar formulario
   */
  validarFormulario(): boolean {
    if (!this.formulario.mascotaId) {
      this.error = 'Debe seleccionar una mascota';
      return false;
    }
    if (!this.formulario.servicioId) {
      this.error = 'Debe seleccionar un servicio';
      return false;
    }
    if (!this.formulario.sedeId) {
      this.error = 'Debe seleccionar una sede';
      return false;
    }
    if (!this.formulario.fecha) {
      this.error = 'Debe seleccionar una fecha';
      return false;
    }
    if (!this.formulario.hora) {
      this.error = 'Debe seleccionar una hora';
      return false;
    }
    
    // Validar que la fecha sea hoy o en el futuro
    const fechaSeleccionada = new Date(this.formulario.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      this.error = 'La fecha debe ser hoy o en el futuro';
      return false;
    }

    return true;
  }

  /**
   * Obtener nombre de mascota por ID
   */
  obtenerNombreMascota(mascotaId: number): string {
    const mascota = this.misMascotas.find(m => m.id === mascotaId);
    return mascota ? mascota.nombre : 'Mascota no encontrada';
  }

  /**
   * Obtener nombre de servicio por ID
   */
  obtenerNombreServicio(servicioId: number): string {
    const servicio = this.servicios.find(s => s.id === servicioId);
    return servicio ? servicio.nombre : 'Servicio no encontrado';
  }

  /**
   * Obtener nombre de sede por ID
   */
  obtenerNombreSede(sedeId: number): string {
    const sede = this.sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : 'Sede no encontrada';
  }

  /**
   * Obtener fecha mínima (hoy) para el input date
   */
  obtenerFechaMinima(): string {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }
}
