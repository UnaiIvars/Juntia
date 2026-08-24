'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Amistad, Perfil } from '@/types/database';

export async function buscarUsuarioPorUsername(
  username: string
): Promise<{ perfil: Perfil | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { perfil: null, error: 'No autenticado.' };

  const limpio = username.replace(/^@/, '').trim().toLowerCase();
  if (!limpio) return { perfil: null };

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .ilike('username', limpio)
    .neq('id', user.id)
    .maybeSingle();

  if (error) return { perfil: null, error: error.message };
  return { perfil: data };
}

export async function comprobarUsername(
  username: string
): Promise<{ disponible: boolean; error?: string }> {
  const supabase = await createClient();
  const limpio = username.replace(/^@/, '').trim().toLowerCase();

  if (!limpio || limpio.length < 3) {
    return { disponible: false, error: 'Mínimo 3 caracteres.' };
  }
  if (!/^[a-z0-9_\.]+$/.test(limpio)) {
    return { disponible: false, error: 'Solo letras, números, _ y .' };
  }

  const { data, error } = await supabase
    .from('perfiles')
    .select('id')
    .ilike('username', limpio)
    .maybeSingle();

  if (error) return { disponible: false, error: error.message };
  return { disponible: !data };
}

export async function guardarUsername(
  username: string
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exito: false, error: 'No autenticado.' };

  const limpio = username.replace(/^@/, '').trim().toLowerCase();

  const { disponible, error: errDisp } = await comprobarUsername(limpio);
  if (!disponible) return { exito: false, error: errDisp || 'Username no disponible.' };

  const { error } = await supabase
    .from('perfiles')
    .update({ username: limpio })
    .eq('id', user.id);

  if (error) return { exito: false, error: error.message };

  revalidatePath('/dashboard');
  return { exito: true };
}

export async function enviarSolicitudAmistad(
  receptorId: string
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exito: false, error: 'No autenticado.' };

  if (receptorId === user.id) {
    return { exito: false, error: 'No puedes enviarte una solicitud a ti mismo.' };
  }

  const { error } = await supabase.from('amistades').insert({
    solicitante_id: user.id,
    receptor_id: receptorId,
    estado: 'pendiente',
  });

  if (error) {
    if (error.code === '23505') {
      return { exito: false, error: 'Ya existe una solicitud con este usuario.' };
    }
    return { exito: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { exito: true };
}

export async function aceptarSolicitudAmistad(
  amistadId: string
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exito: false, error: 'No autenticado.' };

  const { error } = await supabase
    .from('amistades')
    .update({ estado: 'aceptada', actualizado_en: new Date().toISOString() })
    .eq('id', amistadId)
    .eq('receptor_id', user.id);

  if (error) return { exito: false, error: error.message };
  revalidatePath('/dashboard');
  return { exito: true };
}

export async function rechazarSolicitudAmistad(
  amistadId: string
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exito: false, error: 'No autenticado.' };

  const { error } = await supabase
    .from('amistades')
    .update({ estado: 'rechazada', actualizado_en: new Date().toISOString() })
    .eq('id', amistadId)
    .eq('receptor_id', user.id);

  if (error) return { exito: false, error: error.message };
  revalidatePath('/dashboard');
  return { exito: true };
}

export async function cancelarSolicitudAmistad(
  amistadId: string
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { exito: false, error: 'No autenticado.' };

  const { error } = await supabase
    .from('amistades')
    .delete()
    .eq('id', amistadId)
    .or(`solicitante_id.eq.${user.id},receptor_id.eq.${user.id}`);

  if (error) return { exito: false, error: error.message };
  revalidatePath('/dashboard');
  return { exito: true };
}

export async function obtenerAmigos(): Promise<{ amigos: Amistad[]; usuarioId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { amigos: [] };

  const { data, error } = await supabase
    .from('amistades')
    .select(`
      *,
      solicitante:perfiles!amistades_solicitante_id_fkey(*),
      receptor:perfiles!amistades_receptor_id_fkey(*)
    `)
    .eq('estado', 'aceptada')
    .or(`solicitante_id.eq.${user.id},receptor_id.eq.${user.id}`)
    .order('actualizado_en', { ascending: false });

  if (error) return { amigos: [], error: error.message };
  return { amigos: (data as Amistad[]) || [], usuarioId: user.id };
}

export async function obtenerSolicitudesPendientes(): Promise<{
  solicitudes: Amistad[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { solicitudes: [] };

  const { data, error } = await supabase
    .from('amistades')
    .select(`
      *,
      solicitante:perfiles!amistades_solicitante_id_fkey(*)
    `)
    .eq('receptor_id', user.id)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false });

  if (error) return { solicitudes: [], error: error.message };
  return { solicitudes: (data as Amistad[]) || [] };
}
