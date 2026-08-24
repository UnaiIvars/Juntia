'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Lugar, LugarPlan } from '@/types/database';
import { LUGARES_SEMILLA, FOTOS_POR_DEFECTO_CATEGORIA } from '@/lib/geo';

export interface LugarPlanConDetalles extends LugarPlan {
  lugar: Lugar;
}

export async function obtenerLugaresDelPlan(planId: string): Promise<{ success: boolean; data?: LugarPlanConDetalles[]; error?: string }> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('lugares_plan')
      .select(`
        *,
        lugar:lugares(*)
      `)
      .eq('plan_id', planId)
      .order('creado_en', { ascending: true });

    if (error) {
      console.error('Error al obtener lugares del plan:', error);
      return { success: false, error: error.message };
    }

    const lugaresValidos = (data || []).filter((item) => item && item.lugar) as LugarPlanConDetalles[];
    return { success: true, data: lugaresValidos };
  } catch (error) {
    console.error('Error en obtenerLugaresDelPlan:', error);
    return { success: false, error: 'Error inesperado al cargar los lugares' };
  }
}

export async function añadirLugarAlPlan(
  planId: string,
  lugarData: {
    id_externo?: string | null;
    nombre: string;
    categoria: string;
    nivel_precio?: number;
    coste_estimado_por_persona?: number;
    direccion?: string | null;
    latitud: number;
    longitud: number;
    telefono?: string | null;
    sitio_web?: string | null;
    fotos?: string[];
  }
): Promise<{ success: boolean; data?: LugarPlan; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para añadir un lugar.' };
    }

    let { data: miembro } = await supabase
      .from('miembros_plan')
      .select('id')
      .eq('plan_id', planId)
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (!miembro) {
      const { data: plan } = await supabase
        .from('planes')
        .select('creador_id')
        .eq('id', planId)
        .single();

      if (plan && plan.creador_id === user.id) {
        const { data: nuevoMiembro, error: errorMiembro } = await supabase
          .from('miembros_plan')
          .insert({
            plan_id: planId,
            usuario_id: user.id,
            rol: 'administrador',
          })
          .select('id')
          .single();

        if (errorMiembro) {
          return { success: false, error: 'Error al verificar tu membresía en el plan.' };
        }
        miembro = nuevoMiembro;
      } else {
        return { success: false, error: 'No perteneces a este plan.' };
      }
    }

    let lugarId: string | null = null;

    if (lugarData.id_externo) {
      const { data: lugarExistente } = await supabase
        .from('lugares')
        .select('id')
        .eq('id_externo', lugarData.id_externo)
        .maybeSingle();

      if (lugarExistente) {
        lugarId = lugarExistente.id;
      }
    }

    if (!lugarId) {
      const { data: nuevoLugar, error: errorLugar } = await supabase
        .from('lugares')
        .insert({
          id_externo: lugarData.id_externo || null,
          nombre: lugarData.nombre,
          categoria: lugarData.categoria || 'restaurante',
          nivel_precio: lugarData.nivel_precio || 2,
          coste_estimado_por_persona: lugarData.coste_estimado_por_persona || 20,
          direccion: lugarData.direccion || null,
          latitud: lugarData.latitud,
          longitud: lugarData.longitud,
          telefono: lugarData.telefono || null,
          sitio_web: lugarData.sitio_web || null,
          fotos: lugarData.fotos && lugarData.fotos.length > 0 ? lugarData.fotos : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'],
        })
        .select('id')
        .single();

      if (errorLugar || !nuevoLugar) {
        console.error('Error insertando lugar:', errorLugar);
        return { success: false, error: 'No se pudo registrar el lugar en la base de datos.' };
      }
      lugarId = nuevoLugar.id;
    }

    const { data: lugarPlanExistente } = await supabase
      .from('lugares_plan')
      .select('id')
      .eq('plan_id', planId)
      .eq('lugar_id', lugarId)
      .maybeSingle();

    if (lugarPlanExistente) {
      return { success: false, error: 'Este lugar ya ha sido añadido al plan.' };
    }

    const { data: nuevoLugarPlan, error: errorLugarPlan } = await supabase
      .from('lugares_plan')
      .insert({
        plan_id: planId,
        lugar_id: lugarId,
        propuesto_por: miembro.id,
      })
      .select()
      .single();

    if (errorLugarPlan) {
      console.error('Error asociando lugar al plan:', errorLugarPlan);
      return { success: false, error: 'Error al añadir el lugar al plan.' };
    }

    revalidatePath(`/planes/${planId}`);
    return { success: true, data: nuevoLugarPlan };
  } catch (error) {
    console.error('Error en añadirLugarAlPlan:', error);
    return { success: false, error: 'Error de servidor al añadir el lugar.' };
  }
}

export async function eliminarLugarDelPlan(lugarPlanId: string, planId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const { error } = await supabase
      .from('lugares_plan')
      .delete()
      .eq('id', lugarPlanId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/planes/${planId}`);
    return { success: true };
  } catch (error) {
    console.error('Error en eliminarLugarDelPlan:', error);
    return { success: false, error: 'Error al eliminar el lugar.' };
  }
}

export async function editarLugarDelPlan(
  lugarPlanId: string,
  planId: string,
  lugarData: {
    nombre: string;
    categoria: string;
    direccion?: string | null;
    latitud: number;
    longitud: number;
    sitio_web?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const admin = createAdminClient();

    const { data: lugarPlan, error: errLP } = await admin
      .from('lugares_plan')
      .select('id, lugar_id')
      .eq('id', lugarPlanId)
      .single();

    if (errLP || !lugarPlan) {
      return { success: false, error: 'Lugar no encontrado en el plan' };
    }

    const { error: errUpdate } = await admin
      .from('lugares')
      .update({
        nombre: lugarData.nombre,
        categoria: lugarData.categoria,
        direccion: lugarData.direccion || null,
        latitud: lugarData.latitud,
        longitud: lugarData.longitud,
        sitio_web: lugarData.sitio_web || null,
      })
      .eq('id', lugarPlan.lugar_id);

    if (errUpdate) {
      console.error('Error actualizando lugar:', errUpdate);
      return { success: false, error: 'Error al actualizar el lugar.' };
    }

    revalidatePath(`/planes/${planId}`);
    return { success: true };
  } catch (error) {
    console.error('Error en editarLugarDelPlan:', error);
    return { success: false, error: 'Error inesperado al editar el lugar.' };
  }
}

export async function obtenerCatalogoLugares(): Promise<Lugar[]> {
  try {
    const supabase = await createClient();

    const { data: lugares } = await supabase
      .from('lugares')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(30);

    if (lugares && lugares.length > 0) {
      return lugares as Lugar[];
    }

    for (const sem of LUGARES_SEMILLA) {
      await supabase.from('lugares').upsert(
        {
          id_externo: sem.id_externo,
          nombre: sem.nombre,
          categoria: sem.categoria,
          nivel_precio: sem.nivel_precio,
          coste_estimado_por_persona: sem.coste_estimado_por_persona,
          direccion: sem.direccion,
          latitud: sem.latitud,
          longitud: sem.longitud,
          telefono: sem.telefono,
          sitio_web: sem.sitio_web,
          fotos: sem.fotos,
        },
        { onConflict: 'id_externo' }
      );
    }

    const { data: lugaresSembrados } = await supabase.from('lugares').select('*');
    return (lugaresSembrados || []) as Lugar[];
  } catch (error) {
    console.error('Error obteniendo catálogo:', error);
    return [];
  }
}
