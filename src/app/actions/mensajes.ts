'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Mensaje } from '@/types/database';

export interface MensajeConPerfil extends Omit<Mensaje, 'remitente'> {
  remitente?: {
    id: string;
    usuario_id: string;
    perfil: {
      id: string;
      nombre_completo: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export async function obtenerMensajesDelPlan(
  planId: string,
  limite = 80
): Promise<{ success: boolean; data?: MensajeConPerfil[]; error?: string }> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('mensajes')
      .select(`
        *,
        remitente:miembros_plan(
          id,
          usuario_id,
          perfil:perfiles(
            id,
            nombre_completo,
            avatar_url
          )
        )
      `)
      .eq('plan_id', planId)
      .order('creado_en', { ascending: true })
      .limit(limite);

    if (error) {
      console.error('Error al obtener mensajes:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as unknown as MensajeConPerfil[] };
  } catch (err) {
    console.error('Error en obtenerMensajesDelPlan:', err);
    return { success: false, error: 'Error inesperado al cargar los mensajes' };
  }
}

export async function enviarMensaje(
  planId: string,
  contenido: string
): Promise<{ success: boolean; data?: Mensaje; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Debes iniciar sesión.' };

    const contenidoLimpio = contenido.trim();
    if (!contenidoLimpio || contenidoLimpio.length > 2000) {
      return { success: false, error: 'El mensaje debe tener entre 1 y 2000 caracteres.' };
    }

    const admin = createAdminClient();
    const { data: miembro, error: errMiembro } = await admin
      .from('miembros_plan')
      .select('id')
      .eq('plan_id', planId)
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (errMiembro || !miembro) {
      return { success: false, error: 'No perteneces a este plan.' };
    }

    const { data: nuevoMensaje, error } = await admin
      .from('mensajes')
      .insert({
        plan_id: planId,
        miembro_id: miembro.id,
        contenido: contenidoLimpio,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error al enviar mensaje:', error);
      return { success: false, error: 'Error al enviar el mensaje.' };
    }

    revalidatePath(`/planes/${planId}`);
    return { success: true, data: nuevoMensaje as Mensaje };
  } catch (err) {
    console.error('Error en enviarMensaje:', err);
    return { success: false, error: 'Error inesperado al enviar el mensaje.' };
  }
}
