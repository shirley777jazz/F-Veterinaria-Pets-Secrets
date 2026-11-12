export interface FiltroAdopcion {
  sede?: string;
  sedeId?: number;
  especie: string;
  tamano: string;
  genero: string;
  edadMaxima: number;
  vacunado: boolean;
  esterilizado: boolean;
  buenoConNinos: boolean;
  buenoConOtrasMascotas: boolean;
}
