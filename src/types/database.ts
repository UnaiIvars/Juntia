export type EstadoPlan = 'borrador' | 'votando' | 'confirmado' | 'archivado';
export type RolMiembro = 'administrador' | 'miembro';
export type ValorVoto = -1 | 0 | 1; // -1: No, 0: Neutral, 1: Me encanta

export interface Perfil {
  id: string;
  email: string;
  nombre_completo: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  cambios_nombre_mes?: number;
  fecha_ultimo_cambio_nombre?: string | null;
  creado_en: string;
  actualizado_en: string;
}

export type EstadoAmistad = 'pendiente' | 'aceptada' | 'rechazada';

export interface Amistad {
  id: string;
  solicitante_id: string;
  receptor_id: string;
  estado: EstadoAmistad;
  creado_en: string;
  actualizado_en: string;
  solicitante?: Perfil;
  receptor?: Perfil;
}

export type EstadoInvitacionPlan = 'pendiente' | 'aceptada' | 'rechazada';

export interface InvitacionPlan {
  id: string;
  plan_id: string;
  usuario_invitado_id: string;
  invitado_por: string;
  estado: EstadoInvitacionPlan;
  creado_en: string;
  actualizado_en: string;
  plan?: Plan;
  anfitrion?: Perfil;
  invitado?: Perfil;
}

export interface Lugar {
  id: string;
  id_externo?: string | null;
  nombre: string;
  categoria: string;
  nivel_precio: number; // 1 a 4
  coste_estimado_por_persona: number;
  direccion?: string | null;
  latitud: number;
  longitud: number;
  telefono?: string | null;
  sitio_web?: string | null;
  fotos: string[];
  creado_en: string;
}

export interface Plan {
  id: string;
  titulo: string;
  descripcion?: string | null;
  tipo_plan: string;
  fecha?: string | null;
  presupuesto_maximo?: number | null;
  distancia_maxima?: number | null;
  creador_id: string;
  codigo_invitacion: string;
  estado: EstadoPlan;
  lugar_confirmado_id?: string | null;
  fecha_confirmada?: string | null;
  fecha_inicio_objetivo?: string | null;
  fecha_fin_objetivo?: string | null;
  creado_en: string;
  actualizado_en: string;
  lugar_confirmado?: Lugar | null;
  miembros_conteo?: number;
}

export interface MiembroPlan {
  id: string;
  plan_id: string;
  usuario_id: string;
  rol: RolMiembro;
  preferencias_completadas: boolean;
  unido_en: string;
  perfil?: Perfil;
}

export interface Disponibilidad {
  id: string;
  miembro_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  esta_disponible: boolean;
  creado_en: string;
}

export interface Preferencias {
  id: string;
  miembro_id: string;
  presupuesto_maximo: number;
  categorias_preferidas: string[];
  distancia_maxima_km: number;
  latitud_usuario?: number | null;
  longitud_usuario?: number | null;
  restricciones_dieteticas: string[];
  actualizado_en: string;
}

export interface LugarPlan {
  id: string;
  plan_id: string;
  lugar_id: string;
  propuesto_por: string;
  puntuacion_compatibilidad: number;
  creado_en: string;
  lugar?: Lugar;
  proponente?: MiembroPlan;
  votos?: Voto[];
}

export interface Voto {
  id: string;
  lugar_plan_id: string;
  miembro_id: string;
  valor_voto: ValorVoto;
  creado_en: string;
}

export interface Mensaje {
  id: string;
  plan_id: string;
  miembro_id: string;
  contenido: string;
  creado_en: string;
  remitente?: MiembroPlan;
}

export interface Gasto {
  id: string;
  plan_id: string;
  pagado_por: string;
  titulo: string;
  monto: number;
  creado_en: string;
  pagador?: MiembroPlan;
  participantes?: ParticipanteGasto[];
}

export interface ParticipanteGasto {
  id: string;
  gasto_id: string;
  miembro_id: string;
  monto_cuota: number;
  esta_liquidado: boolean;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  cuerpo: string;
  enlace?: string | null;
  leida: boolean;
  creado_en: string;
}

export interface Foto {
  id: string;
  plan_id: string;
  subido_por: string;
  url_foto: string;
  pie_de_foto?: string | null;
  creado_en: string;
}

export interface Valoracion {
  id: string;
  lugar_id: string;
  usuario_id: string;
  puntuacion: number;
  comentario?: string | null;
  creado_en: string;
}
