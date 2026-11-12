import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Categoria, Sede, ProductoService } from '../../../core/services/producto.service';

export interface FilterValues {
  sede: string;
  categoria: string;
  precioMinimo: number;
  precioMaximo: number;
  soloConStock: boolean;
}

@Component({
  selector: 'app-filtro',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './filtro.component.html',
  styleUrl: './filtro.component.css'
})
export class FiltroComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<FilterValues>();

  sedes: Sede[] = [];
  categorias: Categoria[] = [];
  
  filters: FilterValues = {
    sede: 'Todas las sedes',
    categoria: 'Todas las categorías',
    precioMinimo: 0,
    precioMaximo: 500,
    soloConStock: false
  };

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.loadFilters();
  }

  loadFilters(): void {
    this.productoService.getAllSedes().subscribe({
      next: (sedes) => {
        this.sedes = sedes;
      },
      error: (error) => {
        console.error('Error al cargar sedes:', error);
      }
    });

    this.productoService.getAllCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  onFilterChange(): void {
    this.filtersChanged.emit(this.filters);
  }

  clearFilters(): void {
    this.filters = {
      sede: 'Todas las sedes',
      categoria: 'Todas las categorías',
      precioMinimo: 0,
      precioMaximo: 500,
      soloConStock: false
    };
    this.onFilterChange();
  }
}
