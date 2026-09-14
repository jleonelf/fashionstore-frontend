import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ciclo2Service } from '../../core/services/ciclo2.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { EstadoTraslado, Traslado } from '../../core/models/ciclo2.models';
import { SucursalDTO } from '../../core/models/organizacion.models';
@Component({selector:'app-traslados',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./traslados.component.html',styleUrls:['./traslados.component.css']})
export class TrasladosComponent implements OnInit {
  items:Traslado[]=[]; sucursales:SucursalDTO[]=[]; estado=''; sucursal=''; cargando=false; procesando=''; error=''; exito=''; rechazo?:Traslado; motivo='';
  estados:EstadoTraslado[]=['SOLICITADO','APROBADO','RECHAZADO','DESPACHADO','RECIBIDO','CANCELADO'];
  constructor(private api:Ciclo2Service,public auth:AuthService,private org:OrganizacionService){}
  ngOnInit(){const u=this.auth.obtenerUsuarioActual();this.sucursal=u?.sucursal_id||'';this.org.gestionarSucursales().subscribe({next:s=>this.sucursales=s,error:()=>this.error='No pudimos cargar las sucursales.'});this.cargar();}
  cargar(){this.cargando=true;this.error='';const u=this.auth.obtenerUsuarioActual();const filtros:any={estado:this.estado};if(u?.rol==='ENCARGADO') filtros.sucursal_origen_id=this.sucursal; else if(this.sucursal) filtros.sucursal_origen_id=this.sucursal;this.api.listarTraslados(filtros).subscribe({next:p=>{this.items=p.items;this.cargando=false;},error:e=>{this.error=this.msg(e);this.cargando=false;}});}
  accion(t:Traslado,a:'aprobar'|'despachar'|'recibir'){this.procesando=t.id;this.api.transicionarTraslado(t.id,a).subscribe({next:()=>{this.procesando='';this.exito={aprobar:'Traslado aprobado.',despachar:'Traslado despachado.',recibir:'Traslado recibido.'}[a];this.cargar();},error:e=>{this.procesando='';this.error=this.msg(e);}});}
  confirmarRechazo(){if(!this.rechazo||this.procesando)return;this.procesando=this.rechazo.id;this.api.rechazarTraslado(this.rechazo.id,this.motivo).subscribe({next:()=>{this.procesando='';this.rechazo=undefined;this.motivo='';this.exito='Solicitud rechazada.';this.cargar();},error:e=>{this.procesando='';this.error=this.msg(e);}});}
  nombre(id:string){return this.sucursales.find(s=>s.id===id)?.nombre||id.slice(0,8)} etiqueta(v:string){return v.toLowerCase().replaceAll('_',' ')} private msg(e:any){return e?.error?.detail||'No se pudo completar la operación.'}
}
