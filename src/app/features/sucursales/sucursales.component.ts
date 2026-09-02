import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { CiudadDTO, SucursalDTO, SucursalCrearDTO } from '../../core/models/organizacion.models';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent implements OnInit {
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

  constructor(private orgService: OrganizacionService) {}

  ngOnInit(): void {
    this.cargarCiudades();
    this.cargarSucursales();
  }

  cargarCiudades(): void {
    this.orgService.gestionarCiudades().subscribe({
      next: (data) => (this.ciudades = data),
      error: () => (this.mensajeError = 'Error al cargar lista de ciudades.')
    });
  }

  cargarSucursales(): void {
    this.cargando = true;
    this.orgService.gestionarSucursales(this.filtroCiudadId || undefined).subscribe({
      next: (data) => {
        this.sucursales = data;
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'Error al cargar sucursales.';
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
        this.mensajeError = err.error?.detail || 'Error al registrar ciudad.';
      }
    });
  }

  crearSucursal(): void {
    if (!this.nuevaSucursal.ciudad_id || !this.nuevaSucursal.nombre || !this.nuevaSucursal.direccion) {
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
        this.mensajeError = err.error?.detail || 'Error al registrar sucursal.';
      }
    });
  }

  ajustarTarifas(sucursal: SucursalDTO): void {
    const base = prompt(`Tarifa base de delivery para '${sucursal.nombre}' (Bs):`, sucursal.tarifa_base_delivery.toString());
    if (base === null) return;

    const inc = prompt(`Incremento por anillo para '${sucursal.nombre}' (Bs):`, sucursal.incremento_anillo_delivery.toString());
    if (inc === null) return;

    this.orgService.configurarTarifasDelivery(sucursal.id, {
      tarifa_base_delivery: parseFloat(base) || 0,
      incremento_anillo_delivery: parseFloat(inc) || 0
    }).subscribe({
      next: (s) => {
        this.mensajeExito = `Tarifas de '${s.nombre}' actualizadas a Base: Bs. ${s.tarifa_base_delivery} / Inc: Bs. ${s.incremento_anillo_delivery}.`;
        this.cargarSucursales();
      },
      error: (err) => {
        this.mensajeError = err.error?.detail || 'Error al ajustar tarifas.';
      }
    });
  }
}
