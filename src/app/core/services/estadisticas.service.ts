import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadisticasResponse } from '../models/estadisticas.interface';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private apiUrl = 'http://localhost:8080/api/estadisticas';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerEstadisticasDashboard(): Observable<EstadisticasResponse> {
    return this.http.get<EstadisticasResponse>(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders()
    });
  }

  obtenerReporte(): Observable<EstadisticasResponse> {
    return this.http.get<EstadisticasResponse>(`${this.apiUrl}/reporte`, {
      headers: this.getHeaders()
    });
  }
}
