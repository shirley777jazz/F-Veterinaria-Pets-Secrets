import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CarritoService } from '../../../core/services/carrito.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from '../../../core/models/menu-item';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [
    { label: 'Inicio', route: '/inicio', exact: true },
    { label: 'Nosotros', route: '/nosotros' },
    { label: 'Servicios', route: '/servicios' },
    { label: 'Productos', route: '/productos' },
    { label: 'Adopción', route: '/adopcion' }
  ];

  logueado: boolean = false;
  nombreUsuario: string | null = null;
  userEmail: string | null = null;
  isAdmin: boolean = false;
  contadorCarrito: number = 0;
  
  private userSub?: Subscription;
  private carritoSub?: Subscription;

  constructor(
    private authService: AuthService,
    private carritoService: CarritoService
  ) {}

  ngOnInit() {
    // Suscripción al usuario
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.logueado = !!user;
      this.nombreUsuario = user?.nombreCompleto || null;
      this.userEmail = user?.email || null;
      this.isAdmin = user?.rol === 'admin';
      
      // Gestionar carrito según el estado de autenticación
      if (user) {
        // Usuario autenticado: migrar carrito temporal y suscribirse al contador
        this.carritoService.migrarCarritoTemporal().then(() => {
          // Después de migrar, asegurarse de que está suscrito al carrito
          this.suscribirseACarrito();
        });
      } else {
        // Usuario no autenticado: trabajar con carrito temporal
        this.suscribirseACarrito(); // También suscribirse para carrito temporal
      }
    });
  }

  private suscribirseACarrito(): void {
    // Evitar suscripciones múltiples
    if (this.carritoSub) {
      this.carritoSub.unsubscribe();
    }
    
    // Suscribirse al contador de items del carrito
    this.carritoSub = this.carritoService.contadorItems$.subscribe(contador => {
      this.contadorCarrito = contador;
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.carritoSub?.unsubscribe();
  }

  getUserEmail(): string {
    return this.userEmail || '';
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
