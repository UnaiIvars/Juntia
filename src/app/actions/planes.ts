'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { FOTOS_POR_DEFECTO_CATEGORIA } from '@/lib/geo';

export type EstadoFormularioPlan =
  | {
      errores?: {
        titulo?: string[];
        descripcion?: string[];
        tipo_plan?: string[];
        fecha?: string[];
        presupuesto_maximo?: string[];
        distancia_maxima?: string[];
      };
      mensaje?: string;
    }
  | undefined;

function generarCodigoInvitacion(): string {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let resultado = 'JNT-';
  for (let i = 0; i < 4; i++) {
    resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return resultado;
}

export async function crearPlan(
  prevState: EstadoFormularioPlan,
  formData: FormData
): Promise<EstadoFormularioPlan> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mensaje: 'Debes iniciar sesión para crear un plan.' };
  }

  const titulo = (formData.get('titulo') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim() || null;
  const tipo_plan = (formData.get('tipo_plan') as string)?.trim() || 'cena';
  const fecha = (formData.get('fecha') as string)?.trim() || null;
  const presupuestoStr = formData.get('presupuesto_maximo') as string;
  const distanciaStr = formData.get('distancia_maxima') as string;

  const errores: Record<string, string[]> = {};

  if (!titulo || titulo.length < 3) {
    errores.titulo = ['El nombre del plan debe tener al menos 3 caracteres.'];
  }

  if (!tipo_plan) {
    errores.tipo_plan = ['Selecciona un tipo de plan.'];
  }

  const presupuesto_maximo =
    presupuestoStr !== '' && presupuestoStr !== null ? parseFloat(presupuestoStr) : 0;
  if (isNaN(presupuesto_maximo) || presupuesto_maximo < 0) {
    errores.presupuesto_maximo = ['El presupuesto no puede ser negativo.'];
  }

  const distancia_maxima = distanciaStr ? parseFloat(distanciaStr) : 10;
  if (isNaN(distancia_maxima) || distancia_maxima <= 0) {
    errores.distancia_maxima = ['La distancia debe ser mayor a 0 km.'];
  }

  const franjasJsonRaw = formData.get('franjas_horarias') as string | null;
  let franjasArray: any[] = [];
  try {
    if (franjasJsonRaw) franjasArray = JSON.parse(franjasJsonRaw);
  } catch (e) {}

  if (!Array.isArray(franjasArray) || franjasArray.length === 0) {
    errores.franjas_horarias = ['Debes proponer al menos 1 horario para el grupo.'];
  } else if (franjasArray.length > 3) {
    errores.franjas_horarias = ['Puedes proponer un máximo de 3 horarios.'];
  }

  if (Object.keys(errores).length > 0) {
    return { errores };
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

  const codigo_invitacion = generarCodigoInvitacion();

  const { data: planCreado, error: errorPlan } = await supabase
    .from('planes')
    .insert({
      titulo,
      descripcion,
      tipo_plan,
      fecha,
      presupuesto_maximo,
      distancia_maxima,
      creador_id: user.id,
      codigo_invitacion,
      estado: 'borrador',
    })
    .select('id')
    .single();

  if (errorPlan || !planCreado) {
    console.error('Error al crear plan:', errorPlan);
    return {
      mensaje: `Error al guardar el plan: ${errorPlan?.message || 'Error desconocido'}.`,
    };
  }

  const { data: miembroCreador, error: errorMiembro } = await supabase
    .from('miembros_plan')
    .insert({
      plan_id: planCreado.id,
      usuario_id: user.id,
      rol: 'administrador',
      preferencias_completadas: true,
    })
    .select('id')
    .single();

  if (errorMiembro) {
    console.error('Error al registrar miembro creador:', errorMiembro);
  }

  const franjasJson = formData.get('franjas_horarias') as string | null;
  if (franjasJson && miembroCreador) {
    try {
      const franjas = JSON.parse(franjasJson) as {
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
      }[];

      if (Array.isArray(franjas) && franjas.length > 0) {
        const filasAInsertar = franjas
          .filter((f) => f.fecha && f.hora_inicio && f.hora_fin)
          .map((f) => ({
            miembro_id: miembroCreador.id,
            fecha: f.fecha,
            hora_inicio: f.hora_inicio.slice(0, 5),
            hora_fin: f.hora_fin.slice(0, 5),
            esta_disponible: true,
          }));

        if (filasAInsertar.length > 0) {
          await supabase.from('disponibilidad').insert(filasAInsertar);
        }
      }
    } catch (e) {
      console.error('Error al parsear franjas iniciales del creador:', e);
    }
  }

  if (miembroCreador) {
    try {
      const lugaresPropuestosJson = formData.get('lugares_propuestos') as string | null;
      let listaLugares: {
        nombre: string;
        direccion?: string | null;
        categoria?: string;
        precio?: string | number;
        lat?: number;
        lng?: number;
        link_maps?: string | null;
      }[] = [];

      if (lugaresPropuestosJson) {
        try {
          const parsed = JSON.parse(lugaresPropuestosJson);
          if (Array.isArray(parsed)) {
            listaLugares = parsed.filter((l) => l && typeof l.nombre === 'string' && l.nombre.trim().length > 0).slice(0, 3);
          }
        } catch (errJson) {
          console.error('Error parseando lugares_propuestos:', errJson);
        }
      }

      if (listaLugares.length === 0) {
        const lugarNombre = (formData.get('lugar_nombre') as string)?.trim();
        if (lugarNombre) {
          listaLugares.push({
            nombre: lugarNombre,
            direccion: (formData.get('lugar_direccion') as string)?.trim() || null,
            categoria: (formData.get('lugar_categoria') as string)?.trim() || 'restaurante',
            precio: formData.get('lugar_precio') as string,
            link_maps: (formData.get('lugar_link_maps') as string)?.trim() || null,
            lat: parseFloat(formData.get('lugar_lat') as string) || 40.4168,
            lng: parseFloat(formData.get('lugar_lng') as string) || -3.7038,
          });
        }
      }

      const adminClient = createAdminClient();

      for (const lug of listaLugares) {
        const nom = lug.nombre.trim();
        if (!nom) continue;

        const dir = lug.direccion?.trim() || null;
        const cat = lug.categoria?.trim() || 'restaurante';
        const precioNum = typeof lug.precio === 'number' ? lug.precio : parseFloat(lug.precio || '0') || 0;
        const link = lug.link_maps?.trim() || null;
        const lat = typeof lug.lat === 'number' ? lug.lat : 40.4168;
        const lng = typeof lug.lng === 'number' ? lug.lng : -3.7038;

        const { data: lugarExistente } = await adminClient
          .from('lugares')
          .select('id')
          .ilike('nombre', nom)
          .maybeSingle();

        let lugarId: string | null = lugarExistente?.id || null;

        if (!lugarId) {
          const fotosCat = FOTOS_POR_DEFECTO_CATEGORIA[cat] || FOTOS_POR_DEFECTO_CATEGORIA.restaurante || [];
          const { data: nuevoLugar, error: errNuevoLugar } = await adminClient
            .from('lugares')
            .insert({
              nombre: nom,
              categoria: cat,
              nivel_precio: precioNum === 0 ? 0 : precioNum > 30 ? 3 : 2,
              coste_estimado_por_persona: precioNum,
              direccion: dir,
              sitio_web: link,
              latitud: lat,
              longitud: lng,
              fotos: [fotosCat[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'],
            })
            .select('id')
            .single();

          if (errNuevoLugar) {
            console.error('Error insertando nuevo lugar:', errNuevoLugar);
          }
          lugarId = nuevoLugar?.id || null;
        }

        if (lugarId) {
          const { error: errLP } = await adminClient.from('lugares_plan').insert({
            plan_id: planCreado.id,
            lugar_id: lugarId,
            propuesto_por: miembroCreador.id,
          });

          if (errLP) {
            console.error('Error insertando en lugares_plan:', errLP);
          }
        }
      }
    } catch (e) {
      console.error('Error al guardar lugares del plan:', e);
    }
  }

  const amigosJson = formData.get('amigos_invitados') as string | null;
  if (amigosJson) {
    try {
      const amigosIds = JSON.parse(amigosJson) as string[];
      if (Array.isArray(amigosIds) && amigosIds.length > 0) {
        const invitacionesAInsertar = amigosIds
          .filter((amigoId) => amigoId && amigoId !== user.id)
          .map((amigoId) => ({
            plan_id: planCreado.id,
            usuario_invitado_id: amigoId,
            invitado_por: user.id,
            estado: 'pendiente',
          }));

        if (invitacionesAInsertar.length > 0) {
          const { error: errInv } = await supabase.from('invitaciones_plan').insert(invitacionesAInsertar);
          if (errInv) {
            console.warn('Fallo inserción normal de invitaciones, usando adminClient:', errInv);
            const adminClient = createAdminClient();
            const { error: errAdmin } = await adminClient.from('invitaciones_plan').insert(invitacionesAInsertar);
            if (errAdmin) {
              console.error('Error insertando invitaciones_plan con adminClient:', errAdmin);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error al parsear amigos invitados:', e);
    }
  }

  revalidatePath('/dashboard', 'layout');
  redirect(`/planes/${planCreado.id}`);
}

export async function actualizarPlan(
  planId: string,
  datos: {
    titulo: string;
    descripcion?: string | null;
    tipo_plan: string;
    fecha?: string | null;
    presupuesto_maximo: number;
    distancia_maxima: number;
  }
): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, error: 'Debes iniciar sesión.' };
  }

  if (!datos.titulo || datos.titulo.trim().length < 3) {
    return { exito: false, error: 'El nombre debe tener al menos 3 caracteres.' };
  }

  const { error } = await supabase
    .from('planes')
    .update({
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion?.trim() || null,
      tipo_plan: datos.tipo_plan || 'cena',
      fecha: datos.fecha || null,
      presupuesto_maximo: datos.presupuesto_maximo >= 0 ? datos.presupuesto_maximo : 0,
      distancia_maxima: datos.distancia_maxima > 0 ? datos.distancia_maxima : 10,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('creador_id', user.id);

  if (error) {
    console.error('Error al actualizar plan:', error);
    return { exito: false, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/planes/${planId}`);
  return { exito: true };
}

export async function editarPlan(
  planId: string,
  prevState: EstadoFormularioPlan,
  formData: FormData
): Promise<EstadoFormularioPlan> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mensaje: 'Debes iniciar sesión.' };
  }

  const titulo = (formData.get('titulo') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim() || null;
  const tipo_plan = (formData.get('tipo_plan') as string)?.trim() || 'cena';
  const fecha = (formData.get('fecha') as string)?.trim() || null;
  const presupuestoStr = formData.get('presupuesto_maximo') as string;
  const distanciaStr = formData.get('distancia_maxima') as string;

  if (!titulo || titulo.length < 3) {
    return { mensaje: 'El nombre del plan debe tener al menos 3 caracteres.' };
  }

  const { error: errPlan } = await supabase
    .from('planes')
    .update({
      titulo,
      descripcion,
      tipo_plan,
      fecha,
      presupuesto_maximo: presupuestoStr ? parseFloat(presupuestoStr) : 0,
      distancia_maxima: distanciaStr ? parseFloat(distanciaStr) : 10,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('creador_id', user.id);

  if (errPlan) {
    console.error('Error al actualizar plan:', errPlan);
    return { mensaje: errPlan.message || 'Error al actualizar el plan.' };
  }

  const { data: miembroCreador } = await supabase
    .from('miembros_plan')
    .select('id')
    .eq('plan_id', planId)
    .eq('usuario_id', user.id)
    .maybeSingle();

  const franjasJson = formData.get('franjas_horarias') as string | null;
  if (franjasJson && miembroCreador) {
    try {
      const franjas = JSON.parse(franjasJson) as {
        fecha: string;
        hora_inicio: string;
        hora_fin: string;
      }[];

      if (Array.isArray(franjas) && franjas.length > 0) {
        await supabase
          .from('disponibilidad_usuarios')
          .delete()
          .eq('miembro_id', miembroCreador.id);

        const registros = franjas.map((f) => ({
          miembro_id: miembroCreador.id,
          fecha: f.fecha,
          hora_inicio: f.hora_inicio.length === 5 ? `${f.hora_inicio}:00` : f.hora_inicio,
          hora_fin: f.hora_fin.length === 5 ? `${f.hora_fin}:00` : f.hora_fin,
          esta_disponible: true,
        }));

        await supabase.from('disponibilidad_usuarios').insert(registros);
      }
    } catch (e) {
      console.error('Error al actualizar franjas horarias:', e);
    }
  }

  const lugaresJson = formData.get('lugares_propuestos') as string | null;
  if (lugaresJson && miembroCreador) {
    try {
      const lugares = JSON.parse(lugaresJson) as {
        nombre: string;
        direccion: string | null;
        categoria: string;
        precio: string;
        lat: number;
        lng: number;
        link_maps?: string | null;
      }[];

      if (Array.isArray(lugares)) {
        await supabase.from('lugares_plan').delete().eq('plan_id', planId);

        for (const lug of lugares) {
          let lugarId: string | null = null;
          const { data: lugarExistente } = await adminClient
            .from('lugares')
            .select('id')
            .eq('nombre', lug.nombre)
            .maybeSingle();

          if (lugarExistente) {
            lugarId = lugarExistente.id;
          } else {
            const fotoPorDefecto = FOTOS_POR_DEFECTO_CATEGORIA[lug.categoria] || FOTOS_POR_DEFECTO_CATEGORIA.otro;
            const { data: nuevoLugar } = await adminClient
              .from('lugares')
              .insert({
                nombre: lug.nombre,
                categoria: lug.categoria as any,
                nivel_precio: parseInt(lug.precio, 10) || 1,
                coste_estimado_por_persona: 25,
                direccion: lug.direccion || null,
                latitud: lug.lat,
                longitud: lug.lng,
                sitio_web: lug.link_maps || null,
                fotos: [fotoPorDefecto],
              })
              .select('id')
              .single();

            if (nuevoLugar) {
              lugarId = nuevoLugar.id;
            }
          }

          if (lugarId) {
            await adminClient.from('lugares_plan').insert({
              plan_id: planId,
              lugar_id: lugarId,
              propuesto_por: miembroCreador.id,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error al actualizar lugares del plan:', e);
    }
  }

  const amigosJson = formData.get('amigos_invitados') as string | null;
  if (amigosJson) {
    try {
      const amigosIds = JSON.parse(amigosJson) as string[];
      if (Array.isArray(amigosIds) && amigosIds.length > 0) {
        const { data: invExistentes } = await supabase
          .from('invitaciones_plan')
          .select('usuario_invitado_id')
          .eq('plan_id', planId);

        const yaInvitados = new Set((invExistentes || []).map((i) => i.usuario_invitado_id));

        const nuevasInvitaciones = amigosIds
          .filter((amigoId) => amigoId && amigoId !== user.id && !yaInvitados.has(amigoId))
          .map((amigoId) => ({
            plan_id: planId,
            usuario_invitado_id: amigoId,
            invitado_por: user.id,
            estado: 'pendiente',
          }));

        if (nuevasInvitaciones.length > 0) {
          const { error: errInv } = await supabase.from('invitaciones_plan').insert(nuevasInvitaciones);
          if (errInv) {
            console.warn('Fallo inserción normal de nuevas invitaciones, usando adminClient:', errInv);
            const { error: errAdmin } = await adminClient.from('invitaciones_plan').insert(nuevasInvitaciones);
            if (errAdmin) {
              console.error('Error insertando nuevas invitaciones con adminClient:', errAdmin);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error al parsear nuevos amigos invitados:', e);
    }
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath(`/planes/${planId}`, 'layout');
  redirect(`/planes/${planId}`);
}

export async function eliminarPlan(planId: string): Promise<{ exito: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exito: false, error: 'Debes iniciar sesión para realizar esta acción.' };
  }

  const { error } = await supabase
    .from('planes')
    .delete()
    .eq('id', planId)
    .eq('creador_id', user.id);

  if (error) {
    console.error('Error al eliminar plan:', error);
    return { exito: false, error: error.message };
  }

  revalidatePath('/dashboard', 'layout');
  return { exito: true };
}
