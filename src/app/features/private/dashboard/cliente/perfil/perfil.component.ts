import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../../../core/models/usuario';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit{
  currentUser: Usuario | null = null;
  formData: Partial<Usuario> = {};
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.formData = { ...user };
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Preparar datos limpios para enviar
    const cleanData = {
      nombreCompleto: this.formData.nombreCompleto?.trim(),
      email: this.formData.email?.trim(),
      telefono: this.formData.telefono?.trim(),
      password: this.formData.password?.trim()
    };

    // Llamada HTTP real al backend
    this.authService.updateProfile(cleanData).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        this.successMessage = 'Perfil actualizado correctamente';
        
        // Actualizar los datos del formulario con la respuesta del servidor
        this.formData = { ...updatedUser };
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al actualizar perfil:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 400 && error.error) {
          // Error de validación del backend
          if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.error.errors) {
            // Manejar errores de validación múltiples
            const validationErrors = Object.values(error.error.errors).join(', ');
            this.errorMessage = `Errores de validación: ${validationErrors}`;
          } else {
            this.errorMessage = 'Datos inválidos. Verifica la información ingresada.';
          }
        } else if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 404) {
          this.errorMessage = 'Usuario no encontrado.';
        } else if (error.status === 403) {
          this.errorMessage = 'No tienes permisos para realizar esta acción.';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
        } else {
          this.errorMessage = 'Error al actualizar el perfil. Intenta nuevamente.';
        }
        
        // Limpiar mensaje de error después de 8 segundos para errores largos
        setTimeout(() => {
          this.errorMessage = '';
        }, 8000);
      }
    });
  }

  isFormValid(): boolean {
    // Validar campos obligatorios
    if (!this.formData.nombreCompleto?.trim() || 
        !this.formData.email?.trim() || 
        !this.formData.telefono?.trim()) {
      return false;
    }

    // Validar longitud del nombre (2-150 caracteres según backend)
    if (this.formData.nombreCompleto.trim().length < 2 || 
        this.formData.nombreCompleto.trim().length > 150) {
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email.trim())) {
      return false;
    }

    // Validar formato de teléfono (9 dígitos, empezar con 9 según backend)
    const telefonoRegex = /^9\d{8}$/;
    if (!telefonoRegex.test(this.formData.telefono.trim())) {
      return false;
    }

    // Validar contraseña si se proporciona (6-20 caracteres según backend)
    if (this.formData.password && 
        (this.formData.password.length < 6 || this.formData.password.length > 20)) {
      return false;
    }

    return true;
  }
}
