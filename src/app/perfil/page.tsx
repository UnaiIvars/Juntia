import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/ui/Logo';
import FondoApp from '@/components/ui/FondoApp';
import AvatarUploader from '@/components/ui/AvatarUploader';
import FormularioPerfil from '@/components/ui/FormularioPerfil';
import { obtenerInfoCambiosUsername } from '@/app/actions/perfil';
import { ArrowLeft, Calendar, UserCheck, MapPin, Compass } from 'lucide-react';
import { Perfil } from '@/types/database';

export const metadata = {
  title: 'Mi Perfil — Juntia',
  description: 'Personaliza tu nombre, ciudad, dirección, foto y descripción en Juntia.',
};

export default async function PaginaPerfil() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!perfil) {
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
        bio: null,
      },
      { onConflict: 'id' }
    );

    const { data: perfilNuevo } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();

    perfil = perfilNuevo;
  }

  if (!perfil) redirect('/dashboard');

  const perfilTipado = perfil as Perfil;
  const infoCambios = await obtenerInfoCambiosUsername();

  const fechaRegistro = new Date(perfilTipado.creado_en).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07070f', color: '#f0f0ff', position: 'relative', overflowX: 'hidden' }}>
      <FondoApp />
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(9, 9, 16, 0.9)',
          backdropFilter: 'blur(24px)',
          height: 86,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '0 2.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo tamaño="xl" enlaceDestino="/dashboard" />

          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.65rem 1.3rem',
              borderRadius: 12,
              border: '1px solid rgba(124, 92, 252, 0.6)',
              backgroundColor: '#0d0d18',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="link-volver"
          >
            <ArrowLeft size={16} />
            <span>Volver al Dashboard</span>
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '3rem 1.5rem 6rem', position: 'relative', zIndex: 10 }}>
        <div className="animate-fade-in-up">
          <div style={{ marginBottom: '2.5rem' }}>
            <h1
              style={{
                fontSize: '2.3rem',
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 0 0.4rem',
                letterSpacing: '-0.03em',
              }}
            >
              Mi perfil
            </h1>
            <p style={{ color: '#9898be', fontSize: '1rem', margin: 0 }}>
              Personaliza cómo te ven los demás participantes en tus planes y actividades.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 260px) 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
            className="perfil-layout-grid"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  backgroundColor: 'rgba(13, 13, 24, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 22,
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <AvatarUploader
                  avatarUrl={perfilTipado.avatar_url}
                  nombre={perfilTipado.nombre_completo}
                />
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(13, 13, 24, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: 'rgba(124, 92, 252, 0.15)',
                    border: '1px solid rgba(124, 92, 252, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={20} color="#7c5cfc" />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#9898be', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Miembro desde
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginTop: '0.15rem' }}>
                    {fechaRegistro}
                  </div>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(13, 13, 24, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={20} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#9898be', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ciudad / Ubicación
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: perfilTipado.ciudad ? '#ffffff' : '#7a7a9e', marginTop: '0.15rem' }}>
                    {perfilTipado.ciudad || 'No especificada'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(13, 13, 24, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 18,
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: 'rgba(236, 72, 153, 0.15)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Compass size={20} color="#ec4899" />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#9898be', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Dirección habitual
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: perfilTipado.direccion ? '#ffffff' : '#7a7a9e', marginTop: '0.15rem' }}>
                    {perfilTipado.direccion || 'No especificada'}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 22,
                padding: '2.25rem',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
              }}
            >
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.75rem', letterSpacing: '-0.01em' }}>
                Editar información
              </h2>
              <FormularioPerfil
                perfil={perfilTipado}
                infoCambiosInicial={infoCambios}
              />
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .perfil-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .link-volver:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 16px rgba(124, 92, 252, 0.5) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
