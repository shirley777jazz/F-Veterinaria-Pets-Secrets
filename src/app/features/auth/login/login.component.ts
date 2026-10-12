import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Usuario } from '../../../core/models/usuario';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(private router: Router, private authService: AuthService) { }

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos';
      return;
    }

    // Usar el servicio de autenticación con backend
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        
        // Redirección según rol
        const redirectTo = this.authService.getRedirectAfterLogin();
        if (redirectTo) {
          this.authService.clearRedirectAfterLogin();
          this.router.navigate([redirectTo]);
        } else {
          if (response.rol === 'admin') {
            this.router.navigate(['/admin/panel']);
          } else {
            this.router.navigate(['/usuario/resumen']);
          }
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        if (error.status === 401) {
          this.error = 'Correo o contraseña incorrectos';
        } else {
          this.error = 'Error de conexión. Intenta nuevamente.';
        }
      }
    });
  }
}