export interface Pedido {
  id?: number;
  usuarioId: number;
  fecha: string;
  total: number;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  direccionEntrega: string;
  telefono: string;
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id?: number;
  pedidoId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  productoNombre?: string;
  productoImagen?: string;
}

export interface PedidoRequest {
  direccion: string;
  ciudad?: string;
  codigoPostal?: string;
  telefonoContacto: string;
  metodoPago: string;
  fechaEntrega?: string;
  envio?: number;
}

export interface PedidoResponse {
  id: number;
  mensaje: string;
  pedido: Pedido;
}

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  ENVIADO = 'enviado',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado'
}

export enum MetodoPago {
  YAPE = 'yape',
  TARJETA = 'tarjeta'
}