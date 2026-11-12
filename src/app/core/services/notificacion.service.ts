import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AlertaModal {
  tipo: 'exito' | 'error' | 'advertencia' | 'info' | 'confirmar';
  titulo?: string;
  mensaje: string;
  textoBoton?: string;
  textoBotonCancelar?: string;
  onAceptar?: () => void;
  onCancelar?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private alertaSubject = new BehaviorSubject<AlertaModal | null>(null);
  public alerta$: Observable<AlertaModal | null> = this.alertaSubject.asObservable();

  constructor() {
    // Interceptar alert nativo para que nunca se muestre "localhost:4200 dice"
    if (typeof window !== 'undefined') {
      window.alert = (msg: any) => {
        this.mostrarAlertaGenerica(String(msg ?? ''));
      };
    }
  }

  mostrarExito(mensaje: string, titulo: string = '¡Operación Exitosa!', onAceptar?: () => void, textoBoton: string = 'Aceptar'): void {
    this.alertaSubject.next({
      tipo: 'exito',
      titulo,
      mensaje,
      textoBoton,
      onAceptar
    });
  }

  mostrarError(mensaje: string, titulo: string = 'Ocurrió un Error', onAceptar?: () => void, textoBoton: string = 'Entendido'): void {
    this.alertaSubject.next({
      tipo: 'error',
      titulo,
      mensaje,
      textoBoton,
      onAceptar
    });
  }

  mostrarAdvertencia(mensaje: string, titulo: string = 'Atención', onAceptar?: () => void, textoBoton: string = 'Aceptar'): void {
    this.alertaSubject.next({
      tipo: 'advertencia',
      titulo,
      mensaje,
      textoBoton,
      onAceptar
    });
  }

  mostrarInfo(mensaje: string, titulo: string = 'Información', onAceptar?: () => void, textoBoton: string = 'Entendido'): void {
    this.alertaSubject.next({
      tipo: 'info',
      titulo,
      mensaje,
      textoBoton,
      onAceptar
    });
  }

  confirmar(
    mensaje: string,
    titulo: string = 'Confirmar Acción',
    onConfirmar?: () => void,
    onCancelar?: () => void,
    textoConfirmar: string = 'Aceptar',
    textoCancelar: string = 'Cancelar'
  ): void {
    this.alertaSubject.next({
      tipo: 'confirmar',
      titulo,
      mensaje,
      textoBoton: textoConfirmar,
      textoBotonCancelar: textoCancelar,
      onAceptar: onConfirmar,
      onCancelar: onCancelar
    });
  }

  cerrar(confirmado: boolean = true): void {
    const actual = this.alertaSubject.getValue();
    this.alertaSubject.next(null);
    if (actual) {
      if (confirmado && actual.onAceptar) {
        try {
          actual.onAceptar();
        } catch (e) {
          console.error('Error en callback onAceptar:', e);
        }
      } else if (!confirmado && actual.onCancelar) {
        try {
          actual.onCancelar();
        } catch (e) {
          console.error('Error en callback onCancelar:', e);
        }
      }
    }
  }

  private mostrarAlertaGenerica(mensaje: string): void {
    const lower = (mensaje || '').toLowerCase();
    if (lower.includes('éxito') || lower.includes('exitos') || lower.includes('confirmado') || lower.includes('guardado')) {
      this.mostrarExito(mensaje, '¡Éxito!');
    } else if (lower.includes('error') || lower.includes('falló') || lower.includes('expirado') || lower.includes('intente')) {
      this.mostrarError(mensaje, 'Error');
    } else if (lower.includes('requerid') || lower.includes('completa') || lower.includes('debes') || lower.includes('selecciona') || lower.includes('por favor')) {
      this.mostrarAdvertencia(mensaje, 'Atención Requerida');
    } else {
      this.mostrarInfo(mensaje, 'Aviso');
    }
  }
}
