import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Mascota } from '../../../core/models/mascota';
import { MascotaService } from '../../../core/services/mascota.service';

@Component({
  selector: 'app-mascota-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mascota-card.component.html',
  styleUrl: './mascota-card.component.css'
})
export class MascotaCardComponent {
  @Input() mascota!: Mascota;
  @Output() adoptarMascotaEvent = new EventEmitter<Mascota>();

  constructor(private mascotaService: MascotaService) {}

  adoptarMascota(): void {
    console.log('Adoptando mascota:', this.mascota.nombre);
    this.adoptarMascotaEvent.emit(this.mascota);
  }

  obtenerNombreEstado(estado: string): string {
    return this.mascotaService.obtenerNombreEstado(estado);
  }

  obtenerNombreEspecie(especie: string): string {
    return this.mascotaService.obtenerNombreEspecie(especie);
  }
}
