import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component , EventEmitter, Output} from '@angular/core';
import { FiltroAdopcion } from '../../../core/models/filtro-mascota';

@Component({
  selector: 'app-filtro-mascota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtro-mascota.component.html',
  styleUrl: './filtro-mascota.component.css',
})
export class FiltroMascotaComponent {
  @Output() filtrosCambiados = new EventEmitter<FiltroAdopcion>();
  @Output() limpiarFiltrosEvent = new EventEmitter<void>();

  // Filtros
  filtros: FiltroAdopcion = {
    especie: 'Todas las especies',
    tamano: 'Todos los tamaños',
    genero: 'Todos los géneros',
    edadMaxima: 10,
    vacunado: false,
    esterilizado: false,
    buenoConNinos: false,
    buenoConOtrasMascotas: false,
  };

  // Valores por defecto para limpiar filtros
  filtrosPorDefecto: FiltroAdopcion = {
    especie: 'Todas las especies',
    tamano: 'Todos los tamaños',
    genero: 'Todos los géneros',
    edadMaxima: 10,
    vacunado: false,
    esterilizado: false,
    buenoConNinos: false,
    buenoConOtrasMascotas: false,
  };

  onFiltroChange(): void {
    console.log('Filtro cambiado:', this.filtros);
    this.filtrosCambiados.emit(this.filtros);
  }

  onEdadChange(event: any): void {
    this.filtros.edadMaxima = parseInt(event.target.value);
    console.log('Edad máxima cambiada a:', this.filtros.edadMaxima);
    this.filtrosCambiados.emit(this.filtros);
  }

  onCheckboxChange(): void {
    console.log('Checkbox cambiado:', this.filtros);
    this.filtrosCambiados.emit(this.filtros);
  }

  limpiarFiltros(): void {
    this.filtros = { ...this.filtrosPorDefecto };
    console.log('Filtros limpiados');
    // Emitir tanto el evento de limpiar como los filtros cambiados
    this.limpiarFiltrosEvent.emit();
    this.filtrosCambiados.emit(this.filtros);
  }

  tieneFiltrosActivos(): boolean {
    return (
      this.filtros.especie !== this.filtrosPorDefecto.especie ||
      this.filtros.tamano !== this.filtrosPorDefecto.tamano ||
      this.filtros.genero !== this.filtrosPorDefecto.genero ||
      this.filtros.edadMaxima !== this.filtrosPorDefecto.edadMaxima ||
      this.filtros.vacunado !== this.filtrosPorDefecto.vacunado ||
      this.filtros.esterilizado !== this.filtrosPorDefecto.esterilizado ||
      this.filtros.buenoConNinos !== this.filtrosPorDefecto.buenoConNinos ||
      this.filtros.buenoConOtrasMascotas !== this.filtrosPorDefecto.buenoConOtrasMascotas
    );
  }
}
