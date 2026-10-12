import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserResponse, UpdateUserRequest } from '../../../../../core/models/user-models';
import { RegisterRequest } from '../../../../../core/models/api-responses';
import { UsuarioService } from '../../../../../core/services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: UserResponse[] = [];
  usuariosFiltrados: UserResponse[] = [];
  searchTerm: string = '';
  mostrarModal: boolean = false;
  mostrarModalConfirmar: boolean = false;
  usuarioEditando: UserResponse | null = null;
  usuarioAEliminar: UserResponse | null = null;
  loading: boolean = false;
  error: string = '';
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/usuarios';
  
  usuarioForm = {
    nombreCompleto: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'usuario' as 'usuario' | 'admin'
  };

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    // Limpiar localStorage para forzar uso del backend
    localStorage.removeItem('usuarios');
    
    this.loading = true;
    this.error = '';
    
    console.log('Cargando usuarios desde el backend API:', this.apiUrl);
    
    this.http.get<UserResponse[]>(this.apiUrl).subscribe({
      next: (usuarios) => {
        console.log('Usuarios cargados del backend:', usuarios);
        this.usuarios = usuarios || [];
        this.usuariosFiltrados = [...this.usuarios];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios del backend:', error);
        this.error = `Error al conectar con el backend. Verificar que esté funcionando en ${this.apiUrl}`;
        this.loading = false;
        
        // NO usar datos de fallback - queremos que el usuario vea el error
        this.usuarios = [];
        this.usuariosFiltrados = [];
      }
    });
  }

  get usuariosParaMostrar(): UserResponse[] {
    if (!this.searchTerm) {
      return this.usuarios;
    }
    
    return this.usuarios.filter(usuario =>
      usuario.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  filtrarUsuarios(): void {
    if (!this.searchTerm) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }
    
    this.usuariosFiltrados = this.usuarios.filter(usuario =>
      usuario.nombreCompleto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  abrirModalNuevo(): void {
    this.usuarioEditando = null;
    this.usuarioForm = {
      nombreCompleto: '',
      email: '',
      telefono: '',
      password: '',
      rol: 'usuario' as 'usuario' | 'admin'
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: UserResponse): void {
    this.usuarioEditando = usuario;
    this.usuarioForm = {
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      telefono: usuario.telefono,
      password: '',
      rol: (usuario.rol || 'usuario') as 'usuario' | 'admin'
    };
    this.mostrarModal = true;
    this.error = '';
  }

  confirmarEliminar(usuario: UserResponse): void {
    this.usuarioAEliminar = usuario;
    this.mostrarModalConfirmar = true;
  }

  eliminarUsuario(): void {
    if (!this.usuarioAEliminar) return;

    this.loading = true;
    
    this.http.delete(`${this.apiUrl}/${this.usuarioAEliminar.id}`).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== this.usuarioAEliminar!.id);
        this.filtrarUsuarios();
        this.cerrarModalConfirmar();
        this.loading = false;
        console.log('Usuario eliminado exitosamente');
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.error = error.error?.message || 'Error al eliminar el usuario';
        this.cerrarModalConfirmar();
        this.loading = false;
      }
    });
  }

  cerrarModalConfirmar(): void {
    this.mostrarModalConfirmar = false;
    this.usuarioAEliminar = null;
  }

  guardarUsuario(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.usuarioEditando) {
      // Actualizar usuario existente
      const updateRequest: UpdateUserRequest = {
        nombreCompleto: this.usuarioForm.nombreCompleto,
        email: this.usuarioForm.email,
        telefono: this.usuarioForm.telefono,
        rol: this.usuarioForm.rol
      };
      
      if (this.usuarioForm.password.trim()) {
        updateRequest.password = this.usuarioForm.password;
      }

      this.http.put<UserResponse>(`${this.apiUrl}/${this.usuarioEditando.id}`, updateRequest).subscribe({
        next: (usuarioActualizado) => {
          const index = this.usuarios.findIndex(u => u.id === this.usuarioEditando!.id);
          if (index !== -1) {
            this.usuarios[index] = usuarioActualizado;
          }
          this.filtrarUsuarios();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.error = error.error?.message || 'Error al actualizar el usuario';
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo usuario
      const createRequest = {
        nombreCompleto: this.usuarioForm.nombreCompleto,
        email: this.usuarioForm.email,
        telefono: this.usuarioForm.telefono,
        password: this.usuarioForm.password,
        rol: this.usuarioForm.rol
      };

      this.http.post<UserResponse>(this.apiUrl, createRequest).subscribe({
        next: (nuevoUsuario) => {
          this.usuarios.push(nuevoUsuario);
          this.filtrarUsuarios();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.error = error.error?.message || 'Error al crear el usuario';
          this.loading = false;
        }
      });
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioEditando = null;
  }

  private formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  private validarFormulario(): boolean {
    if (!this.usuarioForm.nombreCompleto.trim()) {
      this.error = 'El nombre es requerido';
      return false;
    }
    
    if (!this.usuarioForm.email.trim()) {
      this.error = 'El email es requerido';
      return false;
    }
    
    if (!this.usuarioForm.telefono.trim()) {
      this.error = 'El teléfono es requerido';
      return false;
    }
    
    if (!this.usuarioEditando && !this.usuarioForm.password.trim()) {
      this.error = 'La contraseña es requerida para usuarios nuevos';
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.usuarioForm.email)) {
      this.error = 'El email no tiene un formato válido';
      return false;
    }

    // Validar formato de teléfono
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(this.usuarioForm.telefono)) {
      this.error = 'El teléfono debe tener 9 dígitos y empezar con 9';
      return false;
    }

    return true;
  }
}
