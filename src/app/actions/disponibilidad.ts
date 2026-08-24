'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface FranjaEntrada {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  esta_disponible: boolean;
}

export interface ResultadoDisponibilidad {
  exito: boolean;
  mensaje?: string;
}

export async function guardarDisponibilidad(
  planId: string,
  franjas: FranjaEntrada[]
): Promise<ResultadoDisponibilidad> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, mensaje: 'Debes iniciar sesión para indicar tu disponibilidad.' };
  }

  const { data: miembro, error: errorMiembro } = await supabase
    .from('miembros_plan')
    .select('id')
    .eq('plan_id', planId)
    .eq('usuario_id', user.id)
    .single();

  if (errorMiembro || !miembro) {
    return { exito: false, mensaje: 'No formas parte de este plan.' };
  }

  if (franjas.length === 0) {
    return { exito: false, mensaje: 'Debes añadir al menos una franja horaria.' };
  }

  const regexHora = /^([01]\d|2[0-3]):[0-5]\d$/;

  for (const f of franjas) {
    if (!f.fecha) {
      return { exito: false, mensaje: 'Todas las franjas deben tener una fecha seleccionada.' };
    }
    const hIni = f.hora_inicio?.slice(0, 5);
    const hFin = f.hora_fin?.slice(0, 5);
    if (!hIni || !hFin || !regexHora.test(hIni) || !regexHora.test(hFin)) {
      return { exito: false, mensaje: 'Debes especificar horas válidas (HH:MM).' };
    }
    if (hIni === hFin) {
      return { exito: false, mensaje: 'La hora de inicio y fin no pueden ser iguales.' };
    }
  }

  const filasAInsertar = franjas.map((f) => ({
    miembro_id: miembro.id,
    fecha: f.fecha,
    hora_inicio: f.hora_inicio.slice(0, 5),
    hora_fin: f.hora_fin.slice(0, 5),
    esta_disponible: f.esta_disponible ?? true,
  }));

  for (const f of filasAInsertar) {
    await supabase
      .from('disponibilidad')
      .delete()
      .eq('miembro_id', miembro.id)
      .eq('fecha', f.fecha)
      .eq('hora_inicio', f.hora_inicio);
  }

  const { error: errorInsert } = await supabase
    .from('disponibilidad')
    .insert(filasAInsertar);

  if (errorInsert) {
    console.error('Error al insertar disponibilidad:', errorInsert);
    return { exito: false, mensaje: `Error al guardar disponibilidad: ${errorInsert.message}` };
  }

  await supabase
    .from('miembros_plan')
    .update({ preferencias_completadas: true })
    .eq('id', miembro.id);

  revalidatePath(`/planes/${planId}`);
  return { exito: true };
}

export async function votarFranjaPropuesta(
  planId: string,
  fecha: string,
  hora_inicio: string,
  hora_fin: string,
  esta_disponible: boolean
): Promise<ResultadoDisponibilidad> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, mensaje: 'Debes iniciar sesión para votar.' };
  }

  const { data: miembro } = await supabase
    .from('miembros_plan')
    .select('id')
    .eq('plan_id', planId)
    .eq('usuario_id', user.id)
    .single();

  if (!miembro) {
    return { exito: false, mensaje: 'No eres miembro de este plan.' };
  }

  const horaIni = hora_inicio.slice(0, 5);
  const horaFin = hora_fin.slice(0, 5);

  await supabase
    .from('disponibilidad')
    .delete()
    .eq('miembro_id', miembro.id)
    .eq('fecha', fecha)
    .eq('hora_inicio', horaIni);

  const { error } = await supabase.from('disponibilidad').insert({
    miembro_id: miembro.id,
    fecha,
    hora_inicio: horaIni,
    hora_fin: horaFin,
    esta_disponible,
  });

  if (error) {
    console.error('Error al registrar voto de horario:', error);
    return { exito: false, mensaje: error.message };
  }

  await supabase
    .from('miembros_plan')
    .update({ preferencias_completadas: true })
    .eq('id', miembro.id);

  revalidatePath(`/planes/${planId}`);
  return { exito: true };
}

export async function proponerNuevaFranja(
  planId: string,
  fecha: string,
  hora_inicio: string,
  hora_fin: string
): Promise<ResultadoDisponibilidad> {
  return votarFranjaPropuesta(planId, fecha, hora_inicio, hora_fin, true);
}

export async function eliminarFranjaDisponibilidad(
  franjaId: string,
  planId: string
): Promise<ResultadoDisponibilidad> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, mensaje: 'Debes iniciar sesión.' };
  }

  const { error } = await supabase
    .from('disponibilidad')
    .delete()
    .eq('id', franjaId);

  if (error) {
    console.error('Error al eliminar franja:', error);
    return { exito: false, mensaje: 'Error al eliminar la franja.' };
  }

  revalidatePath(`/planes/${planId}`);
  return { exito: true };
}
