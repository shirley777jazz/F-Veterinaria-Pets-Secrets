export interface Mascota {
  id?: number;
  nombre: string;
  especie: 'perro' | 'gato' | 'conejo' | 'ave' | 'otro';
  raza?: string;
  genero: 'macho' | 'hembra';
  edad?: number;
  tamano?: 'pequeño' | 'mediano' | 'grande';
  descripcion?: string;
  fotoUrl?: string;
  tipo?: 'propia' | 'adopcion';
  estadoAdopcion: 'disponible' | 'adoptado' | 'en_proceso' | 'no_disponible';
  vacunado?: boolean;
  esterilizado?: boolean;
  buenoConNinos?: boolean;
  buenoConOtrasMascotas?: boolean;
  fechaIngreso?: string;
  fechaAdopcion?: string;
  usuarioNombre?: string;
  usuarioId?: number;
}

export interface MascotaRequest {
  nombre: string;
  especie: 'perro' | 'gato' | 'conejo' | 'ave' | 'otro';
  raza?: string;
  genero: 'macho' | 'hembra';
  edad?: number;
  tamano?: 'pequeño' | 'mediano' | 'grande';
  descripcion?: string;
  fotoUrl?: string;
  tipo?: 'propia' | 'adopcion';
  vacunado?: boolean;
  esterilizado?: boolean;
  buenoConNinos?: boolean;
  buenoConOtrasMascotas?: boolean;
}

export interface MascotaEstadisticas {
  disponibles: number;
  adoptadas: number;
  enProceso: number;
  noDisponibles: number;
  total: number;
}
