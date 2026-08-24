import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const rutasProtegidas = ['/dashboard', '/planes', '/perfil'];
const rutasPublicas = ['/login', '/registro', '/'];
const rutasSinUsername = ['/elegir-username', '/login', '/registro', '/', '/unirse'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const esRutaProtegida = rutasProtegidas.some((ruta) =>
    path.startsWith(ruta)
  );
  const esRutaPublica = rutasPublicas.includes(path);
  const necesitaUsername = !rutasSinUsername.some((ruta) =>
    path.startsWith(ruta)
  );

  if (esRutaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (esRutaPublica && user && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (user && necesitaUsername && path !== '/elegir-username') {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil && !perfil.username) {
      const url = request.nextUrl.clone();
      url.pathname = '/elegir-username';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
