import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminPedidosService, PedidoEstadisticas, FiltrosPedidos } from './admin-pedidos.service';
import { PedidoDetalle } from '../../../../../core/services/pedidos.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent implements OnInit {
  pedidos: PedidoDetalle[] = [];
  pedidosFiltrados: PedidoDetalle[] = [];
  searchTerm: string = '';
  filtroEstado: string = '';
  mostrarModal: boolean = false;
  pedidoEditando: PedidoDetalle | null = null;
  pedidoDetalle: PedidoDetalle | null = null;
  mostrarDetalle: boolean = false;
  cargandoPedidos: boolean = true;
  errorMensaje: string = '';
  
  // Estadísticas
  stats: PedidoEstadisticas = {
    totalPedidos: 0,
    pendiente: 0,
    procesando: 0,
    enviado: 0,
    entregado: 0,
    cancelado: 0,
    valorTotal: 0
  };

  // Estados disponibles
  estados: string[] = [];

  constructor(private adminPedidosService: AdminPedidosService) {}

  ngOnInit(): void {
    this.estados = this.adminPedidosService.getEstadosDisponibles();
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargandoPedidos = true;
    this.errorMensaje = '';

    this.adminPedidosService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos) => {
        console.log('=== PEDIDOS CARGADOS DESDE EL SERVIDOR ===');
        console.log('Número de pedidos:', pedidos.length);
        console.log('Primeros 2 pedidos:', pedidos.slice(0, 2));
        
        this.pedidos = pedidos;
        this.filtrarPedidos();
        this.calcularEstadisticas();
        this.cargandoPedidos = false;
      },
      error: (error) => {
        console.error('Error al cargar pedidos:', error);
        this.errorMensaje = 'Error al cargar los pedidos. Por favor, inténtalo de nuevo.';
        this.cargandoPedidos = false;
        this.pedidos = [];
        this.pedidosFiltrados = [];
      }
    });
  }

  calcularEstadisticas(): void {
    // Debug: Ver qué estados están llegando del backend
    const estadosEncontrados = [...new Set(this.pedidos.map(p => p.estado))];
    console.log('Estados encontrados en los pedidos:', estadosEncontrados);
    
    this.stats.totalPedidos = this.pedidos.length;
    this.stats.pendiente = this.pedidos.filter(p => p.estado === 'pendiente').length;
    this.stats.procesando = this.pedidos.filter(p => p.estado === 'procesando').length;
    this.stats.enviado = this.pedidos.filter(p => p.estado === 'enviado').length;
    this.stats.entregado = this.pedidos.filter(p => p.estado === 'entregado').length;
    this.stats.cancelado = this.pedidos.filter(p => p.estado === 'cancelado').length;
    this.stats.valorTotal = this.pedidos.reduce((total, p) => total + p.total, 0);
    
    console.log('Estadísticas calculadas:', this.stats);
  }

  filtrarPedidos(): void {
    let pedidosFiltrados = this.pedidos;
    
    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido =>
        pedido.codigo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pedido.usuarioNombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pedido.usuarioEmail?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        pedido.detalles.some(detalle => detalle.productoNombre.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }
    
    // Filtrar por estado
    if (this.filtroEstado) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido =>
        pedido.estado === this.filtroEstado
      );
    }
    
    this.pedidosFiltrados = pedidosFiltrados;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroEstado = '';
    this.filtrarPedidos();
  }

  aplicarFiltros(): void {
    this.filtrarPedidos();
  }

  verDetalle(pedido: PedidoDetalle): void {
    this.pedidoDetalle = pedido;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.pedidoDetalle = null;
  }

  cambiarEstado(pedido: PedidoDetalle, nuevoEstado: string): void {
    if (!nuevoEstado || nuevoEstado === pedido.estado) {
      console.log('Estado no cambiado:', nuevoEstado, '=', pedido.estado);
      return;
    }
    
    console.log('=== CAMBIANDO ESTADO ===');
    console.log('Pedido:', pedido.codigo, 'ID:', pedido.id);
    console.log('Estado actual:', pedido.estado);
    console.log('Nuevo estado:', nuevoEstado);
    
    this.adminPedidosService.actualizarEstadoPedido(pedido.id, nuevoEstado).subscribe({
      next: (pedidoActualizado: PedidoDetalle) => {
        console.log('=== ESTADO ACTUALIZADO EXITOSAMENTE ===');
        console.log('Respuesta del servidor:', pedidoActualizado);
        console.log('Nuevo estado confirmado:', pedidoActualizado.estado);
        
        const index = this.pedidos.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
          console.log('Actualizando pedido en índice:', index);
          this.pedidos[index] = pedidoActualizado;
          this.filtrarPedidos();
          this.calcularEstadisticas();
        } else {
          console.error('No se encontró el pedido en la lista local');
        }
      },
      error: (error: any) => {
        console.error('=== ERROR AL CAMBIAR ESTADO ===');
        console.error('Error completo:', error);
        console.error('Código de error:', error.status);
        console.error('Mensaje:', error.message);
        this.errorMensaje = 'Error al cambiar el estado del pedido: ' + (error.message || 'Error desconocido');
        // Forzar recarga para revertir el cambio visual
        this.cargarPedidos();
      }
    });
  }

  eliminarPedido(pedido: PedidoDetalle): void {
    // Funcionalidad de eliminación no disponible por el momento
    alert('La funcionalidad de eliminar pedidos no está disponible en este momento.');
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.pedidoEditando = null;
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    
    // Si es string en formato YYYY-MM-DD, crear fecha sin problemas de zona horaria
    if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = fecha.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-ES');
    }
    
    // Si es string en formato ISO, extraer solo la fecha
    if (typeof fecha === 'string' && fecha.includes('T')) {
      const fechaSolo = fecha.split('T')[0];
      const [year, month, day] = fechaSolo.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-ES');
    }
    
    // Para otros casos, usar directamente
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente':
        return 'badge-pendiente';
      case 'procesando':
        return 'badge-procesando';
      case 'enviado':
        return 'badge-enviado';
      case 'entregado':
        return 'badge-entregado';
      case 'cancelado':
        return 'badge-cancelado';
      default:
        return 'badge-pendiente';
    }
  }

  formatPrice(price: number): string {
    return `S/${price.toFixed(2)}`;
  }




  exportarPedidos(): void {
    // Funcionalidad de exportación
    const dataStr = JSON.stringify(this.pedidosFiltrados, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pedidos.json';
    link.click();
  }



  // Obtener lista de estados disponibles
  getEstadosDisponibles(): string[] {
    return ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
  }

  // Obtener nombre legible del estado
  getNombreEstado(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'procesando': return 'Procesando';
      case 'enviado': return 'Enviado';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  }

  // Obtener fecha mínima para el input date (hoy)
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Formatear fecha para el input (evitar problemas de zona horaria)
  formatearFechaParaInput(fecha: string | Date | undefined): string {
    if (!fecha) return '';
    
    if (typeof fecha === 'string') {
      // Si es string, verificar si ya está en formato correcto YYYY-MM-DD
      if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return fecha;
      }
      // Si es una fecha ISO, extraer solo la parte de la fecha
      if (fecha.includes('T')) {
        return fecha.split('T')[0];
      }
    }
    
    // Si es Date object, convertir cuidadosamente
    const dateObj = new Date(fecha);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Actualizar solo la fecha de entrega
  actualizarFechaEntrega(pedido: PedidoDetalle, fechaEntrega: string): void {
    if (!fechaEntrega) {
      console.log('Fecha vacía, no se actualiza');
      return;
    }
    
    console.log('=== ACTUALIZANDO FECHA DE ENTREGA ===');
    console.log('Pedido ID:', pedido.id, 'Código:', pedido.codigo);
    console.log('Fecha seleccionada (raw):', fechaEntrega);
    console.log('Fecha actual del pedido:', pedido.fechaEntrega);
    
    // Usar directamente la fecha del input sin conversiones que causen problemas de zona horaria
    const fechaFormateada = fechaEntrega; // Ya viene en formato YYYY-MM-DD
    
    console.log('Fecha formateada para enviar:', fechaFormateada);
    
    this.adminPedidosService.actualizarFechaEntrega(pedido.id, fechaFormateada).subscribe({
      next: (pedidoActualizado: PedidoDetalle) => {
        console.log('=== FECHA ACTUALIZADA EXITOSAMENTE ===');
        console.log('Respuesta del servidor:', pedidoActualizado);
        console.log('Nueva fecha de entrega:', pedidoActualizado.fechaEntrega);
        
        const index = this.pedidos.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.filtrarPedidos();
        }
      },
      error: (error: any) => {
        console.error('=== ERROR AL ACTUALIZAR FECHA ===');
        console.error('Error completo:', error);
        this.errorMensaje = 'Error al actualizar la fecha de entrega: ' + (error.message || 'Error desconocido');
        // Forzar recarga para revertir el cambio visual
        this.cargarPedidos();
      }
    });
  }
}
