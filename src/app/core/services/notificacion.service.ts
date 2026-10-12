import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  constructor() { }

  mostrarExito(mensaje: string): void {
    this.mostrarNotificacion(mensaje, 'success');
  }

  mostrarError(mensaje: string): void {
    this.mostrarNotificacion(mensaje, 'error');
  }

  mostrarAdvertencia(mensaje: string): void {
    this.mostrarNotificacion(mensaje, 'warning');
  }

  mostrarInfo(mensaje: string): void {
    this.mostrarNotificacion(mensaje, 'info');
  }

  private mostrarNotificacion(mensaje: string, tipo: string): void {
    // Implementación simple con alert por ahora
    // En producción se podría usar una librería como Toastr o crear un componente personalizado
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
  }
}