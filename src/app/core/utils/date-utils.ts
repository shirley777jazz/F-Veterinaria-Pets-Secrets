/**
 * Utilidades para parsear y formatear fechas de forma segura y robusta.
 * Maneja arrays de Spring Boot [año, mes, día, hora, min, seg], strings ISO,
 * timestamps y objetos Date, evitando cualquier 'Invalid Date'.
 */

export function parsearFechaObj(fecha: any): Date | null {
  if (fecha === null || fecha === undefined || fecha === '') {
    return null;
  }

  if (fecha instanceof Date) {
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  // Si Spring Boot serializó como array: [año, mes, día, hora?, min?, seg?]
  if (Array.isArray(fecha)) {
    if (fecha.length >= 3) {
      const year = Number(fecha[0]);
      const month = Number(fecha[1]) - 1; // Mes en JS es 0-11
      const day = Number(fecha[2]);
      const hour = fecha.length > 3 ? Number(fecha[3]) : 0;
      const min = fecha.length > 4 ? Number(fecha[4]) : 0;
      const sec = fecha.length > 5 ? Number(fecha[5]) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  if (typeof fecha === 'number') {
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof fecha === 'string') {
    const str = fecha.trim();
    if (!str) return null;

    // Formato solo fecha YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return isNaN(date.getTime()) ? null : date;
    }

    // Reemplazar espacio por T para parsear ISO
    const isoStr = str.replace(' ', 'T');
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      return d;
    }

    // Intento con división manual de partes
    const datePart = str.split(/[ T]/)[0];
    const parts = datePart.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
  }

  return null;
}

export function formatearFecha(fecha: any, formato?: 'corto' | 'largo' | Intl.DateTimeFormatOptions): string {
  const d = parsearFechaObj(fecha);
  if (!d) return '';

  if (formato === 'largo') {
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (typeof formato === 'object') {
    return d.toLocaleDateString('es-ES', formato);
  }

  // Formato corto por defecto: DD/MM/YYYY
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatearFechaParaInput(fecha: any): string {
  const d = parsearFechaObj(fecha);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}
