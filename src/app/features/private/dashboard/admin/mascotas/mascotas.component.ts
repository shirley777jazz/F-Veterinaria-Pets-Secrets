import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mascota, MascotaRequest } from '../../../../../core/models/mascota';
import { MascotaService } from '../../../../../core/services/mascota.service';
import { NotificacionService } from '../../../../../core/services/notificacion.service';

@Component({
  selector: 'app-mascotas',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './mascotas.component.html',
  styleUrl: './mascotas.component.css'
})
export class MascotasComponent implements OnInit {
  mascotas: Mascota[] = [];
  mascotasFiltradas: Mascota[] = [];
  sedes: any[] = [];
  searchTerm: string = '';
  mostrarModal: boolean = false;
  mascotaEditando: Mascota | null = null;
  imagenPreview: string | null = null;
  selectedFile: File | null = null;
  loading: boolean = false;
  error: string | null = null;
  
  mascotaForm: MascotaRequest = {
    nombre: '',
    especie: 'perro',
    raza: '',
    genero: 'macho',
    edad: 0,
    tamano: 'mediano',
    descripcion: '',
    tipo: 'adopcion',
    sedeId: undefined,
    vacunado: false,
    esterilizado: false,
    buenoConNinos: false,
    buenoConOtrasMascotas: false
  };

  constructor(
    private mascotaService: MascotaService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.cargarMascotas();
    this.cargarSedes();
  }

  cargarSedes(): void {
    this.mascotaService.obtenerSedes().subscribe({
      next: (sedes) => {
        this.sedes = sedes;
      },
      error: (error) => {
        console.error('Error al cargar sedes:', error);
      }
    });
  }

  cargarMascotas(): void {
    this.loading = true;
    this.error = null;
    
    this.mascotaService.obtenerTodasLasMascotas().subscribe({
      next: (mascotas) => {
        this.mascotas = mascotas;
        this.mascotasFiltradas = [...this.mascotas];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar mascotas:', error);
        this.error = 'Error al cargar las mascotas. Intente nuevamente.';
        this.loading = false;
      }
    });
  }

  filtrarMascotas(): void {
    if (!this.searchTerm) {
      this.mascotasFiltradas = [...this.mascotas];
      return;
    }
    
    this.mascotasFiltradas = this.mascotas.filter(mascota =>
      mascota.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      mascota.especie.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (mascota.raza && mascota.raza.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  abrirModalNuevo(): void {
    this.mascotaEditando = null;
    this.imagenPreview = null;
    this.selectedFile = null;
    this.mascotaForm = {
      nombre: '',
      especie: 'perro',
      raza: '',
      genero: 'macho',
      edad: 0,
      tamano: 'mediano',
      descripcion: '',
      tipo: 'adopcion',
      sedeId: undefined,
      vacunado: false,
      esterilizado: false,
      buenoConNinos: false,
      buenoConOtrasMascotas: false
    };
    this.mostrarModal = true;
  }

  editarMascota(mascota: Mascota): void {
    this.mascotaEditando = mascota;
    this.imagenPreview = mascota.fotoUrl || null;
    this.selectedFile = null;
    this.mascotaForm = {
      nombre: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza || '',
      genero: mascota.genero,
      edad: mascota.edad || 0,
      tamano: mascota.tamano,
      descripcion: mascota.descripcion || '',
      fotoUrl: mascota.fotoUrl || '',
      tipo: mascota.tipo,
      sedeId: mascota.sedeId || undefined,
      vacunado: mascota.vacunado || false,
      esterilizado: mascota.esterilizado || false,
      buenoConNinos: mascota.buenoConNinos || false,
      buenoConOtrasMascotas: mascota.buenoConOtrasMascotas || false
    };
    this.mostrarModal = true;
  }

  eliminarMascota(mascota: Mascota): void {
    if (!mascota.id) return;
    this.notificacionService.confirmar(
      `¿Estás seguro de eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`,
      'Eliminar Mascota',
      () => {
        this.loading = true;
        this.mascotaService.eliminarMascota(mascota.id!).subscribe({
          next: () => {
            this.mascotas = this.mascotas.filter(m => m.id !== mascota.id);
            this.filtrarMascotas();
            this.loading = false;
            this.notificacionService.mostrarExito('Mascota eliminada exitosamente', '¡Éxito!');
          },
          error: (error) => {
            console.error('Error al eliminar mascota:', error);
            this.notificacionService.mostrarError('Error al eliminar la mascota. Intente nuevamente.');
            this.loading = false;
          }
        });
      },
      undefined,
      'Eliminar',
      'Cancelar'
    );
  }

  async guardarMascota(): Promise<void> {
    if (!this.mascotaForm.nombre.trim()) {
      this.notificacionService.mostrarAdvertencia('El nombre de la mascota es requerido', 'Campo requerido');
      return;
    }

    this.loading = true;
    let fotoUrl = this.mascotaForm.fotoUrl;

    // Si hay una nueva imagen seleccionada, subirla primero
    if (this.selectedFile) {
      try {
        const uploadResponse = await new Promise((resolve, reject) => {
          this.mascotaService.uploadImage(this.selectedFile!).subscribe({
            next: (response) => resolve(response),
            error: (error) => reject(error)
          });
        });
        
        if (uploadResponse && (uploadResponse as any).success) {
          fotoUrl = `http://localhost:8080${(uploadResponse as any).url}`;
        } else {
          this.notificacionService.mostrarError('Error al subir la imagen');
          this.loading = false;
          return;
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        this.notificacionService.mostrarError('Error al subir la imagen');
        this.loading = false;
        return;
      }
    }

    // Actualizar el formulario con la URL de la imagen y sede
    const mascotaData = {
      ...this.mascotaForm,
      sedeId: this.mascotaForm.sedeId ? Number(this.mascotaForm.sedeId) : undefined,
      fotoUrl: fotoUrl
    };
    
    if (this.mascotaEditando && this.mascotaEditando.id) {
      // Actualizar mascota existente
      this.mascotaService.actualizarMascota(this.mascotaEditando.id, mascotaData).subscribe({
        next: (mascotaActualizada) => {
          const index = this.mascotas.findIndex(m => m.id === this.mascotaEditando!.id);
          if (index !== -1) {
            this.mascotas[index] = mascotaActualizada;
          }
          this.filtrarMascotas();
          this.cerrarModal();
          this.loading = false;
          this.notificacionService.mostrarExito('Mascota actualizada exitosamente', '¡Actualizado!');
        },
        error: (error) => {
          console.error('Error al actualizar mascota:', error);
          this.notificacionService.mostrarError('Error al actualizar la mascota. Intente nuevamente.');
          this.loading = false;
        }
      });
    } else {
      // Crear nueva mascota
      this.mascotaService.crearMascota(mascotaData).subscribe({
        next: (nuevaMascota) => {
          this.mascotas.push(nuevaMascota);
          this.filtrarMascotas();
          this.cerrarModal();
          this.loading = false;
          this.notificacionService.mostrarExito('Mascota creada exitosamente para adopción', '¡Creado!');
        },
        error: (error) => {
          console.error('Error al crear mascota:', error);
          this.notificacionService.mostrarError('Error al crear la mascota. Intente nuevamente.');
          this.loading = false;
        }
      });
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.mascotaEditando = null;
    this.imagenPreview = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Solo se permiten imágenes (JPEG, PNG, WebP)');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      this.selectedFile = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imagenPreview = null;
    this.selectedFile = null;
    this.mascotaForm.fotoUrl = '';
    
    // Limpiar el input file
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  getBadgeClass(estadoAdopcion: string): string {
    return this.mascotaService.obtenerClaseEstado(estadoAdopcion);
  }

  obtenerNombreEstado(estado: string): string {
    return this.mascotaService.obtenerNombreEstado(estado);
  }

  obtenerNombreEspecie(especie: string): string {
    return this.mascotaService.obtenerNombreEspecie(especie);
  }

  cambiarEstado(mascota: Mascota, nuevoEstado: string): void {
    if (mascota.id) {
      this.loading = true;
      this.mascotaService.cambiarEstadoAdopcion(mascota.id, nuevoEstado).subscribe({
        next: (mascotaActualizada) => {
          const index = this.mascotas.findIndex(m => m.id === mascota.id);
          if (index !== -1) {
            this.mascotas[index] = mascotaActualizada;
          }
          this.filtrarMascotas();
          this.loading = false;
          alert('Estado cambiado exitosamente');
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          alert('Error al cambiar el estado. Intente nuevamente.');
          this.loading = false;
        }
      });
    }
  }
}
