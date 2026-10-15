import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto, Categoria, ProductoRequest } from '../../../../../core/services/producto.service';
// import { NotificacionService } from '../../../../../core/services/notificacion.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  searchTerm: string = '';
  mostrarModal: boolean = false;
  productoEditando: Producto | null = null;
  cargando: boolean = false;
  
  // Propiedades para manejo de imagen
  imagenPreview: string | null = null;
  selectedFile: File | null = null;
  
  // Estadísticas
  stats = {
    totalProductos: 0,
    sinStock: 0,
    stockBajo: 0,
    valorInventario: 0
  };

  productoForm = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoriaId: 0,
    imagenUrl: '',
    stock: 0,
    estado: 'activo'
  };

  constructor(
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productoService.getAllProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = productos;
        this.calcularEstadisticas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mostrarError('Error al cargar los productos');
        this.cargando = false;
      }
    });
  }

  cargarCategorias(): void {
    this.productoService.getAllCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.mostrarError('Error al cargar las categorías');
      }
    });
  }

  calcularEstadisticas(): void {
    this.stats.totalProductos = this.productos.length;
    this.stats.sinStock = this.productos.filter(p => p.stock === 0).length;
    this.stats.stockBajo = this.productos.filter(p => p.stock > 0 && p.stock <= 10).length;
    this.stats.valorInventario = this.productos.reduce((total, p) => total + (p.precio * p.stock), 0);
  }

  filtrarProductos(): void {
    if (!this.searchTerm) {
      this.productosFiltrados = [...this.productos];
      return;
    }

    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      producto.categoria.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  abrirModalNuevo(): void {
    this.productoEditando = null;
    this.limpiarFormulario();
    this.mostrarModal = true;
  }

  limpiarFormulario(): void {
    this.productoForm = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoriaId: 0,
      imagenUrl: '',
      stock: 0,
      estado: 'activo'
    };
    this.imagenPreview = null;
    this.selectedFile = null;
  }

  editarProducto(producto: Producto): void {
    this.productoEditando = producto;
    this.productoForm = {
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      categoriaId: producto.categoria.id,
      imagenUrl: producto.imagenUrl || '',
      stock: producto.stock,
      estado: producto.estado
    };
    this.imagenPreview = producto.imagenUrl || null;
    this.mostrarModal = true;
  }

  eliminarProducto(producto: Producto): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${producto.nombre}"?`)) {
      this.productoService.eliminarProducto(producto.id).subscribe({
        next: () => {
          this.mostrarExito('Producto eliminado exitosamente');
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error al eliminar producto:', error);
          this.mostrarError('Error al eliminar el producto');
        }
      });
    }
  }

  async guardarProducto(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    let imagenUrl = this.productoForm.imagenUrl;

    // Si hay una nueva imagen seleccionada, subirla primero
    if (this.selectedFile) {
      try {
        const uploadResponse = await this.productoService.uploadImage(this.selectedFile).toPromise();
        if (uploadResponse && uploadResponse.success) {
          imagenUrl = `http://localhost:8080${uploadResponse.url}`;
        } else {
          this.mostrarError('Error al subir la imagen');
          return;
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        this.mostrarError('Error al subir la imagen');
        return;
      }
    }

    const request: ProductoRequest = {
      nombre: this.productoForm.nombre.trim(),
      descripcion: this.productoForm.descripcion || '',
      precio: Number(this.productoForm.precio),
      categoriaId: Number(this.productoForm.categoriaId),
      imagenUrl: imagenUrl || '',
      stock: Number(this.productoForm.stock) || 0,
      estado: this.productoForm.estado || 'activo'
    };

    if (this.productoEditando) {
      // Actualizar producto existente
      this.productoService.actualizarProducto(this.productoEditando.id, request).subscribe({
        next: () => {
          this.mostrarExito('Producto actualizado exitosamente');
          this.cerrarModal();
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          const errorMsg = error?.error?.message || error?.message || 'Error al actualizar el producto';
          this.mostrarError(errorMsg);
        }
      });
    } else {
      // Crear nuevo producto
      this.productoService.crearProducto(request).subscribe({
        next: () => {
          this.mostrarExito('Producto creado exitosamente');
          this.cerrarModal();
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          const errorMsg = error?.error?.message || error?.message || 'Error al crear el producto';
          this.mostrarError(errorMsg);
        }
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.productoForm.nombre || !this.productoForm.nombre.trim()) {
      this.mostrarError('El nombre es obligatorio');
      return false;
    }
    if (this.productoForm.precio <= 0) {
      this.mostrarError('El precio debe ser mayor a 0');
      return false;
    }
    if (!this.productoForm.categoriaId || Number(this.productoForm.categoriaId) === 0) {
      this.mostrarError('Debe seleccionar una categoría');
      return false;
    }
    if (this.productoForm.stock < 0) {
      this.mostrarError('El stock no puede ser negativo');
      return false;
    }
    return true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.limpiarFormulario();
  }

  // Manejo de archivos
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.mostrarError('Solo se permiten imágenes (JPEG, PNG, WebP)');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.mostrarError('La imagen no debe superar los 5MB');
        return;
      }

      this.selectedFile = file;
      
      // Crear preview de la imagen para mostrar al usuario
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imagenPreview = null;
    this.selectedFile = null;
    this.productoForm.imagenUrl = '';
    
    // Limpiar el input file
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }



  getCategoryBadgeClass(categoria?: string): string {
    if (!categoria) return 'bg-gray-100 text-gray-800';
    
    const colors: { [key: string]: string } = {
      'Comida': 'bg-green-100 text-green-800',
      'Alimentos': 'bg-green-100 text-green-800',
      'Accesorios': 'bg-blue-100 text-blue-800',
      'Medicamentos': 'bg-red-100 text-red-800',
      'Juguetes': 'bg-yellow-100 text-yellow-800',
      'Cuidado': 'bg-purple-100 text-purple-800'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800';
  }

  cambiarEstadoProducto(producto: Producto): void {
    const nuevoEstado = producto.estado === 'activo' ? 'inactivo' : 'activo';
    this.productoService.cambiarEstado(producto.id, nuevoEstado).subscribe({
      next: () => {
        this.mostrarExito(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        this.cargarProductos();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.mostrarError('Error al cambiar el estado del producto');
      }
    });
  }

  formatPrice(price: number): string {
    return `S/${price.toFixed(2)}`;
  }

  getStockBadgeClass(stock: number): string {
    if (stock === 0) return 'badge-sin-stock';
    if (stock <= 10) return 'badge-stock-bajo';
    return 'badge-en-stock';
  }

  getStockText(stock: number): string {
    if (stock === 0) return 'Sin Stock';
    if (stock <= 10) return 'Stock Bajo';
    return 'En Stock';
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === 'activo' ? 'badge-activo' : 'badge-inactivo';
  }

  getEstadoText(estado: string): string {
    return estado === 'activo' ? 'Activo' : 'Inactivo';
  }

  // Métodos de notificación simples
  private mostrarExito(mensaje: string): void {
    alert(`ÉXITO: ${mensaje}`);
  }

  private mostrarError(mensaje: string): void {
    alert(`ERROR: ${mensaje}`);
  }
}