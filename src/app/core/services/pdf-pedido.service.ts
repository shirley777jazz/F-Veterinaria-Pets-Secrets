import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatearFecha } from '../utils/date-utils';
import { PedidoDetalle } from './pedidos.service';
import { NotificacionService } from './notificacion.service';

@Injectable({
  providedIn: 'root'
})
export class PdfPedidoService {

  constructor(private notificacionService: NotificacionService) {}

  exportarComprobantePedido(pedido: PedidoDetalle, usuarioActual?: any): void {
    if (!pedido) {
      this.notificacionService.mostrarAdvertencia('No hay información disponible para exportar este pedido.', 'Comprobante no disponible');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor: [number, number, number] = [26, 78, 141]; // #1A4E8D
    const darkTextColor: [number, number, number] = [30, 41, 59];
    const grayColor: [number, number, number] = [100, 116, 139];
    const lightBg: [number, number, number] = [248, 250, 252];

    // ---- ENCABEZADO ----
    // Barra superior decorativa
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 8, 'F');

    // Logo texto / Marca
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PETS SECRETZ', 14, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Cuidado integral veterinario y tienda de mascotas', 14, 27);
    doc.text('Lima, Perú | baristas@support.com | Tel: 123-456-7890', 14, 32);

    // Caja de estado y número de comprobante a la derecha
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(125, 14, 71, 24, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(125, 14, 71, 24, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`COMPROBANTE DE PEDIDO`, 130, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const codigoTexto = pedido.codigo ? `${pedido.codigo} (#${pedido.id})` : `#${pedido.id}`;
    doc.text(codigoTexto, 130, 26);

    // Badge ENTREGADO
    doc.setFillColor(34, 197, 94); // Verde #22c55e
    doc.roundedRect(130, 29, 30, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREGADO', 134, 33.5);

    // Línea divisoria
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);

    // ---- SECCIONES DE INFORMACIÓN (CLIENTE Y ENTREGA) ----
    const startY = 48;

    // Caja Datos del Cliente
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(14, startY, 88, 38, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, 88, 38, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('DATOS DEL CLIENTE', 18, startY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const nombreCliente = pedido.usuarioNombre || usuarioActual?.nombreCompleto || usuarioActual?.nombre || 'Cliente';
    const emailCliente = pedido.usuarioEmail || usuarioActual?.email || 'No especificado';
    const telCliente = pedido.telefonoContacto || usuarioActual?.telefono || 'No especificado';

    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', 18, startY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(nombreCliente, 55), 35, startY + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 18, startY + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(emailCliente, 55), 35, startY + 21);

    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', 18, startY + 29);
    doc.setFont('helvetica', 'normal');
    doc.text(telCliente, 35, startY + 29);

    // Caja Datos de Entrega y Pedido
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(108, startY, 88, 38, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(108, startY, 88, 38, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('INFORMACIÓN DE ENTREGA', 112, startY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('Dirección:', 112, startY + 13);
    doc.setFont('helvetica', 'normal');
    const dirTxt = `${pedido.direccion || 'No especificada'} (${pedido.ciudad || 'Lima'})`;
    doc.text(doc.splitTextToSize(dirTxt, 55), 132, startY + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Método Pago:', 112, startY + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(String(pedido.metodoPago || 'Efectivo').toUpperCase(), 135, startY + 21);

    doc.setFont('helvetica', 'bold');
    doc.text('F. Pedido:', 112, startY + 29);
    doc.setFont('helvetica', 'normal');
    doc.text(formatearFecha(pedido.fechaPedido) || 'No registrada', 132, startY + 29);

    if (pedido.fechaEntrega) {
      doc.setFont('helvetica', 'bold');
      doc.text('F. Entrega:', 112, startY + 35);
      doc.setFont('helvetica', 'normal');
      doc.text(formatearFecha(pedido.fechaEntrega) || 'Entregado', 132, startY + 35);
    }

    // ---- TABLA DE PRODUCTOS ----
    const rows = (pedido.detalles || []).map((det, index) => {
      const nombre = det.productoNombre || 'Producto';
      const cantidad = det.cantidad || 1;
      const precioUnit = Number(det.precioUnitario || 0).toFixed(2);
      const subtotal = Number(det.subtotal || (det.cantidad * det.precioUnitario) || 0).toFixed(2);
      return [
        (index + 1).toString(),
        nombre,
        cantidad.toString(),
        `S/ ${precioUnit}`,
        `S/ ${subtotal}`
      ];
    });

    autoTable(doc, {
      startY: startY + 44,
      head: [['#', 'Descripción del Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [26, 78, 141],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: 14, right: 14 },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    // Posición final de la tabla
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 170;

    // ---- RESUMEN DE TOTALES ----
    const totalBoxX = 120;
    const totalBoxWidth = 76;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(totalBoxX, finalY, totalBoxWidth, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(totalBoxX, finalY, totalBoxWidth, 28, 2, 2, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Subtotal:', totalBoxX + 6, finalY + 7);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`S/ ${Number(pedido.subtotal || 0).toFixed(2)}`, totalBoxX + totalBoxWidth - 6, finalY + 7, { align: 'right' });

    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Costo de Envío:', totalBoxX + 6, finalY + 14);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`S/ ${Number(pedido.envio || 0).toFixed(2)}`, totalBoxX + totalBoxWidth - 6, finalY + 14, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(totalBoxX + 4, finalY + 18, totalBoxX + totalBoxWidth - 4, finalY + 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TOTAL PAGADO:', totalBoxX + 6, finalY + 24);
    doc.text(`S/ ${Number(pedido.total || 0).toFixed(2)}`, totalBoxX + totalBoxWidth - 6, finalY + 24, { align: 'right' });

    // Mensaje de conformidad
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Estado: Pedido entregado y verificado en destino a satisfacción del cliente.', 14, finalY + 10);
    doc.text('Este documento sirve como constancia oficial de entrega y comprobante de compra.', 14, finalY + 16);

    // ---- PIE DE PÁGINA ----
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 16, 196, pageHeight - 16);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Pets Secretz - Todos los derechos reservados.', 14, pageHeight - 10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 196, pageHeight - 10, { align: 'right' });

    // Guardar / Descargar PDF
    const filename = `Comprobante-Pedido-${pedido.codigo || pedido.id}.pdf`;
    doc.save(filename);
  }
}
