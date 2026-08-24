'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { InvitacionPlan } from '@/types/database';

export async function responderInvitacionPlan(
  invitacionId: string,
  aceptar: boolean
): Promise<{ exito: boolean; planId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, error: 'Debes iniciar sesión.' };
  }

  const { data: invitacion, error: errInv } = await supabase
    .from('invitaciones_plan')
    .select('*, plan:planes(id, titulo)')
    .eq('id', invitacionId)
    .eq('usuario_invitado_id', user.id)
    .single();

  if (errInv || !invitacion) {
    return { exito: false, error: 'Invitación no encontrada.' };
  }

  if (aceptar) {
    const { error: errMiembro } = await supabase
      .from('miembros_plan')
      .upsert(
        {
          plan_id: invitacion.plan_id,
          usuario_id: user.id,
          rol: 'miembro',
          preferencias_completadas: false,
        },
        { onConflict: 'plan_id,usuario_id' }
      );

    if (errMiembro) {
      console.error('Error al unirse al plan desde invitación:', errMiembro);
      return { exito: false, error: errMiembro.message };
    }

    await supabase
      .from('invitaciones_plan')
      .update({ estado: 'aceptada', actualizado_en: new Date().toISOString() })
      .eq('id', invitacionId);

    revalidatePath('/dashboard', 'layout');
    revalidatePath(`/planes/${invitacion.plan_id}`, 'layout');
    return { exito: true, planId: invitacion.plan_id };
  } else {
    const { error: errRechazar } = await supabase
      .from('invitaciones_plan')
      .update({ estado: 'rechazada', actualizado_en: new Date().toISOString() })
      .eq('id', invitacionId)
      .eq('usuario_invitado_id', user.id);

    if (errRechazar) {
      return { exito: false, error: errRechazar.message };
    }

    revalidatePath('/dashboard', 'layout');
    return { exito: true };
  }
}

export async function obtenerInvitacionesPendientes(): Promise<{
  invitaciones: InvitacionPlan[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { invitaciones: [] };
  }

  const { data, error } = await supabase
    .from('invitaciones_plan')
    .select(`
      *,
      plan:planes (
        id,
        titulo,
        descripcion,
        tipo_plan,
        fecha,
        presupuesto_maximo,
        codigo_invitacion
      ),
      anfitrion:perfiles!invitaciones_plan_invitado_por_fkey (
        id,
        nombre_completo,
        username,
        avatar_url
      )
    `)
    .eq('usuario_invitado_id', user.id)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('Error al obtener invitaciones pendientes:', error);
    return { invitaciones: [], error: error.message };
  }

  return { invitaciones: (data as InvitacionPlan[]) || [] };
}
