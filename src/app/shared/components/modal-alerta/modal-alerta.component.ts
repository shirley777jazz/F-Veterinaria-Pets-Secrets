import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificacionService, AlertaModal } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-modal-alerta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-alerta.component.html',
  styleUrls: ['./modal-alerta.component.css']
})
export class ModalAlertaComponent implements OnInit, OnDestroy {
  alerta: AlertaModal | null = null;
  private sub: Subscription | null = null;

  constructor(private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.sub = this.notificacionService.alerta$.subscribe((alerta) => {
      this.alerta = alerta;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  aceptar(): void {
    this.notificacionService.cerrar(true);
  }

  cancelar(): void {
    this.notificacionService.cerrar(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('alerta-backdrop')) {
      this.cancelar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.alerta) {
      this.cancelar();
    }
  }

  @HostListener('document:keydown.enter')
  onEnter(): void {
    if (this.alerta) {
      this.aceptar();
    }
  }
}
