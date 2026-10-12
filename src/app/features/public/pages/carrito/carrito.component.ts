import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CarritoService, Carrito, CarritoItem } from '../../../../core/services/carrito.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, OnDestroy {
  carrito: Carrito | null = null;
  cargandoCarrito = false;
  procesandoAccion = false;
  logueado: boolean = false;
  
  private carritoSubscription?: Subscription;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.logueado = this.authService.isLoggedIn();
    
    // Cargar carrito independientemente del estado de autenticación
    this.cargarCarrito();
    
    // Suscribirse a los cambios del carrito (temporal o autenticado)
    this.carritoSubscription = this.carritoService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
    });
  }

  ngOnDestroy(): void {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  private cargarCarrito(): void {
    this.cargandoCarrito = true;
    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        this.carrito = carrito;
        this.cargandoCarrito = false;
      },
      error: (error) => {
        console.error('Error al cargar carrito:', error);
        this.cargandoCarrito = false;
        if (error.status === 401) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Getters para compatibilidad con el template
  get items(): CarritoItem[] {
    return this.carrito?.items || [];
  }

  get subtotal(): number {
    return this.carrito?.total || 0;
  }

  get total(): number {
    return this.carrito?.total || 0;
  }

  get totalItems(): number {
    return this.carrito?.totalItems || 0;
  }

  // Disminuir cantidad de un item
  disminuirCantidad(item: CarritoItem): void {
    if (item.cantidad <= 1) return;
    
    this.procesandoAccion = true;
    const nuevaCantidad = item.cantidad - 1;
    
    this.carritoService.actualizarCantidad(item.productoId, nuevaCantidad).subscribe({
      next: (carritoActualizado: any) => {
        // El carrito se actualiza automáticamente a través de la suscripción
        this.procesandoAccion = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar cantidad:', error);
        this.procesandoAccion = false;
        this.manejarError(error);
      }
    });
  }

  // Aumentar cantidad de un item
  aumentarCantidad(item: CarritoItem): void {
    this.procesandoAccion = true;
    const nuevaCantidad = item.cantidad + 1;
    
    this.carritoService.actualizarCantidad(item.productoId, nuevaCantidad).subscribe({
      next: (carritoActualizado: any) => {
        // El carrito se actualiza automáticamente a través de la suscripción
        this.procesandoAccion = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar cantidad:', error);
        this.procesandoAccion = false;
        this.manejarError(error);
      }
    });
  }

  // Eliminar un item específico
  eliminarItem(item: CarritoItem): void {

    
    if (!confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
      return;
    }

    console.log('� Enviando petición de eliminación al servidor...');
    
    this.procesandoAccion = true;
    
    this.carritoService.eliminarProducto(item.productoId).subscribe({
      next: (response: any) => {

        
        // Forzar recarga inmediata del carrito
        this.cargarCarrito();
        this.procesandoAccion = false;
        this.mostrarMensaje('Producto eliminado del carrito');
      },
      error: (error: any) => {
        console.error('Error al eliminar producto del carrito:', error);
        this.procesandoAccion = false;
        this.manejarError(error);
      }
    });
  }

  // Vaciar todo el carrito
  vaciarCarrito(): void {
    if (!confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
      return;
    }

    this.procesandoAccion = true;
    
    this.carritoService.vaciarCarrito().subscribe({
      next: () => {
        this.carrito = {
          id: 0,
          usuarioId: 0,
          fechaCreacion: new Date().toISOString(),
          items: [],
          total: 0,
          totalItems: 0
        };
        this.procesandoAccion = false;
        this.mostrarMensaje('Carrito vaciado correctamente');
      },
      error: (error) => {
        console.error('Error al vaciar carrito:', error);
        this.procesandoAccion = false;
        this.manejarError(error);
      }
    });
  }

  // Validar si se puede proceder al pago
  puedePagar(): boolean {
    return !this.cargandoCarrito && 
           !this.procesandoAccion && 
           this.totalItems > 0;
  }

  // Proceder al pago
  pagar(): void {
    if (!this.logueado) {
      // Redirigir al login con mensaje y URL de retorno
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: '/checkout',
          message: 'Inicia sesión para finalizar tu compra'
        }
      });
      return;
    }
    
    if (!this.puedePagar()) return;
    
    // Navegar a la página de checkout
    this.router.navigate(['/checkout']);
  }

  // Ir a la página de productos
  irAProductos(): void {
    this.router.navigate(['/productos']);
  }

  // Manejar errores de la API
  private manejarError(error: any): void {
    if (error.status === 401) {
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    } else {
      alert('Ha ocurrido un error. Por favor, intenta nuevamente.');
    }
  }

  // Método temporal de prueba
  testEliminar(item: CarritoItem): void {
    alert('Método TEST ejecutado - Producto: ' + item.productoNombre + ' ID: ' + item.productoId);
    console.log('TEST - Item completo:', item);
  }

  // Mostrar mensaje temporal
  private mostrarMensaje(mensaje: string): void {
    const elemento = document.createElement('div');
    elemento.textContent = mensaje;
    elemento.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 9999;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(elemento);
    
    setTimeout(() => {
      if (document.body.contains(elemento)) {
        document.body.removeChild(elemento);
      }
    }, 3000);
  }
}
