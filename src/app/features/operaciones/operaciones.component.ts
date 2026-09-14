import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ciclo2Service } from '../../core/services/ciclo2.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ProductoService } from '../../core/services/producto.service';
import { ReporteVentas } from '../../core/models/ciclo2.models';
import { SucursalDTO } from '../../core/models/organizacion.models';
import { VarianteDTO } from '../../core/models/catalogo.models';

@Component({ selector:'app-operaciones', standalone:true, imports:[CommonModule,FormsModule], templateUrl:'./operaciones.component.html', styleUrls:['./operaciones.component.css'] })
export class OperacionesComponent implements OnInit {
  tab:'ventas'|'devolucion'|'merma'='ventas'; sucursales:SucursalDTO[]=[]; variantes:VarianteDTO[]=[]; sucursal=''; desde=''; hasta=''; reporte?:ReporteVentas;
  detalleVenta=''; cantidadDev=1; motivo=''; variante=''; cantidadMerma=1; causa=''; cargando=false; procesando=false; error=''; exito='';
  constructor(private api:Ciclo2Service,public auth:AuthService,private org:OrganizacionService,private productos:ProductoService){}
  ngOnInit(){const u=this.auth.obtenerUsuarioActual();this.sucursal=u?.sucursal_id||'';this.org.gestionarSucursales().subscribe(s=>this.sucursales=s);this.productos.gestionarVariantes().subscribe(v=>this.variantes=v);if(this.sucursal)this.cargarVentas()}
  cargarVentas(){if(!this.sucursal)return;this.cargando=true;this.api.reporteVentas(this.sucursal,{desde:this.desde?new Date(this.desde).toISOString():'',hasta:this.hasta?new Date(this.hasta).toISOString():''}).subscribe({next:r=>{this.reporte=r;this.cargando=false},error:e=>{this.error=this.msg(e);this.cargando=false}})}
  devolver(){if(!this.detalleVenta||this.cantidadDev<1||this.procesando)return;this.procesando=true;this.api.devolver(this.detalleVenta,this.cantidadDev,this.motivo||undefined).subscribe({next:()=>{this.procesando=false;this.exito='Devolución registrada. El inventario disponible fue actualizado.';this.detalleVenta='';this.motivo=''},error:e=>{this.procesando=false;this.error=this.msg(e)}})}
  mermar(){if(!this.variante||!this.sucursal||!this.causa.trim()||this.cantidadMerma<1||this.procesando)return;this.procesando=true;this.api.registrarMerma(this.variante,this.sucursal,this.cantidadMerma,this.causa.trim()).subscribe({next:()=>{this.procesando=false;this.exito='Merma registrada con su movimiento de inventario.';this.variante='';this.causa=''},error:e=>{this.procesando=false;this.error=this.msg(e)}})}
  private msg(e:any){return e?.error?.detail||'No se pudo completar la operación.'}
}
