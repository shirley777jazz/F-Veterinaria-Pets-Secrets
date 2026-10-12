import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Mascota } from '../../../../core/models/mascota';
import { FiltroAdopcion } from '../../../../core/models/filtro-mascota';
import { MascotaService } from '../../../../core/services/mascota.service';
import { AdopcionService, AdopcionRequest } from '../../../../core/services/adopcion.service';
import { MascotaCardComponent } from '../../../../shared/components/mascota-card/mascota-card.component';
import { FiltroMascotaComponent } from '../../../../shared/components/filtro-mascota/filtro-mascota.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-adopcion',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltroMascotaComponent, MascotaCardComponent],
  templateUrl: './adopcion.component.html',
  styleUrl: './adopcion.component.css'
})
export class AdopcionComponent implements OnInit {
  mascotas: Mascota[] = [];
  mascotasFiltradas: Mascota[] = [];
  loading = true;
  error = false;
  
  // Propiedades para el modal de adopción
  mostrarModalAdopcion = false;
  mascotaSeleccionada: Mascota | null = null;
  
  // Formulario de adopción
  formularioAdopcion = {
    experiencia: '',
    tipoVivienda: '',
    otrasMascotas: '',
    horarioTrabajo: '',
    motivoAdopcion: '',
    contactoEmergencia: '',
    veterinarioReferencia: '',
    aceptaTerminos: false,
    aceptaVisita: false
  };

  constructor(
    private mascotaService: MascotaService,
    private adopcionService: AdopcionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMascotas();
  }

  cargarMascotas(): void {
    this.loading = true;
    this.error = false;
    
    this.mascotaService.getMascotas().subscribe({
      next: (mascotas: Mascota[]) => {
        this.mascotas = mascotas;
        this.mascotasFiltradas = mascotas;
        this.loading = false;
        console.log('Mascotas cargadas desde array:', mascotas);
      },
      error: (error: any) => {
        console.error('Error al cargar mascotas:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  onFiltrosCambiados(filtros: FiltroAdopcion): void {
    console.log('Aplicando filtros:', filtros);
    
    // Mapear filtros del frontend al formato del backend
    const filtrosBackend = this.mapearFiltrosParaBackend(filtros);
    
    if (Object.keys(filtrosBackend).length === 0) {
      // Si no hay filtros válidos, mostrar todas las mascotas
      this.mascotasFiltradas = this.mascotas;
      return;
    }
    
    this.mascotaService.filtrarMascotas(filtrosBackend).subscribe({
      next: (mascotas: Mascota[]) => {
        this.mascotasFiltradas = mascotas;
        console.log('Mascotas filtradas:', mascotas);
      },
      error: (error: any) => {
        console.error('Error al filtrar mascotas:', error);
        // En caso de error, filtrar localmente
        this.filtrarMascotasLocalmente(filtros);
      }
    });
  }

  private mapearFiltrosParaBackend(filtros: FiltroAdopcion): any {
    const filtrosBackend: any = {};
    
    // Mapear especie (solo si no es "Todas las especies")
    if (filtros.especie && filtros.especie !== 'Todas las especies') {
      filtrosBackend.especie = filtros.especie.toUpperCase();
    }
    
    // Mapear tamaño (solo si no es "Todos los tamaños")
    if (filtros.tamano && filtros.tamano !== 'Todos los tamaños') {
      filtrosBackend.tamano = filtros.tamano.toLowerCase();
    }
    
    // Mapear género (solo si no es "Todos los géneros")
    if (filtros.genero && filtros.genero !== 'Todos los géneros') {
      filtrosBackend.genero = filtros.genero.toLowerCase();
    }
    
    // Mapear características booleanas (solo si están activas)
    if (filtros.vacunado) {
      filtrosBackend.vacunado = true;
    }
    
    if (filtros.esterilizado) {
      filtrosBackend.esterilizado = true;
    }
    
    // Siempre filtrar por estado disponible para adopción
    filtrosBackend.estadoAdopcion = 'disponible';
    
    return filtrosBackend;
  }

  private filtrarMascotasLocalmente(filtros: FiltroAdopcion): void {
    console.log('Aplicando filtro local como fallback');
    
    this.mascotasFiltradas = this.mascotas.filter(mascota => {
      // Filtro por especie
      if (filtros.especie && filtros.especie !== 'Todas las especies') {
        if (mascota.especie.toLowerCase() !== filtros.especie.toLowerCase()) {
          return false;
        }
      }
      
      // Filtro por tamaño
      if (filtros.tamano && filtros.tamano !== 'Todos los tamaños') {
        if (mascota.tamano?.toLowerCase() !== filtros.tamano.toLowerCase()) {
          return false;
        }
      }
      
      // Filtro por género
      if (filtros.genero && filtros.genero !== 'Todos los géneros') {
        if (mascota.genero?.toLowerCase() !== filtros.genero.toLowerCase()) {
          return false;
        }
      }
      
      // Filtro por edad máxima
      if (filtros.edadMaxima && mascota.edad) {
        if (mascota.edad > filtros.edadMaxima) {
          return false;
        }
      }
      
      // Filtros de características especiales
      if (filtros.vacunado && !mascota.vacunado) {
        return false;
      }
      
      if (filtros.esterilizado && !mascota.esterilizado) {
        return false;
      }
      
      if (filtros.buenoConNinos && !mascota.buenoConNinos) {
        return false;
      }
      
      if (filtros.buenoConOtrasMascotas && !mascota.buenoConOtrasMascotas) {
        return false;
      }
      
      return true;
    });
    
    console.log('Filtrado local completado:', this.mascotasFiltradas.length, 'mascotas encontradas');
  }

  onLimpiarFiltros(): void {
    this.mascotasFiltradas = this.mascotas;
    console.log('Filtros limpiados, mostrando todas las mascotas');
  }

  adoptarMascota(mascota: Mascota): void {
    // Verificar si el usuario está autenticado antes de mostrar el modal
    if (this.authService.requireAuth('/adopcion')) {
      console.log('Adoptando mascota:', mascota.nombre);
      this.mascotaSeleccionada = mascota;
      this.mostrarModalAdopcion = true;
    }
    // Si no está autenticado, requireAuth ya lo redirige al login
  }

  cerrarModalAdopcion(): void {
    this.mostrarModalAdopcion = false;
    this.mascotaSeleccionada = null;
    this.limpiarFormularioAdopcion();
  }

  limpiarFormularioAdopcion(): void {
    this.formularioAdopcion = {
      experiencia: '',
      tipoVivienda: '',
      otrasMascotas: '',
      horarioTrabajo: '',
      motivoAdopcion: '',
      contactoEmergencia: '',
      veterinarioReferencia: '',
      aceptaTerminos: false,
      aceptaVisita: false
    };
  }

  // Métodos auxiliares para mapear valores del frontend al backend
  private mapearExperiencia(experienciaFrontend: string): string {
    const mapeoExperiencia: { [key: string]: string } = {
      'Primera vez': 'nula',
      'Algo de experiencia': 'intermedia',
      'Muy experimentado': 'avanzada'
    };
    return mapeoExperiencia[experienciaFrontend] || 'nula';
  }

  private mapearTipoVivienda(tipoViviendaFrontend: string): string {
    const mapeoVivienda: { [key: string]: string } = {
      'Casa': 'casa',
      'Casa con patio': 'casa',
      'Apartamento': 'departamento',
      'Finca': 'finca',
      'Granja': 'otro'
    };
    return mapeoVivienda[tipoViviendaFrontend] || 'otro';
  }

  enviarSolicitudAdopcion(): void {
    // Verificar que el usuario esté logueado
    if (!this.authService.isLoggedIn()) {
      alert('Debes iniciar sesión para enviar una solicitud de adopción');
      this.router.navigate(['/login']);
      return;
    }

    // Validar campos requeridos
    if (!this.formularioAdopcion.experiencia) {
      alert('Por favor selecciona tu experiencia con mascotas');
      return;
    }

    if (!this.formularioAdopcion.tipoVivienda) {
      alert('Por favor selecciona el tipo de vivienda');
      return;
    }

    if (!this.formularioAdopcion.motivoAdopcion?.trim()) {
      alert('Por favor describe por qué quieres adoptar esta mascota');
      return;
    }

    if (!this.formularioAdopcion.contactoEmergencia?.trim()) {
      alert('Por favor proporciona un contacto de emergencia');
      return;
    }

    // Validar formulario
    if (!this.formularioAdopcion.aceptaTerminos) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    if (!this.formularioAdopcion.aceptaVisita) {
      alert('Debes aceptar la visita domiciliaria');
      return;
    }

    if (!this.mascotaSeleccionada?.id) {
      alert('Error: No se ha seleccionado una mascota válida');
      return;
    }

    // Crear objeto de solicitud con valores mapeados
    const solicitud: AdopcionRequest = {
      mascotaId: this.mascotaSeleccionada.id,
      experienciaMascotas: this.mapearExperiencia(this.formularioAdopcion.experiencia),
      tipoVivienda: this.mapearTipoVivienda(this.formularioAdopcion.tipoVivienda),
      otrasMascotas: this.formularioAdopcion.otrasMascotas || '',
      horarioTrabajo: this.formularioAdopcion.horarioTrabajo || '',
      motivoAdopcion: this.formularioAdopcion.motivoAdopcion || '',
      contactoEmergencia: this.formularioAdopcion.contactoEmergencia || '',
      veterinarioReferencia: this.formularioAdopcion.veterinarioReferencia || '',
      aceptaCondiciones: this.formularioAdopcion.aceptaTerminos,
      aceptaVisita: this.formularioAdopcion.aceptaVisita
    };

    // Enviar solicitud al backend
    this.adopcionService.enviarSolicitud(solicitud).subscribe({
      next: (response) => {
        console.log('Solicitud enviada exitosamente:', response);
        alert('¡Tu solicitud de adopción ha sido enviada exitosamente! Te contactaremos pronto.');
        this.cerrarModalAdopcion();
        
        // Opcional: Recargar las mascotas para actualizar el estado
        this.cargarMascotas();
      },
      error: (error) => {
        console.error('Error al enviar solicitud:', error);
        alert('Error al enviar la solicitud. Por favor intenta nuevamente.');
      }
    });
  }
}
