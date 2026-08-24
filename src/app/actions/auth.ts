'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function registrar(prevState: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const nombre = (formData.get('nombre') as string)?.trim();
  const username = (formData.get('username') as string)?.trim().toLowerCase().replace(/^@/, '');
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const contrasena = formData.get('contrasena') as string;
  const confirmarContrasena = formData.get('confirmarContrasena') as string;

  const errores: Record<string, string[]> = {};

  if (!nombre || nombre.length < 2) {
    errores.nombre = ['El nombre debe tener al menos 2 caracteres.'];
  }
  if (!username || username.length < 3) {
    errores.username = ['El nombre de usuario debe tener al menos 3 caracteres.'];
  } else if (!/^[a-z0-9_\.]+$/.test(username)) {
    errores.username = ['Solo se permiten letras, números, puntos y guiones bajos.'];
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = ['Introduce un email válido.'];
  }
  if (!contrasena || contrasena.length < 8) {
    errores.contrasena = ['La contraseña debe tener al menos 8 caracteres.'];
  }
  if (contrasena !== confirmarContrasena) {
    errores.confirmarContrasena = ['Las contraseñas no coinciden.'];
  }

  if (Object.keys(errores).length > 0) {
    return { errores };
  }

  const supabase = await createClient();

  const { data: usernameExistente } = await supabase
    .from('perfiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();

  if (usernameExistente) {
    return { errores: { username: ['Este nombre de usuario ya está en uso. Elige otro.'] } };
  }

  const adminClient = createAdminClient();
  const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
    email,
    password: contrasena,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombre,
      username,
    },
  });

  if (adminError) {
    console.error('Error al crear usuario con Admin API:', adminError);

    if (
      adminError.message.includes('already registered') ||
      adminError.message.includes('already been registered') ||
      adminError.message.includes('User already registered')
    ) {
      return { mensaje: 'Este email ya está registrado. Inicia sesión en su lugar.' };
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: contrasena,
      options: {
        data: { nombre_completo: nombre, username },
      },
    });

    if (signUpError) {
      return { mensaje: `Error al crear la cuenta: ${signUpError.message}` };
    }
  }

  const nuevoUsuarioId = adminData?.user?.id;

  if (nuevoUsuarioId) {
    await adminClient.from('perfiles').upsert(
      {
        id: nuevoUsuarioId,
        email,
        nombre_completo: nombre,
        username,
        avatar_url: null,
      },
      { onConflict: 'id' }
    );
  }

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: contrasena,
  });

  if (loginError) {
    console.error('Error al iniciar sesión tras registrar:', loginError);
    redirect('/login');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function iniciarSesion(prevState: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const contrasena = formData.get('contrasena') as string;

  const errores: Record<string, string[]> = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = ['Introduce un email válido.'];
  }
  if (!contrasena) {
    errores.contrasena = ['Introduce tu contraseña.'];
  }

  if (Object.keys(errores).length > 0) {
    return { errores };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena });

  if (error) {
    if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
      return { mensaje: 'Email o contraseña incorrectos.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { mensaje: 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.' };
    }
    return { mensaje: 'Error al iniciar sesión. Inténtalo de nuevo.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export type EstadoFormulario =
  | {
      errores?: {
        nombre?: string[];
        username?: string[];
        email?: string[];
        contrasena?: string[];
        confirmarContrasena?: string[];
      };
      mensaje?: string;
    }
  | undefined;
