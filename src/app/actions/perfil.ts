'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type EstadoPerfil =
  | {
      exito?: boolean;
      mensaje?: string;
      errores?: {
        nombre_completo?: string[];
        username?: string[];
        ciudad?: string[];
        direccion?: string[];
        bio?: string[];
      };
    }
  | undefined;

export async function obtenerInfoCambiosUsername(): Promise<{
  cambiosUsados: number;
  cambiosRestantes: number;
  puedeCambiar: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { cambiosUsados: 0, cambiosRestantes: 2, puedeCambiar: false };

    const admin = createAdminClient();
    const { data: perfil } = await admin
      .from('perfiles')
      .select('cambios_nombre_mes, fecha_ultimo_cambio_nombre')
      .eq('id', user.id)
      .single();

    if (!perfil) return { cambiosUsados: 0, cambiosRestantes: 2, puedeCambiar: true };

    const ahora = new Date();
    const fechaUltimo = perfil.fecha_ultimo_cambio_nombre ? new Date(perfil.fecha_ultimo_cambio_nombre) : null;
    let cambiosUsados = Number(perfil.cambios_nombre_mes) || 0;

    const esMismoMes =
      fechaUltimo &&
      fechaUltimo.getMonth() === ahora.getMonth() &&
      fechaUltimo.getFullYear() === ahora.getFullYear();

    if (!esMismoMes) {
      cambiosUsados = 0;
    }

    const cambiosRestantes = Math.max(0, 2 - cambiosUsados);
    return {
      cambiosUsados,
      cambiosRestantes,
      puedeCambiar: cambiosRestantes > 0,
    };
  } catch {
    return { cambiosUsados: 0, cambiosRestantes: 2, puedeCambiar: true };
  }
}

export async function cambiarNombreUsuario(
  nuevoUsername: string
): Promise<{ exito: boolean; mensaje: string; nuevoUsername?: string; cambiosRestantes?: number }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { exito: false, mensaje: 'Debes iniciar sesión.' };
    }

    const limpio = nuevoUsername.trim().toLowerCase().replace(/^@/, '');

    if (!limpio || limpio.length < 3) {
      return { exito: false, mensaje: 'El nombre de usuario debe tener al menos 3 caracteres.' };
    }
    if (!/^[a-z0-9_\.]+$/.test(limpio)) {
      return { exito: false, mensaje: 'Solo se permiten letras, números, puntos y guiones bajos.' };
    }

    const admin = createAdminClient();

    const { data: perfilActual } = await admin
      .from('perfiles')
      .select('id, username, cambios_nombre_mes, fecha_ultimo_cambio_nombre')
      .eq('id', user.id)
      .single();

    if (!perfilActual) {
      return { exito: false, mensaje: 'Perfil no encontrado.' };
    }

    if (perfilActual.username === limpio) {
      return { exito: true, mensaje: 'Ese ya es tu nombre de usuario actual.' };
    }

    const ahora = new Date();
    const fechaUltimo = perfilActual.fecha_ultimo_cambio_nombre ? new Date(perfilActual.fecha_ultimo_cambio_nombre) : null;
    let cambiosUsados = Number(perfilActual.cambios_nombre_mes) || 0;

    const esMismoMes =
      fechaUltimo &&
      fechaUltimo.getMonth() === ahora.getMonth() &&
      fechaUltimo.getFullYear() === ahora.getFullYear();

    if (!esMismoMes) {
      cambiosUsados = 0; // Reinicio al comenzar un nuevo mes
    }

    if (cambiosUsados >= 2) {
      return {
        exito: false,
        mensaje: 'Has alcanzado el límite de 2 cambios de @usuario este mes. Podrás volver a cambiarlo el próximo mes.',
      };
    }

    const { data: enUso } = await admin
      .from('perfiles')
      .select('id')
      .ilike('username', limpio)
      .neq('id', user.id)
      .maybeSingle();

    if (enUso) {
      return { exito: false, mensaje: 'Este @nombre de usuario ya está en uso por otra persona. Elige otro.' };
    }

    const nuevosCambios = cambiosUsados + 1;
    let { error: errUpdate } = await admin
      .from('perfiles')
      .update({
        username: limpio,
        cambios_nombre_mes: nuevosCambios,
        fecha_ultimo_cambio_nombre: ahora.toISOString(),
        actualizado_en: ahora.toISOString(),
      })
      .eq('id', user.id);

    if (errUpdate && errUpdate.message.includes('column')) {
      const fallbackUpdate = await admin
        .from('perfiles')
        .update({
          username: limpio,
          actualizado_en: ahora.toISOString(),
        })
        .eq('id', user.id);
      errUpdate = fallbackUpdate.error;
    }

    if (errUpdate) {
      console.error('Error al cambiar username:', errUpdate);
      return { exito: false, mensaje: 'Error al actualizar el nombre de usuario.' };
    }

    revalidatePath('/perfil');
    revalidatePath('/dashboard');
    return {
      exito: true,
      mensaje: `¡Nombre de usuario cambiado a @${limpio}! Te queda ${2 - nuevosCambios} cambio este mes.`,
      nuevoUsername: limpio,
      cambiosRestantes: 2 - nuevosCambios,
    };
  } catch (err) {
    console.error('Error en cambiarNombreUsuario:', err);
    return { exito: false, mensaje: 'Error inesperado al cambiar el nombre de usuario.' };
  }
}

async function geocodificarDireccion(texto: string): Promise<{ latitud: number; longitud: number } | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(texto)}&limit=1&lang=es`,
      {
        headers: { 'User-Agent': 'Juntia-App/1.0' },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return { latitud: Number(lat), longitud: Number(lon) };
      }
    }
  } catch (err) {
  }
  return null;
}

export async function actualizarPerfil(
  prevState: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mensaje: 'Debes iniciar sesión.' };
  }

  const nombre_completo = (formData.get('nombre_completo') as string)?.trim();
  const ciudad = (formData.get('ciudad') as string)?.trim() || null;
  const direccion = (formData.get('direccion') as string)?.trim() || null;
  const bio = (formData.get('bio') as string)?.trim() || null;

  const errores: Record<string, string[]> = {};

  if (!nombre_completo || nombre_completo.length < 2) {
    errores.nombre_completo = ['El nombre debe tener al menos 2 caracteres.'];
  }
  if (ciudad && ciudad.length > 80) {
    errores.ciudad = ['La ciudad no puede superar los 80 caracteres.'];
  }
  if (direccion && direccion.length > 120) {
    errores.direccion = ['La dirección no puede superar los 120 caracteres.'];
  }
  if (bio && bio.length > 200) {
    errores.bio = ['La descripción no puede superar los 200 caracteres.'];
  }

  if (Object.keys(errores).length > 0) {
    return { errores };
  }

  const latitudRaw = formData.get('latitud') as string;
  const longitudRaw = formData.get('longitud') as string;
  let latitud: number | null = latitudRaw && !isNaN(parseFloat(latitudRaw)) ? parseFloat(latitudRaw) : null;
  let longitud: number | null = longitudRaw && !isNaN(parseFloat(longitudRaw)) ? parseFloat(longitudRaw) : null;

  if ((latitud === null || longitud === null) && (direccion || ciudad)) {
    const textoBuscar = [direccion, ciudad, 'España'].filter(Boolean).join(', ');
    const coords = await geocodificarDireccion(textoBuscar);
    if (coords) {
      latitud = coords.latitud;
      longitud = coords.longitud;
    }
  }

  const admin = createAdminClient();
  const datosActualizar: any = {
    nombre_completo,
    ciudad,
    direccion,
    bio,
    actualizado_en: new Date().toISOString(),
  };

  if (latitud !== null && longitud !== null) {
    datosActualizar.latitud = latitud;
    datosActualizar.longitud = longitud;
  }

  let { error } = await admin
    .from('perfiles')
    .update(datosActualizar)
    .eq('id', user.id);

  if (error && (error.message.includes('latitud') || error.message.includes('longitud') || error.message.includes('ciudad') || error.message.includes('direccion') || error.message.includes('column'))) {
    let { error: err2 } = await admin
      .from('perfiles')
      .update({
        nombre_completo,
        ciudad,
        direccion,
        bio,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (err2 && (err2.message.includes('ciudad') || err2.message.includes('direccion') || err2.message.includes('column'))) {
      const fallbackRes = await admin
        .from('perfiles')
        .update({
          nombre_completo,
          bio,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', user.id);

      error = fallbackRes.error;
    } else {
      error = err2;
    }
  }

  if (error) {
    console.error('Error actualizando perfil:', error);
    return { mensaje: `Error al guardar: ${error.message}` };
  }

  await supabase.auth.updateUser({
    data: { nombre_completo },
  });

  revalidatePath('/perfil');
  revalidatePath('/dashboard');
  return { exito: true, mensaje: '¡Perfil actualizado correctamente!' };
}

export async function subirAvatar(
  prevState: EstadoPerfil,
  formData: FormData
): Promise<EstadoPerfil> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mensaje: 'Debes iniciar sesión.' };
  }

  const archivo = formData.get('avatar') as File | null;

  if (!archivo || archivo.size === 0) {
    return { mensaje: 'Selecciona una imagen.' };
  }

  const extensionesPermitidas = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!extensionesPermitidas.includes(archivo.type)) {
    return { mensaje: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' };
  }

  if (archivo.size > 3 * 1024 * 1024) {
    return { mensaje: 'La imagen no puede superar los 3 MB.' };
  }

  const extension = archivo.name.split('.').pop() || 'jpg';
  const rutaArchivo = `avatars/${user.id}.${extension}`;

  const { error: errorStorage } = await supabase.storage
    .from('avatars')
    .upload(rutaArchivo, archivo, {
      upsert: true,
      contentType: archivo.type,
    });

  if (errorStorage) {
    console.error('Error subiendo avatar:', errorStorage);
    return { mensaje: `Error al subir imagen: ${errorStorage.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(rutaArchivo);

  const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: errorUpdate } = await supabase
    .from('perfiles')
    .update({
      avatar_url,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (errorUpdate) {
    return { mensaje: `Error al actualizar el perfil: ${errorUpdate.message}` };
  }

  revalidatePath('/perfil');
  revalidatePath('/dashboard');
  return { exito: true, mensaje: '¡Foto de perfil actualizada!' };
}
