import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ContrastOption,
  FontSizeOption,
  MantenimientoConfig,
  MantenimientoService,
  ThemeOption
} from '../../../../core/services/mantenimiento.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.css'
})
export class MantenimientoComponent implements OnInit, OnDestroy {
  config: MantenimientoConfig = {
    fontSize: 'mediano',
    contrast: 'normal',
    theme: 'claro'
  };

  mensajeNotificacion: string | null = null;
  private timerNotificacion: any = null;
  private configSub?: Subscription;

  constructor(private mantenimientoService: MantenimientoService) {}

  ngOnInit(): void {
    this.configSub = this.mantenimientoService.config$.subscribe(cfg => {
      this.config = cfg;
    });
  }

  ngOnDestroy(): void {
    if (this.configSub) {
      this.configSub.unsubscribe();
    }
    if (this.timerNotificacion) {
      clearTimeout(this.timerNotificacion);
    }
  }

  seleccionarFuente(size: FontSizeOption): void {
    this.mantenimientoService.setFontSize(size);
    this.mostrarMensaje(`Tamaño de fuente cambiado a: ${this.obtenerEtiquetaFuente(size)}`);
  }

  seleccionarContraste(contrast: ContrastOption): void {
    this.mantenimientoService.setContrast(contrast);
    this.mostrarMensaje(`Contraste ajustado a: ${contrast === 'alto' ? 'Alto Contraste' : 'Contraste Normal'}`);
  }

  seleccionarTema(theme: ThemeOption): void {
    this.mantenimientoService.setTheme(theme);
    this.mostrarMensaje(`Modo de pantalla cambiado a: ${theme === 'oscuro' ? 'Modo Oscuro' : 'Modo Claro'}`);
  }

  restablecerValores(): void {
    this.mantenimientoService.resetConfig();
    this.mostrarMensaje('Se han restablecido los valores de accesibilidad por defecto');
  }

  mostrarMensaje(msg: string): void {
    this.mensajeNotificacion = msg;
    if (this.timerNotificacion) {
      clearTimeout(this.timerNotificacion);
    }
    this.timerNotificacion = setTimeout(() => {
      this.mensajeNotificacion = null;
    }, 3000);
  }

  obtenerEtiquetaFuente(size: FontSizeOption): string {
    switch (size) {
      case 'pequeno': return 'Pequeño (14px)';
      case 'mediano': return 'Mediano (16px - Predeterminado)';
      case 'grande': return 'Grande (19px)';
      default: return size;
    }
  }
}
