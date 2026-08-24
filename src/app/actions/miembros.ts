'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface ResultadoAccionMiembro {
  exito: boolean;
  mensaje?: string;
  planId?: string;
}

export async function unirseAPlan(codigoInvitacion: string): Promise<ResultadoAccionMiembro> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      exito: false,
      mensaje: 'Debes iniciar sesión para unirte a este plan.',
    };
  }

  let codigoLimpio = codigoInvitacion.trim().toUpperCase().replace(/\s+/g, '');
  if (!codigoLimpio.startsWith('JNT-')) {
    codigoLimpio = `JNT-${codigoLimpio}`;
  }

  const { data: plan, error: errorPlan } = await supabase
    .from('planes')
    .select('id, titulo, creador_id')
    .eq('codigo_invitacion', codigoLimpio)
    .maybeSingle();

  if (!plan) {
    return {
      exito: false,
      mensaje: 'Código de invitación no válido o el plan no existe.',
    };
  }

  const nombreUsuario =
    user.user_metadata?.nombre_completo ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Usuario';

  await supabase.from('perfiles').upsert(
    {
      id: user.id,
      email: user.email!,
      nombre_completo: nombreUsuario,
      avatar_url: user.user_metadata?.avatar_url || null,
    },
    { onConflict: 'id' }
  );

  const { data: miembroExistente } = await supabase
    .from('miembros_plan')
    .select('id')
    .eq('plan_id', plan.id)
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (miembroExistente) {
    revalidatePath(`/planes/${plan.id}`);
    redirect(`/planes/${plan.id}`);
  }

  const { error: errorInsert } = await supabase.from('miembros_plan').insert({
    plan_id: plan.id,
    usuario_id: user.id,
    rol: 'miembro',
    preferencias_completadas: false,
  });

  if (errorInsert) {
    console.error('Error al unirse al plan:', errorInsert);
    return {
      exito: false,
      mensaje: 'No se pudo unir al plan. Inténtalo de nuevo.',
    };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath(`/planes/${plan.id}`);
  redirect(`/planes/${plan.id}`);
}

export async function abandonarPlan(planId: string): Promise<ResultadoAccionMiembro> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, mensaje: 'Debes iniciar sesión.' };
  }

  const { data: plan } = await supabase
    .from('planes')
    .select('id, creador_id')
    .eq('id', planId)
    .single();

  if (plan && plan.creador_id === user.id) {
    return {
      exito: false,
      mensaje: 'Como creador del plan, no puedes abandonarlo. Si lo deseas, puedes eliminar el plan.',
    };
  }

  const { error } = await supabase
    .from('miembros_plan')
    .delete()
    .eq('plan_id', planId)
    .eq('usuario_id', user.id);

  if (error) {
    console.error('Error al abandonar plan:', error);
    return { exito: false, mensaje: 'Error al abandonar el plan.' };
  }

  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard');
}
