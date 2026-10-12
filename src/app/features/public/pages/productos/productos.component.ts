import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Producto, Categoria, ProductoService } from '../../../../core/services/producto.service';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { FiltroComponent, FilterValues } from '../../../../shared/components/filtro/filtro.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, FiltroComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  loading = false;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    // Solo mostrar productos activos en la tienda pública
    this.productoService.getAllProductos().subscribe({
      next: (productos) => {
        this.productos = productos.filter(p => p.estado === 'activo' && p.stock > 0);
        this.productosFiltrados = [...this.productos];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.loading = false;
      }
    });
  }

  onAddToCart(producto: Producto): void {
    // Producto agregado al carrito por el componente hijo
  }

  onFiltersChanged(filters: FilterValues): void {
    this.aplicarFiltros(filters);
  }

  private aplicarFiltros(filters: FilterValues): void {
    this.productosFiltrados = this.productos.filter(producto => {
      // Filtro por categoría
      if (filters.categoria !== 'Todas las categorías' && producto.categoria.nombre !== filters.categoria) {
        return false;
      }

      // Filtro por precio
      if (producto.precio < filters.precioMinimo || producto.precio > filters.precioMaximo) {
        return false;
      }

      // Filtro por stock
      if (filters.soloConStock && producto.stock === 0) {
        return false;
      }

      return true;
    });
  }
}
