import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type FontSizeOption = 'pequeno' | 'mediano' | 'grande';
export type ContrastOption = 'normal' | 'alto';
export type ThemeOption = 'claro' | 'oscuro';

export interface MantenimientoConfig {
  fontSize: FontSizeOption;
  contrast: ContrastOption;
  theme: ThemeOption;
}

@Injectable({
  providedIn: 'root'
})
export class MantenimientoService {
  private readonly STORAGE_KEY = 'pets_mantenimiento_config';

  private readonly defaultConfig: MantenimientoConfig = {
    fontSize: 'mediano',
    contrast: 'normal',
    theme: 'claro'
  };

  private configSubject = new BehaviorSubject<MantenimientoConfig>(this.cargarConfiguracion());
  public config$: Observable<MantenimientoConfig> = this.configSubject.asObservable();

  constructor() {
    this.aplicarConfiguracion(this.configSubject.value);
  }

  public getConfig(): MantenimientoConfig {
    return this.configSubject.value;
  }

  public setFontSize(fontSize: FontSizeOption): void {
    const nuevaConfig: MantenimientoConfig = { ...this.configSubject.value, fontSize };
    this.guardarYAplicar(nuevaConfig);
  }

  public setContrast(contrast: ContrastOption): void {
    const nuevaConfig: MantenimientoConfig = { ...this.configSubject.value, contrast };
    this.guardarYAplicar(nuevaConfig);
  }

  public setTheme(theme: ThemeOption): void {
    const nuevaConfig: MantenimientoConfig = { ...this.configSubject.value, theme };
    this.guardarYAplicar(nuevaConfig);
  }

  public resetConfig(): void {
    this.guardarYAplicar(this.defaultConfig);
  }

  private guardarYAplicar(config: MantenimientoConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('No se pudo guardar la configuración en localStorage', e);
    }
    this.configSubject.next(config);
    this.aplicarConfiguracion(config);
  }

  private cargarConfiguracion(): MantenimientoConfig {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fontSize: ['pequeno', 'mediano', 'grande'].includes(parsed.fontSize) ? parsed.fontSize : 'mediano',
          contrast: ['normal', 'alto'].includes(parsed.contrast) ? parsed.contrast : 'normal',
          theme: ['claro', 'oscuro'].includes(parsed.theme) ? parsed.theme : 'claro'
        };
      }
    } catch (e) {
      console.warn('Error leyendo configuración previa de mantenimiento', e);
    }
    return { ...this.defaultConfig };
  }

  public aplicarConfiguracion(config: MantenimientoConfig): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    // Atributos de datos
    root.setAttribute('data-font-size', config.fontSize);
    root.setAttribute('data-contrast', config.contrast);
    root.setAttribute('data-theme', config.theme);

    // Clases auxiliares
    root.classList.remove('font-pequeno', 'font-mediano', 'font-grande');
    root.classList.add(`font-${config.fontSize}`);

    root.classList.remove('contrast-normal', 'contrast-alto');
    root.classList.add(`contrast-${config.contrast}`);

    root.classList.remove('theme-claro', 'theme-oscuro');
    root.classList.add(`theme-${config.theme}`);
  }
}
