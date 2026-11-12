import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CarritoService, Carrito, CarritoItem } from '../../../core/services/carrito.service';
import { AuthService } from '../../../core/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { PedidoRequest, MetodoPago } from '../../../core/models/pedido';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
  pagoExitoso: boolean | null = null;
  mostrarTarjeta: boolean = false;
  mostrarYape: boolean = true;
  carrito: Carrito | null = null;
  cargandoCarrito: boolean = false;
  procesandoPago: boolean = false;
  errorPago: string | null = null;
  pedidoId: number | null = null;
  
  private carritoSub?: Subscription;

  constructor(
    private fb: FormBuilder, 
    private carritoService: CarritoService,
    private authService: AuthService,
    private pedidoService: PedidoService,
    private router: Router
  ) {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Verificar autenticación
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: '/checkout', message: 'Debes iniciar sesión para continuar con tu compra' } 
      });
      return;
    }

    // Migrar carrito temporal si es necesario
    this.carritoService.migrarCarritoTemporal();

    // Obtener datos del usuario actual desde AuthService
    const usuarioActual = this.authService.getCurrentUser();

    this.checkoutForm = this.fb.group({
      nombre: [usuarioActual?.nombreCompleto || '', Validators.required],
      email: [usuarioActual?.email || '', [Validators.required, Validators.email]],
      telefono: [usuarioActual?.telefono || '', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      ciudad: ['Lima'], // Ciudad por defecto
      direccion: ['', Validators.required],
      codigoPostal: [''],
      metodoPago: ['yape', Validators.required],
      // Campos de pago - se configurarán las validaciones dinámicamente
      numeroYape: [usuarioActual?.telefono || ''],
      numeroTarjeta: [''],
      fechaVencimiento: [''],
      cvv: ['']
    });

    this.toggleMetodoPago();
  }

  ngOnInit(): void {
    this.cargarCarrito();
    
    // Suscribirse a cambios del carrito
    this.carritoSub = this.carritoService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
    });
  }

  ngOnDestroy(): void {
    this.carritoSub?.unsubscribe();
  }

  private cargarCarrito(): void {
    this.cargandoCarrito = true;
    this.carritoService.obtenerCarrito().subscribe({
      next: (carrito) => {
        this.carrito = carrito;
        this.cargandoCarrito = false;
      },
      error: (error) => {
        console.error('Error al cargar carrito:', error);
        this.cargandoCarrito = false;
      }
    });
  }

  get total(): number {
    return this.carrito?.total || 0;
  }

  get items(): CarritoItem[] {
    return this.carrito?.items || [];
  }

  toggleMetodoPago() {
    // Configurar validaciones iniciales basadas en el método de pago actual
    this.updatePaymentValidations(this.checkoutForm.get('metodoPago')?.value);

    // Escuchar cambios en el método de pago
    this.checkoutForm.get('metodoPago')?.valueChanges.subscribe(value => {
      this.updatePaymentValidations(value);
    });
  }

  private updatePaymentValidations(metodoPago: string) {
    this.mostrarTarjeta = metodoPago === 'tarjeta';
    this.mostrarYape = metodoPago === 'yape';

    // Limpiar todas las validaciones de pago
    this.checkoutForm.get('numeroYape')?.clearValidators();
    this.checkoutForm.get('numeroTarjeta')?.clearValidators();
    this.checkoutForm.get('fechaVencimiento')?.clearValidators();
    this.checkoutForm.get('cvv')?.clearValidators();

    if (this.mostrarYape) {
      // Validaciones para YAPE
      const telefonoVal = this.checkoutForm.get('telefono')?.value;
      if (!this.checkoutForm.get('numeroYape')?.value && telefonoVal) {
        this.checkoutForm.get('numeroYape')?.setValue(telefonoVal);
      }
      this.checkoutForm.get('numeroYape')?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{9}$/)
      ]);
      // Limpiar campos de tarjeta
      this.checkoutForm.get('numeroTarjeta')?.clearValidators();
      this.checkoutForm.get('fechaVencimiento')?.clearValidators();
      this.checkoutForm.get('cvv')?.clearValidators();
      this.checkoutForm.get('numeroTarjeta')?.reset();
      this.checkoutForm.get('fechaVencimiento')?.reset();
      this.checkoutForm.get('cvv')?.reset();
    } else if (this.mostrarTarjeta) {
      // Validaciones para Tarjeta
      this.checkoutForm.get('numeroTarjeta')?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{16}$/)
      ]);
      this.checkoutForm.get('fechaVencimiento')?.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/(\d{2})$/)
      ]);
      this.checkoutForm.get('cvv')?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{3}$/)
      ]);
      // Limpiar campo de YAPE
      this.checkoutForm.get('numeroYape')?.reset();
    }

    // Actualizar el estado de validación
    this.checkoutForm.get('numeroYape')?.updateValueAndValidity();
    this.checkoutForm.get('numeroTarjeta')?.updateValueAndValidity();
    this.checkoutForm.get('fechaVencimiento')?.updateValueAndValidity();
    this.checkoutForm.get('cvv')?.updateValueAndValidity();
  }

  confirmarPago() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.errorPago = 'Por favor, completa todos los campos requeridos correctamente.';
      alert('Por favor, completa todos los campos requeridos correctamente (nombre, teléfono, dirección y datos de pago).');
      return;
    }

    if (!this.carrito || this.carrito.totalItems === 0) {
      this.errorPago = 'Tu carrito está vacío.';
      return;
    }

    this.procesandoPago = true;
    this.errorPago = null;

    // Preparar datos del pedido
    const formValues = this.checkoutForm.value;
    console.log('Valores del formulario:', formValues);
    
    const pedidoRequest: PedidoRequest = {
      direccion: formValues.direccion,
      ciudad: formValues.ciudad || 'Lima',
      codigoPostal: formValues.codigoPostal || '',
      telefonoContacto: formValues.telefono,
      metodoPago: formValues.metodoPago,
      envio: 0 // Envío gratis por defecto
    };

    console.log('Datos a enviar al servidor:', pedidoRequest);
    console.log('Token de autenticación:', localStorage.getItem('authToken') ? 'Presente' : 'Ausente');

    // Crear el pedido en el backend
    this.pedidoService.crearPedido(pedidoRequest).subscribe({
      next: (response) => {
        console.log('Pedido creado exitosamente:', response);
        this.pedidoId = response.id;
        this.pagoExitoso = true;
        this.procesandoPago = false;

        // Vaciar el carrito después del pago exitoso
        this.carritoService.vaciarCarrito().subscribe({
          next: () => {
            console.log('Carrito vaciado exitosamente');
          },
          error: (error) => {
            console.error('Error al vaciar carrito:', error);
          }
        });

        // Notificar al usuario y redirigir al catálogo de productos
        alert('¡Pedido realizado con éxito! Tu pedido ha sido confirmado correctamente.');
        this.router.navigate(['/productos']);
      },
      error: (error) => {
        console.error('Error completo al procesar el pago:', error);
        console.error('Status del error:', error.status);
        console.error('Error body:', error.error);
        console.error('Mensaje del error:', error.message);
        this.procesandoPago = false;
        
        if (error.status === 400) {
          this.errorPago = error.error?.mensaje || error.error?.message || 'Error en los datos del pedido.';
        } else if (error.status === 401) {
          this.errorPago = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          this.router.navigate(['/login']);
        } else if (error.status === 409) {
          this.errorPago = 'Tu carrito está vacío o ha sido modificado.';
        } else if (error.status === 0) {
          this.errorPago = 'No se puede conectar con el servidor. Verifica tu conexión.';
        } else {
          this.errorPago = error.error?.mensaje || error.error?.message || 'Error al procesar el pago. Por favor, intenta nuevamente.';
        }
        
        this.pagoExitoso = false;
      }
    });
  }

  // Método para ir a ver el pedido creado
  verPedido() {
    if (this.pedidoId) {
      this.router.navigate(['/usuario/pedidos', this.pedidoId]);
    }
  }

  // Método para volver al inicio
  volverInicio() {
    this.router.navigate(['/']);
  }
}
