import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto, ProductoService } from '../../../../core/services/producto.service';
import { CarritoService } from '../../../../core/services/carrito.service';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './detalle-producto.component.html',
  styleUrl: './detalle-producto.component.css'
})
export class DetalleProductoComponent implements OnInit {

  product: Producto | undefined;
  quantity = 1;
  loading = true;
  error = false;
  mensaje: string | null = null;
  agregandoCarrito = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private carritoService: CarritoService
  ) { }

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productoService.getProductoById(id).subscribe({
        next: (producto: Producto) => {
          this.product = producto;
          this.loading = false;
          this.error = !producto;
        },
        error: () => {
          this.loading = false;
          this.error = true;
        }
      });
    } else {
      this.loading = false;
      this.error = true;
    }
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    this.agregandoCarrito = true;

    this.carritoService.agregarProducto(
      this.product.id,
      this.product.nombre,
      this.product.precio,
      this.quantity,
      this.product.imagenUrl
    ).subscribe({
      next: (carrito) => {
        this.mensaje = `${this.product!.nombre} fue agregado al carrito`;
        this.agregandoCarrito = false;
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
          this.mensaje = null;
        }, 3000);
      },
      error: (error) => {
        console.error('Error al agregar producto al carrito:', error);
        this.agregandoCarrito = false;
        
        if (error.status === 401) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else {
          alert('Error al agregar el producto al carrito. Intenta nuevamente.');
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }


}
