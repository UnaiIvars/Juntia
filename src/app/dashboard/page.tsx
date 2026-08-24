import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/ui/Logo';
import FondoApp from '@/components/ui/FondoApp';
import InputUnirseCodigo from '@/components/planes/InputUnirseCodigo';
import PanelAmigos from '@/components/amigos/PanelAmigos';
import BannerInvitacionesPlan from '@/components/dashboard/BannerInvitacionesPlan';
import TabsPlanes from '@/components/dashboard/TabsPlanes';
import BotonSalir from '@/components/dashboard/BotonSalir';
import {
  LogOut,
  User,
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  Sparkles,
  Mail,
} from 'lucide-react';
import { Plan, InvitacionPlan } from '@/types/database';

export const metadata: Metadata = {
  title: 'Dashboard — Juntia',
  description: 'Tus planes, amigos y quedadas en curso.',
};

const EMOJIS_TIPO: Record<string, string> = {
  cena: '🍕',
  fiesta: '🍹',
  deporte: '⚽',
  cafe: '☕',
  viaje: '✈️',
  otro: '🎯',
};

export default async function PaginaDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const nombre = perfil?.nombre_completo ?? user.email?.split('@')[0] ?? 'Usuario';

  const { data: invitacionesData } = await supabase
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
        codigo_invitacion,
        estado,
        creador_id,
        distancia_maxima,
        creado_en,
        actualizado_en
      ),
      anfitrion:perfiles!invitaciones_plan_invitado_por_fkey (
        id,
        nombre_completo,
        username,
        avatar_url
      )
    `)
    .eq('usuario_invitado_id', user.id)
    .eq('estado', 'aceptada')
    .order('creado_en', { ascending: false });

  const invitacionesPendientes: InvitacionPlan[] =
    ((await supabase
      .from('invitaciones_plan')
      .select(`*, plan:planes(*), anfitrion:perfiles!invitaciones_plan_invitado_por_fkey(*)`)
      .eq('usuario_invitado_id', user.id)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false })).data as InvitacionPlan[]) || [];

  const { data: planesData } = await supabase
    .from('planes')
    .select(`
      *,
      miembros_plan (
        id,
        usuario_id,
        perfil:perfiles(
          avatar_url,
          nombre_completo
        )
      )
    `)
    .eq('creador_id', user.id)
    .order('creado_en', { ascending: false });

  const planesPropios = (planesData || []).map((p: any) => ({
    ...p,
    creador: perfil,
    miembros_conteo: p.miembros_plan?.length || 1,
  }));

  const { data: otrosPlanesData } = await supabase
    .from('miembros_plan')
    .select(`
      plan:planes (
        *,
        creador:perfiles!planes_creador_id_fkey (
          id,
          nombre_completo,
          username,
          avatar_url
        ),
        miembros_plan (
          id,
          usuario_id,
          perfil:perfiles(
            avatar_url,
            nombre_completo
          )
        )
      )
    `)
    .eq('usuario_id', user.id);

  const otrosPlanes = (otrosPlanesData || [])
    .map((m: any) => m.plan)
    .filter((p: any) => p && p.creador_id !== user.id)
    .map((p: any) => ({
      ...p,
      creador: p.creador,
      miembros_conteo: p.miembros_plan?.length || 1,
    }));

  const mapaMisPlanes = new Map<string, any>();
  for (const p of [...planesPropios, ...otrosPlanes]) {
    if (p && p.id && !mapaMisPlanes.has(p.id)) {
      mapaMisPlanes.set(p.id, p);
    }
  }
  const todosMisPlanes = Array.from(mapaMisPlanes.values());

  const totalPlanes = todosMisPlanes.length;
  const totalAmigosParticipando = new Set(
    todosMisPlanes.flatMap((p) => p.miembros_plan?.map((m: any) => m.usuario_id) || [])
  ).size;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090910', color: '#f0f0ff', position: 'relative' }}>
      <FondoApp />
      <PanelAmigos usuarioId={user.id} />
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(9, 9, 16, 0.9)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 2.5rem',
          height: 86,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo tamaño="xl" enlaceDestino="/dashboard" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link
              href="/perfil"
              title="Mi perfil"
              className="profile-pill-interactive"
            >
              <div className="avatar-circle">
                {perfil?.avatar_url ? (
                  <img
                    src={perfil.avatar_url}
                    alt={nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={22} color="white" />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.25 }}>
                <span style={{ fontSize: '1.02rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {nombre}
                </span>
                {perfil?.username && (
                  <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600 }}>
                    @{perfil.username}
                  </span>
                )}
              </div>
            </Link>

            <BotonSalir />
          </div>
        </div>
      </nav>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 6rem', position: 'relative', zIndex: 10 }}>
        <BannerInvitacionesPlan invitacionesIniciales={invitacionesPendientes} />
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <Sparkles size={14} /> Tus planes
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.03em' }}>
              Panel de planes
            </h1>
            <p style={{ color: '#9898be', fontSize: '0.95rem', marginTop: '0.3rem' }}>
              {totalPlanes === 0
                ? 'Crea tu primer plan o únete con un código de invitación.'
                : `Tienes ${totalPlanes} ${totalPlanes === 1 ? 'plan activo' : 'planes activos'} y ${invitacionesPendientes.length} ${invitacionesPendientes.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}.`}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            <InputUnirseCodigo />

            <Link
              id="btn-crear-plan"
              href="/planes/nuevo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.4rem',
                borderRadius: 14,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.65)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="btn-crear-plan-link"
            >
              <Plus size={18} />
              Crear nuevo plan
            </Link>
          </div>
        </div>
        {totalPlanes > 0 && (
          <div
            className="animate-fade-in-up animate-delay-100"
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: Clock, color: '#a78bfa', bg: 'rgba(124,92,252,0.15)', border: 'rgba(124,92,252,0.25)', value: totalPlanes, label: totalPlanes === 1 ? 'Plan tuyo' : 'Planes tuyos' },
              { icon: Users, color: '#86efac', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.25)', value: totalAmigosParticipando, label: totalAmigosParticipando === 1 ? 'Participante' : 'Participantes' },
              { icon: Mail, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.25)', value: invitacionesPendientes.length, label: invitacionesPendientes.length === 1 ? 'Invitación' : 'Invitaciones' },
            ].map(({ icon: Icon, color, bg, border, value, label }) => (
              <div
                key={label}
                style={{
                  flex: '1 1 160px',
                  backgroundColor: 'rgba(13,13,24,0.8)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${border}`,
                  borderRadius: 16,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9898be', marginTop: '0.15rem', fontWeight: 600 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <TabsPlanes
          planesPropios={todosMisPlanes}
          invitacionesPendientes={invitacionesPendientes}
          usuarioId={user.id}
          emojis={EMOJIS_TIPO}
        />
      </main>

      <style>{`
        .btn-crear-plan-link:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 6px 18px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
