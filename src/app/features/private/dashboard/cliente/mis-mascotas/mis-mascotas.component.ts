import { Component, OnInit } from '@angular/core';
import { MiMascota, MiMascotaCardComponent } from '../../../../../shared/components/index-dashboard-user';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import { MascotaService } from '../../../../../core/services/mascota.service';
import { Mascota, MascotaRequest } from '../../../../../core/models/mascota';

interface MascotaUsuario {
  id: number;
  nombre: string;
  especie: string;
  raza: string;
  genero: string;
  edad: number;
  tamano: string;
  fotoUrl: string;
  fechaIngreso: string;
  proximaCita?: string;
}

interface NuevaMascota {
  nombre: string;
  especie: string;
  raza: string;
  genero: string;
  edad: number;
  tamano: string;
  foto: string;
}

@Component({
  selector: 'app-mis-mascotas',
  standalone: true,
  imports: [CommonModule, RouterModule, MiMascotaCardComponent, FormsModule],
  templateUrl: './mis-mascotas.component.html',
  styleUrl: './mis-mascotas.component.css'
})
export class MisMascotasComponent implements OnInit{
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private mascotaService: MascotaService
  ) {}

  mascotas: MascotaUsuario[] = [];
  cargando: boolean = false;
  error: string | null = null;

  // Variables del formulario
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;
  mascotaEditando: MascotaUsuario | null = null;
  nuevaMascota: NuevaMascota = {
    nombre: '',
    especie: '',
    raza: '',
    genero: '',
    edad: 0,
    tamano: '',
    foto: ''
  };
  
  // Opciones para selects
  especies = ['Perro', 'Gato'];
  generos = ['Macho', 'Hembra'];
  tamanos = ['Pequeño', 'Mediano', 'Grande'];
  
  // Variables para upload de imagen
  imagenPreview: string = '';
  archivoSeleccionado: File | null = null;
  uploadError: string = '';
  uploadSuccess: boolean = false;
  maxFileSize: number = 5 * 1024 * 1024; // 5MB (se redimensiona automáticamente)
  tiposPermitidos: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  ngOnInit(): void {
    this.cargarMisMascotas();
  }

  /**
   * Cargar las mascotas propias del usuario logueado
   */
  cargarMisMascotas(): void {
    this.cargando = true;
    this.error = null;
    
    this.mascotaService.obtenerMisMascotas().subscribe({
      next: (mascotas: Mascota[]) => {
        this.mascotas = mascotas.map(mascota => this.convertirAMascotaUsuario(mascota));
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar mascotas:', error);
        this.error = 'Error al cargar las mascotas. Por favor, inténtalo de nuevo.';
        this.cargando = false;
      }
    });
  }

  /**
   * Convertir modelo Mascota del backend al modelo MascotaUsuario del frontend
   */
  private convertirAMascotaUsuario(mascota: Mascota): MascotaUsuario {
    return {
      id: mascota.id || 0,
      nombre: mascota.nombre,
      especie: this.capitalizarPrimeraLetra(mascota.especie),
      raza: mascota.raza || 'Sin especificar',
      genero: this.capitalizarPrimeraLetra(mascota.genero),
      edad: mascota.edad || 0,
      tamano: this.capitalizarPrimeraLetra(mascota.tamano || 'mediano'),
      fotoUrl: mascota.fotoUrl || 'assets/general/perro.webp',
      fechaIngreso: mascota.fechaIngreso || new Date().toISOString().split('T')[0],
      proximaCita: undefined // Por ahora, se puede implementar después
    };
  }

  /**
   * Capitalizar la primera letra de un string
   */
  private capitalizarPrimeraLetra(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  agendarCita(mascota: MascotaUsuario | MiMascota): void {
    // Obtener el usuario actual del servicio de autenticación
    const usuarioActual = this.authService.getCurrentUser();
    
    // Preparar datos para el formulario de servicio
    const datosPrellenos = {
      // Información del propietario desde el usuario logueado
      nombreCompleto: usuarioActual?.nombreCompleto || 'Usuario',
      telefono: usuarioActual?.telefono || '',
      email: usuarioActual?.email || '',
      
      // Información de la mascota
      nombreMascota: mascota.nombre,
      especie: 'especie' in mascota ? mascota.especie : 'Perro', // Default para MiMascota
      raza: mascota.raza,
      edad: mascota.edad.toString()
    };
    
    // Guardar temporalmente los datos en localStorage
    localStorage.setItem('datosPrellenos', JSON.stringify(datosPrellenos));
    
    // Navegar al formulario de servicio
    this.router.navigate(['/servicio-formulario']);
  }

  editarMascota(mascota: MiMascota): void {
    // Encontrar la mascota completa en el array
    const mascotaCompleta = this.mascotas.find(m => m.id === Number(mascota.id));
    if (mascotaCompleta) {
      this.modoEdicion = true;
      this.mascotaEditando = mascotaCompleta;
      
      // Cargar datos en el formulario
      this.nuevaMascota = {
        nombre: mascotaCompleta.nombre,
        especie: mascotaCompleta.especie,
        raza: mascotaCompleta.raza,
        genero: mascotaCompleta.genero,
        edad: mascotaCompleta.edad,
        tamano: mascotaCompleta.tamano,
        foto: mascotaCompleta.fotoUrl
      };
      
      // Si tiene foto, mostrar preview (tanto imágenes de assets como base64)
      if (mascotaCompleta.fotoUrl) {
        this.imagenPreview = mascotaCompleta.fotoUrl;
      } else {
        this.imagenPreview = '';
      }
      
      this.uploadError = '';
      this.uploadSuccess = false;
      this.mostrarModal = true;
    }
  }

  transformMascota(mascota: MascotaUsuario): MiMascota {
    return {
      id: mascota.id.toString(),
      nombre: mascota.nombre,
      raza: mascota.raza,
      edad: mascota.edad,
      foto: mascota.fotoUrl,
      fechaRegistro: new Date(mascota.fechaIngreso),
      proximaCita: mascota.proximaCita ? new Date(mascota.proximaCita) : undefined
    };
  }

  // Métodos del formulario
  abrirModal(): void {
    this.modoEdicion = false;
    this.mascotaEditando = null;
    this.mostrarModal = true;
    this.resetearFormulario();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.mascotaEditando = null;
    this.resetearFormulario();
  }

  resetearFormulario(): void {
    this.nuevaMascota = {
      nombre: '',
      especie: '',
      raza: '',
      genero: '',
      edad: 0,
      tamano: '',
      foto: ''
    };
    this.imagenPreview = '';
    this.archivoSeleccionado = null;
    this.uploadError = '';
    this.uploadSuccess = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.uploadError = '';
    this.uploadSuccess = false;
    
    if (!file) {
      this.limpiarImagen();
      return;
    }

    // Validar tipo de archivo
    if (!this.tiposPermitidos.includes(file.type)) {
      this.uploadError = 'Solo se permiten archivos JPG, PNG y WEBP';
      this.limpiarImagen();
      return;
    }

    // Validar tamaño de archivo
    if (file.size > this.maxFileSize) {
      this.uploadError = 'El archivo no puede ser mayor a 5MB';
      this.limpiarImagen();
      return;
    }

    // Procesar y redimensionar imagen
    this.archivoSeleccionado = file;
    this.redimensionarYProcesarImagen(file);
  }

  private redimensionarYProcesarImagen(file: File): void {
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      const img = new Image();
      
      img.onload = () => {
        // Crear canvas para redimensionar
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular nuevas dimensiones (máximo 300x300 px)
        const maxWidth = 300;
        const maxHeight = 300;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con calidad reducida
        const imagenRedimensionada = canvas.toDataURL('image/jpeg', 0.7); // 70% de calidad
        
        this.imagenPreview = imagenRedimensionada;
        this.nuevaMascota.foto = imagenRedimensionada;
        this.uploadSuccess = true;
        this.uploadError = '';
        
        console.log('Imagen procesada:', {
          tamañoOriginal: file.size,
          tamañoBase64: imagenRedimensionada.length,
          dimensiones: `${width}x${height}`
        });
      };
      
      img.onerror = () => {
        this.uploadError = 'Error al procesar la imagen';
        this.limpiarImagen();
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      this.uploadError = 'Error al cargar la imagen';
      this.limpiarImagen();
    };
    
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.imagenPreview = '';
    this.nuevaMascota.foto = '';
    this.archivoSeleccionado = null;
    this.uploadSuccess = false;
    // Limpiar el input file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  eliminarImagen(): void {
    this.limpiarImagen();
    this.uploadError = '';
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  guardarMascota(): void {
    if (!this.validarFormulario()) {
      this.error = 'Por favor, completa todos los campos requeridos';
      return;
    }

    this.cargando = true;
    this.error = null;

    // Determinar la foto a usar
    let fotoFinal = this.nuevaMascota.foto;
    
    if (this.archivoSeleccionado && this.imagenPreview) {
      // Si hay un archivo nuevo seleccionado, usar la imagen procesada
      fotoFinal = this.imagenPreview;
      console.log('Usando imagen subida y procesada, tamaño:', fotoFinal.length);
    } else if (!fotoFinal || fotoFinal.includes('assets/')) {
      // Si no hay foto o es una imagen por defecto, asignar una nueva por defecto
      fotoFinal = this.getImagenPorDefecto(this.nuevaMascota.especie);
      console.log('Usando imagen por defecto:', fotoFinal);
    }

    // Crear el objeto de request para el backend
    const mascotaRequest: MascotaRequest = {
      nombre: this.nuevaMascota.nombre.trim(),
      especie: this.nuevaMascota.especie.toLowerCase() as 'perro' | 'gato' | 'conejo' | 'ave' | 'otro',
      raza: this.nuevaMascota.raza.trim(),
      genero: this.nuevaMascota.genero.toLowerCase() as 'macho' | 'hembra',
      edad: this.nuevaMascota.edad,
      tamano: this.nuevaMascota.tamano.toLowerCase() as 'pequeño' | 'mediano' | 'grande',
      descripcion: `${this.nuevaMascota.especie} de ${this.nuevaMascota.edad} años`,
      fotoUrl: fotoFinal,
      tipo: 'propia', // Importante: siempre marcar como mascota propia
      vacunado: false, // Valores por defecto
      esterilizado: false,
      buenoConNinos: true,
      buenoConOtrasMascotas: true
    };

    if (this.modoEdicion && this.mascotaEditando) {
      // Actualizar mascota existente
      this.mascotaService.actualizarMascota(this.mascotaEditando.id, mascotaRequest).subscribe({
        next: (mascotaActualizada) => {
          console.log('Mascota actualizada exitosamente:', mascotaActualizada);
          this.cargarMisMascotas(); // Recargar la lista
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al actualizar mascota:', error);
          this.error = 'Error al actualizar la mascota. Por favor, inténtalo de nuevo.';
          this.cargando = false;
        }
      });
    } else {
      // Crear nueva mascota
      this.mascotaService.crearMascota(mascotaRequest).subscribe({
        next: (nuevaMascota) => {
          console.log('Mascota creada exitosamente:', nuevaMascota);
          this.cargarMisMascotas(); // Recargar la lista
          this.cerrarModal();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al crear mascota:', error);
          this.error = 'Error al crear la mascota. Por favor, inténtalo de nuevo.';
          this.cargando = false;
        }
      });
    }
  }

  validarFormulario(): boolean {
    return this.nuevaMascota.nombre.trim() !== '' &&
           this.nuevaMascota.especie !== '' &&
           this.nuevaMascota.raza.trim() !== '' &&
           this.nuevaMascota.genero !== '' &&
           this.nuevaMascota.edad > 0 &&
           this.nuevaMascota.tamano !== '';
  }

  private getImagenPorDefecto(especie: string): string {
    switch (especie.toLowerCase()) {
      case 'perro':
        return 'assets/dueños/ama-perro.webp';
      case 'gato':
        return 'assets/dueños/amo-gato.webp';
      default:
        return 'assets/general/perro.webp';
    }
  }
}
