import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { CiudadDTO, SucursalDTO, SucursalCrearDTO } from '../../core/models/organizacion.models';
import { formatearErrorApi } from '../../core/utils/error-handler.util';
import {
  bloquearScrollBody,
  desbloquearScrollBody,
  atraparFocoModal,
  enfocarPrimerElemento,
  devolverFocoDisparador
} from '../../core/utils/modal-accessibility.util';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent implements OnInit, OnDestroy {
  ciudades: CiudadDTO[] = [];
  sucursales: SucursalDTO[] = [];

  filtroCiudadId = '';
  nuevaCiudadNombre = '';

  nuevaSucursal: SucursalCrearDTO = {
    ciudad_id: '',
    nombre: '',
    direccion: '',
    telefono: '',
    numero_anillo: 1,
    tarifa_base_delivery: 15.00,
    incremento_anillo_delivery: 3.00,
    anillo_minimo_delivery: 1,
    anillo_maximo_delivery: 10,
    delivery_activo: true
  };

  cargando = false;
  guardandoCiudad = false;
  guardandoSucursal = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;
  sucursalTarifas: SucursalDTO | null = null;
  tarifaBaseEdicion = 0;
  incrementoEdicion = 0;

  @ViewChild('modalTarifasBox') modalTarifasBox?: ElementRef<HTMLElement>;
  private disparadorPrevio: HTMLElement | null = null;

  constructor(private orgService: OrganizacionService) {}

  ngOnInit(): void {
    this.cargarCiudades();
    this.cargarSucursales();
  }

  cargarCiudades(): void {
    this.orgService.gestionarCiudades().subscribe({
      next: (data) => (this.ciudades = data),
      error: (err) => (this.mensajeError = formatearErrorApi(err, 'Error al cargar lista de ciudades.'))
    });
  }

  cargarSucursales(): void {
    this.cargando = true;
    this.orgService.gestionarSucursales(this.filtroCiudadId || undefined).subscribe({
      next: (data) => {
        this.sucursales = data;
        this.cargando = false;
      },
      error: (err) => {
        this.mensajeError = formatearErrorApi(err, 'Error al cargar sucursales.');
        this.cargando = false;
      }
    });
  }

  crearCiudad(): void {
    if (!this.nuevaCiudadNombre.trim()) {
      this.mensajeError = 'Ingrese el nombre de la ciudad.';
      return;
    }

    this.guardandoCiudad = true;
    this.mensajeError = null;

    this.orgService.registrarCiudad(this.nuevaCiudadNombre.trim()).subscribe({
      next: (c) => {
        this.guardandoCiudad = false;
        this.mensajeExito = `Ciudad '${c.nombre}' registrada correctamente.`;
        this.nuevaCiudadNombre = '';
        this.cargarCiudades();
      },
      error: (err) => {
        this.guardandoCiudad = false;
        this.mensajeError = formatearErrorApi(err, 'Error al registrar ciudad.');
      }
    });
  }

  crearSucursal(): void {
    if (!this.nuevaSucursal.ciudad_id || !this.nuevaSucursal.nombre?.trim() || !this.nuevaSucursal.direccion?.trim()) {
      this.mensajeError = 'Complete todos los campos obligatorios (*)';
      return;
    }

    this.guardandoSucursal = true;
    this.mensajeError = null;

    this.orgService.registrarSucursal(this.nuevaSucursal).subscribe({
      next: (s) => {
        this.guardandoSucursal = false;
        this.mensajeExito = `Sucursal '${s.nombre}' registrada exitosamente.`;
        this.nuevaSucursal = {
          ciudad_id: '',
          nombre: '',
          direccion: '',
          telefono: '',
          numero_anillo: 1,
          tarifa_base_delivery: 15.00,
          incremento_anillo_delivery: 3.00,
          anillo_minimo_delivery: 1,
          anillo_maximo_delivery: 10,
          delivery_activo: true
        };
        this.cargarSucursales();
      },
      error: (err) => {
        this.guardandoSucursal = false;
        this.mensajeError = formatearErrorApi(err, 'Error al registrar sucursal.');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sucursalTarifas) {
      desbloquearScrollBody();
    }
  }

  @HostListener('keydown.escape')
  alPresionarEscape(): void {
    if (this.sucursalTarifas && !this.guardandoSucursal) {
      this.cerrarTarifas();
    }
  }

  alManejarTabModal(event: KeyboardEvent): void {
    if (this.modalTarifasBox) {
      atraparFocoModal(event, this.modalTarifasBox.nativeElement);
    }
  }

  ajustarTarifas(sucursal: SucursalDTO, event?: Event): void {
    this.disparadorPrevio = (event?.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
    this.sucursalTarifas = sucursal;
    this.tarifaBaseEdicion = Number(sucursal.tarifa_base_delivery);
    this.incrementoEdicion = Number(sucursal.incremento_anillo_delivery);
    bloquearScrollBody();
    setTimeout(() => {
      if (this.modalTarifasBox) {
        enfocarPrimerElemento(this.modalTarifasBox.nativeElement);
      }
    }, 50);
  }

  cerrarTarifas(): void {
    if (this.sucursalTarifas) {
      desbloquearScrollBody();
      this.sucursalTarifas = null;
    }
    devolverFocoDisparador(this.disparadorPrevio);
    this.disparadorPrevio = null;
  }

  guardarTarifas(): void {
    if (!this.sucursalTarifas || this.tarifaBaseEdicion < 0 || this.incrementoEdicion < 0) return;
    this.guardandoSucursal = true;
    this.orgService.configurarTarifasDelivery(this.sucursalTarifas.id, {
      tarifa_base_delivery: this.tarifaBaseEdicion,
      incremento_anillo_delivery: this.incrementoEdicion
    }).subscribe({
      next: (s) => {
        this.guardandoSucursal = false;
        this.mensajeExito = `Tarifas de '${s.nombre}' actualizadas a Base: Bs. ${s.tarifa_base_delivery} / Inc: Bs. ${s.incremento_anillo_delivery}.`;
        this.cerrarTarifas();
        this.cargarSucursales();
      },
      error: (err) => {
        this.guardandoSucursal = false;
        this.mensajeError = formatearErrorApi(err, 'Error al ajustar tarifas.');
      }
    });
  }
}
