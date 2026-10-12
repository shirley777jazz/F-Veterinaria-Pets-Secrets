import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Producto } from '../../../core/services/producto.service';
import { CarritoService } from '../../../core/services/carrito.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() producto!: Producto;
  @Output() add = new EventEmitter<Producto>();

  agregandoCarrito = false;

  constructor(
    private router: Router,
    private carritoService: CarritoService
  ) { }

  viewProduct(): void {
    this.router.navigate(['/detalle-producto', this.producto.id]);
  }

  addToCart(event?: Event) {
    // Prevenir navegación si se hace click en el botón
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.agregandoCarrito = true;
    
    this.carritoService.agregarProducto(
      this.producto.id,
      this.producto.nombre,
      this.producto.precio,
      1,
      this.producto.imagenUrl
    ).subscribe({
      next: (carrito) => {
        // Emitir el evento para compatibilidad
        this.add.emit(this.producto);
        // Mostrar mensaje de éxito
        this.mostrarMensajeExito();
        this.agregandoCarrito = false;
      },
      error: (error) => {
        console.error('Error agregando al carrito:', error);
        
        let errorMessage = 'Error al agregar el producto al carrito. Intenta nuevamente.';
        
        if (error.status === 401) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        alert(errorMessage);
        this.agregandoCarrito = false;
      }
    });
  }

  private mostrarMensajeExito(): void {
    // Crear un toast o mensaje temporal
    const mensaje = document.createElement('div');
    mensaje.textContent = '¡Producto agregado al carrito!';
    mensaje.style.cssText = `
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
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
      document.body.removeChild(mensaje);
    }, 1000);
  }
}