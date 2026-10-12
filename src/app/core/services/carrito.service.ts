import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError, throwError } from 'rxjs';

// Configuración directa de environment
const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// Interfaces para el carrito
export interface CarritoItem {
  id: number;
  productoId: number;
  productoNombre: string;
  productoImagenUrl?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Carrito {
  id?: number;
  usuarioId?: number;
  fechaCreacion?: string;
  items: CarritoItem[];
  total: number;
  totalItems: number;
}

// Interface para items temporales (sin login)
export interface CarritoItemTemporal {
  productoId: number;
  productoNombre: string;
  productoImagenUrl?: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CarritoItemRequest {
  productoId: number;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private baseUrl = `${environment.apiUrl}/carrito`;
  private CARRITO_TEMPORAL_KEY = 'carritoTemporal';
  
  // BehaviorSubject para mantener el estado del carrito
  private carritoSubject = new BehaviorSubject<Carrito | null>(null);
  public carrito$ = this.carritoSubject.asObservable();
  
  // BehaviorSubject para el contador de items del carrito
  private contadorItemsSubject = new BehaviorSubject<number>(0);
  public contadorItems$ = this.contadorItemsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar carrito al inicializar el servicio
    this.cargarCarrito();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // Verificar si el usuario está autenticado
  private estaAutenticado(): boolean {
    const token = localStorage.getItem('authToken');
    const isAuth = !!token;
    console.log('🔐 Verificación de autenticación:');
    console.log('- Token presente:', !!token);
    console.log('- Token (primeros 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
    console.log('- Está autenticado:', isAuth);
    return isAuth;
  }

  // Obtener carrito temporal del localStorage
  private obtenerCarritoTemporal(): CarritoItemTemporal[] {
    const carritoJson = localStorage.getItem(this.CARRITO_TEMPORAL_KEY);
    return carritoJson ? JSON.parse(carritoJson) : [];
  }

  // Guardar carrito temporal en localStorage
  private guardarCarritoTemporal(items: CarritoItemTemporal[]): void {
    localStorage.setItem(this.CARRITO_TEMPORAL_KEY, JSON.stringify(items));
  }

  // Convertir carrito temporal a formato estándar
  private convertirCarritoTemporal(items: CarritoItemTemporal[]): Carrito {
    const carritoItems: CarritoItem[] = items.map((item, index) => ({
      id: index,
      productoId: item.productoId,
      productoNombre: item.productoNombre,
      productoImagenUrl: item.productoImagenUrl,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.precioUnitario * item.cantidad
    }));

    const total = carritoItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = carritoItems.reduce((sum, item) => sum + item.cantidad, 0);

    return {
      items: carritoItems,
      total: total,
      totalItems: totalItems
    };
  }

  // Obtener carrito (autenticado o temporal)
  obtenerCarrito(): Observable<Carrito> {
    if (this.estaAutenticado()) {
      return this.http.get<Carrito>(this.baseUrl, { 
        headers: this.getHeaders() 
      }).pipe(
        tap(carrito => {
          this.carritoSubject.next(carrito);
          this.contadorItemsSubject.next(carrito.totalItems || 0);
        })
      );
    } else {
      // Carrito temporal
      const carritoTemporal = this.convertirCarritoTemporal(this.obtenerCarritoTemporal());
      this.carritoSubject.next(carritoTemporal);
      this.contadorItemsSubject.next(carritoTemporal.totalItems);
      return of(carritoTemporal);
    }
  }

  // Agregar producto al carrito (autenticado o temporal)
  agregarProducto(productoId: number, productoNombre: string, precioUnitario: number, cantidad: number = 1, productoImagenUrl?: string): Observable<Carrito> {
    if (this.estaAutenticado()) {
      // Usuario autenticado - usar backend
      const request: CarritoItemRequest = { productoId, cantidad };
      return this.http.post<Carrito>(`${this.baseUrl}/agregar`, request, {
        headers: this.getHeaders()
      }).pipe(
        tap(carrito => {
          this.carritoSubject.next(carrito);
          this.contadorItemsSubject.next(carrito.totalItems || 0);
        })
      );
    } else {
      // Carrito temporal
      const items = this.obtenerCarritoTemporal();
      const itemExistente = items.find(item => item.productoId === productoId);
      
      if (itemExistente) {
        itemExistente.cantidad += cantidad;
      } else {
        items.push({
          productoId,
          productoNombre,
          productoImagenUrl,
          cantidad,
          precioUnitario
        });
      }
      
      this.guardarCarritoTemporal(items);
      const carritoActualizado = this.convertirCarritoTemporal(items);
      this.carritoSubject.next(carritoActualizado);
      this.contadorItemsSubject.next(carritoActualizado.totalItems);
      
      return of(carritoActualizado);
    }
  }

  // Actualizar cantidad de un item
  actualizarCantidad(productoId: number, cantidad: number): Observable<Carrito> {
    if (this.estaAutenticado()) {
      // Para usuario autenticado, necesitamos obtener el itemId del carrito actual
      const carritoActual = this.carritoSubject.value;
      const item = carritoActual?.items.find(item => item.productoId === productoId);
      if (!item) {
        throw new Error('Item no encontrado en el carrito');
      }
      
      return this.http.put<Carrito>(`${this.baseUrl}/item/${item.id}?cantidad=${cantidad}`, {}, {
        headers: this.getHeaders()
      }).pipe(
        tap(carrito => {
          this.carritoSubject.next(carrito);
          this.contadorItemsSubject.next(carrito.totalItems || 0);
        })
      );
    } else {
      // Carrito temporal
      const items = this.obtenerCarritoTemporal();
      const itemIndex = items.findIndex(item => item.productoId === productoId);
      
      if (itemIndex !== -1) {
        if (cantidad <= 0) {
          items.splice(itemIndex, 1);
        } else {
          items[itemIndex].cantidad = cantidad;
        }
        
        this.guardarCarritoTemporal(items);
        const carritoActualizado = this.convertirCarritoTemporal(items);
        this.carritoSubject.next(carritoActualizado);
        this.contadorItemsSubject.next(carritoActualizado.totalItems);
        
        return of(carritoActualizado);
      }
      
      throw new Error('Item no encontrado en el carrito temporal');
    }
  }

  // Eliminar producto del carrito
  eliminarProducto(productoId: number): Observable<Carrito> {
    if (this.estaAutenticado()) {
      return this.http.delete<any>(`${this.baseUrl}/producto/${productoId}`, {
        headers: this.getHeaders()
      }).pipe(
        tap(response => {
          // Convertir la respuesta del backend al formato del frontend
          if (response && response.items) {
            const carritoActualizado: Carrito = {
              id: response.id || 0,
              usuarioId: response.usuarioId || 0,
              fechaCreacion: response.fechaCreacion || new Date().toISOString(),
              items: response.items || [],
              total: response.total || 0,
              totalItems: response.totalItems || 0
            };
            
            this.carritoSubject.next(carritoActualizado);
            this.contadorItemsSubject.next(carritoActualizado.totalItems);
          }
        }),
        catchError(error => {
          console.error('Error al eliminar producto del carrito:', error);
          return throwError(() => error);
        })
      );
    } else {
      // Carrito temporal
      const items = this.obtenerCarritoTemporal();
      const itemsFiltrados = items.filter(item => item.productoId !== productoId);
      
      this.guardarCarritoTemporal(itemsFiltrados);
      const carritoActualizado = this.convertirCarritoTemporal(itemsFiltrados);
      this.carritoSubject.next(carritoActualizado);
      this.contadorItemsSubject.next(carritoActualizado.totalItems);
      
      return of(carritoActualizado);
    }
  }

  // Vaciar carrito
  vaciarCarrito(): Observable<any> {
    if (this.estaAutenticado()) {
      return this.http.delete(`${this.baseUrl}/vaciar`, {
        headers: this.getHeaders()
      }).pipe(
        tap(() => {
          const carritoVacio: Carrito = {
            items: [],
            total: 0,
            totalItems: 0
          };
          this.carritoSubject.next(carritoVacio);
          this.contadorItemsSubject.next(0);
        })
      );
    } else {
      // Vaciar carrito temporal
      localStorage.removeItem(this.CARRITO_TEMPORAL_KEY);
      const carritoVacio: Carrito = {
        items: [],
        total: 0,
        totalItems: 0
      };
      this.carritoSubject.next(carritoVacio);
      this.contadorItemsSubject.next(0);
      return of(null);
    }
  }

  // Cargar carrito (método auxiliar)
  private cargarCarrito(): void {
    // Cargar inmediatamente, ya sea carrito temporal o de usuario
    this.obtenerCarrito().subscribe({
      next: () => {
        // Carrito cargado correctamente
      },
      error: (error) => {
        console.error('Error al cargar carrito:', error);
        // Si hay error con carrito autenticado, cargar carrito temporal
        if (!this.estaAutenticado()) {
          const carritoTemporal = this.convertirCarritoTemporal(this.obtenerCarritoTemporal());
          this.carritoSubject.next(carritoTemporal);
          this.contadorItemsSubject.next(carritoTemporal.totalItems);
        } else {
          // Si hay error con usuario autenticado, resetear el carrito
          this.carritoSubject.next({ items: [], total: 0, totalItems: 0 });
          this.contadorItemsSubject.next(0);
        }
      }
    });
  }

  // Método para migrar carrito temporal a usuario autenticado
  public async migrarCarritoTemporal(): Promise<void> {
    if (!this.estaAutenticado()) {
      return; // No hacer nada si no está autenticado
    }

    const carritoTemporal = this.obtenerCarritoTemporal();
    
    if (carritoTemporal.length > 0) {
      console.log('Migrando carrito temporal:', carritoTemporal);
      
      // Obtener carrito actual del usuario para fusionar
      try {
        const carritoUsuario = await this.http.get<Carrito>(this.baseUrl, { 
          headers: this.getHeaders() 
        }).toPromise();

        // Migrar cada item del carrito temporal
        for (const item of carritoTemporal) {
          try {
            // Usar el método de agregar producto que maneja la fusión automáticamente
            await this.agregarProducto(
              item.productoId, 
              item.productoNombre, 
              item.precioUnitario, 
              item.cantidad,
              item.productoImagenUrl
            ).toPromise();
            
            console.log('Item migrado exitosamente:', item.productoNombre);
          } catch (error) {
            console.error('Error migrando item:', item, error);
          }
        }
        
        // Limpiar carrito temporal después de la migración exitosa
        localStorage.removeItem(this.CARRITO_TEMPORAL_KEY);
        console.log('Migración completa. Carrito temporal limpiado.');
        
      } catch (error) {
        console.error('Error durante la migración del carrito:', error);
      }
    }
    
    // Cargar carrito actualizado del usuario
    this.cargarCarrito();
  }

  // Método para limpiar el carrito cuando el usuario cierra sesión
  public limpiarCarritoAlCerrarSesion(): void {
    this.carritoSubject.next(null);
    this.contadorItemsSubject.next(0);
  }

  // Obtener el estado actual del carrito
  public obtenerCarritoActual(): Carrito | null {
    return this.carritoSubject.value;
  }

  // Obtener el contador actual de items
  public obtenerContadorItems(): number {
    return this.contadorItemsSubject.value;
  }

  // Método auxiliar para bloquear decimales (mantener compatibilidad)
  bloquearDecimales(event: KeyboardEvent) {
    if (event.key === '.' || event.key === ',') {
      event.preventDefault();
    }
  }
}
