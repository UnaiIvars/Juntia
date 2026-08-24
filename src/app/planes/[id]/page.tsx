import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/ui/Logo';
import FondoApp from '@/components/ui/FondoApp';
import BotonCompartirPlan from '@/components/planes/BotonCompartirPlan';
import ListaParticipantes from '@/components/planes/ListaParticipantes';
import BotonAbandonarPlan from '@/components/planes/BotonAbandonarPlan';
import BotonAjustesModal from '@/components/planes/BotonAjustesModal';
import TarjetaDistanciasMiembros from '@/components/planes/TarjetaDistanciasMiembros';
import VistaMatrizDisponibilidad, { DisponibilidadConPerfil } from '@/components/planes/VistaMatrizDisponibilidad';
import SeccionLugaresPlan from '@/components/lugares/SeccionLugaresPlan';
import ChatPlan from '@/components/planes/ChatPlan';
import { obtenerLugaresDelPlan } from '@/app/actions/lugares';
import { obtenerMensajesDelPlan } from '@/app/actions/mensajes';
import {
  ArrowLeft,
  Calendar,
  Euro,
  Navigation,
  Users,
  MapPin,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Plan, MiembroPlan, Disponibilidad } from '@/types/database';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from('planes')
    .select('titulo, descripcion')
    .eq('id', id)
    .maybeSingle();

  if (!plan) {
    return { title: 'Plan — Juntia' };
  }

  return {
    title: `${plan.titulo} — Juntia`,
    description: plan.descripcion || 'Plan organizado en Juntia. Vota horarios, lugares y participa con tu grupo.',
    openGraph: {
      title: `${plan.titulo} — Juntia`,
      description: plan.descripcion || 'Únete y organiza este plan en Juntia.',
    },
  };
}

export default async function PaginaDetallePlan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: planData, error: errorPlan } = await supabase
    .from('planes')
    .select(`
      *,
      creador:perfiles!planes_creador_id_fkey(
        id,
        nombre_completo,
        email,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (errorPlan || !planData) notFound();
  const plan = planData as Plan;

  const { data: miembrosData } = await supabase
    .from('miembros_plan')
    .select(`
      *,
      perfil:perfiles(*)
    `)
    .eq('plan_id', id)
    .order('unido_en', { ascending: true });

  const miembros = (miembrosData || []) as MiembroPlan[];

  const esCreador = plan.creador_id === user.id;
  const miembroActual = miembros.find((m) => m.usuario_id === user.id);
  const esMiembro = Boolean(miembroActual || esCreador);

  if (!esMiembro) redirect(`/unirse/${plan.codigo_invitacion}`);

  const miembroIds = miembros.map((m) => m.id);
  let todasDisponibilidades: DisponibilidadConPerfil[] = [];
  if (miembroIds.length > 0) {
    const { data: dispData } = await supabase
      .from('disponibilidad')
      .select(`
        *,
        miembro:miembros_plan (
          id,
          usuario_id,
          perfil:perfiles (
            nombre_completo,
            email,
            avatar_url,
            bio
          )
        )
      `)
      .in('miembro_id', miembroIds)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    todasDisponibilidades = (dispData || []) as DisponibilidadConPerfil[];
  }

  const misDisponibilidades = miembroActual
    ? (todasDisponibilidades.filter((d) => d.miembro_id === miembroActual.id) as unknown as Disponibilidad[])
    : [];

  const resLugares = await obtenerLugaresDelPlan(id);
  const lugaresPlan = resLugares.success && resLugares.data ? resLugares.data : [];

  const resMensajes = await obtenerMensajesDelPlan(id);
  const mensajesIniciales = resMensajes.success && resMensajes.data ? resMensajes.data : [];

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
          zIndex: 50,
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
            className="link-volver-dash"
          >
            <ArrowLeft size={16} />
            Volver al Dashboard
          </Link>
        </div>
      </header>
      <div
        style={{
          background: `linear-gradient(180deg, rgba(124,92,252,0.08) 0%, transparent 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '3rem 1.5rem 2.5rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}
              >
                {plan.titulo}
              </h1>
              {plan.descripcion && (
                <p style={{ color: '#8080a8', fontSize: '1.05rem', marginTop: '0.75rem', maxWidth: 620, lineHeight: 1.65, fontWeight: 400 }}>
                  {plan.descripcion}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.25rem' }}>
                {plan.fecha && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#c4b5fd',
                      backgroundColor: 'rgba(124,92,252,0.1)',
                      border: '1px solid rgba(124,92,252,0.2)',
                      padding: '0.35rem 0.8rem',
                      borderRadius: 10,
                    }}
                  >
                    <Calendar size={13} />
                    {plan.fecha}
                  </div>
                )}
                {Number(plan.presupuesto_maximo) > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#86efac',
                      backgroundColor: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      padding: '0.35rem 0.8rem',
                      borderRadius: 10,
                    }}
                  >
                    <Euro size={13} />
                    ~{plan.presupuesto_maximo} € / pers.
                  </div>
                )}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#67e8f9',
                    backgroundColor: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    padding: '0.35rem 0.8rem',
                    borderRadius: 10,
                  }}
                >
                  <Users size={13} />
                  {miembros.length} {miembros.length === 1 ? 'participante' : 'participantes'}
                </div>
                {lugaresPlan.length > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#fda4af',
                      backgroundColor: 'rgba(244,63,94,0.1)',
                      border: '1px solid rgba(244,63,94,0.2)',
                      padding: '0.35rem 0.8rem',
                      borderRadius: 10,
                    }}
                  >
                    <MapPin size={13} />
                    {lugaresPlan[0].lugar?.nombre}
                    {lugaresPlan.length > 1 && ` +${lugaresPlan.length - 1}`}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              {esCreador ? (
                <BotonAjustesModal
                  plan={plan}
                  textoBoton="Ajustes del plan"
                  estiloBoton={{
                    width: 'auto',
                    padding: '0.6rem 1.25rem',
                    gap: '0.5rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                  }}
                />
              ) : (
                <BotonAbandonarPlan planId={plan.id} tituloPlan={plan.titulo} />
              )}
            </div>
          </div>
        </div>
      </div>
      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '2.5rem 1.5rem 8rem',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        <div className="animate-fade-in-up">
          <BotonCompartirPlan
            codigoInvitacion={plan.codigo_invitacion}
            tituloPlan={plan.titulo}
          />
        </div>
        <div
          className="animate-fade-in-up animate-delay-100 plan-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: '1.75rem',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <VistaMatrizDisponibilidad
              planId={plan.id}
              miembroActualId={miembroActual?.id}
              todasDisponibilidades={todasDisponibilidades}
              miembros={miembros}
            />
            <SeccionLugaresPlan
              planId={plan.id}
              lugaresPlanIniciales={lugaresPlan}
              esCreador={esCreador}
              miembroActualId={miembroActual?.id}
            />
            <ChatPlan
              planId={plan.id}
              miembroActualId={miembroActual?.id}
              usuarioActualId={user.id}
              mensajesIniciales={mensajesIniciales}
              miembros={miembros}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: 88 }}>
            <ListaParticipantes
              miembros={miembros}
              creadorId={plan.creador_id}
            />
            <div
              style={{
                backgroundColor: 'rgba(13,13,22,0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: '1.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#5a5a8a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 1.1rem',
                }}
              >
                Parámetros del plan
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DetailRow
                  icon={<Calendar size={15} color="#7c5cfc" />}
                  bg="rgba(124,92,252,0.12)"
                  label="Fecha"
                  value={plan.fecha || 'A decidir por votos'}
                  muted={!plan.fecha}
                />
                <DetailRow
                  icon={<Euro size={15} color="#22c55e" />}
                  bg="rgba(34,197,94,0.12)"
                  label="Presupuesto"
                  value={Number(plan.presupuesto_maximo) === 0 ? 'Sin límite' : `~${plan.presupuesto_maximo} € / persona`}
                />
                <DetailRow
                  icon={<Navigation size={15} color="#ec4899" />}
                  bg="rgba(236,72,153,0.12)"
                  label="Radio máximo"
                  value={`${plan.distancia_maxima || 10} km`}
                />
                {lugaresPlan.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={14} color="#38bdf8" />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#5a5a8a', fontWeight: 600 }}>Lugares</span>
                    </div>
                    <div style={{ paddingLeft: '2.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {lugaresPlan.map((lp) => {
                        const href = lp.lugar?.sitio_web ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lp.lugar?.nombre || ''} ${lp.lugar?.direccion || ''}`)}`;
                        return (
                          <a
                            key={lp.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.83rem',
                              fontWeight: 700,
                              color: '#38bdf8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              textDecoration: 'none',
                            }}
                          >
                            {lp.lugar?.nombre}
                            <ExternalLink size={10} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <DetailRow
                    icon={<MapPin size={15} color="#38bdf8" />}
                    bg="rgba(56,189,248,0.12)"
                    label="Lugar"
                    value="Pendiente de añadir"
                    muted
                  />
                )}
              </div>
            </div>
            <TarjetaDistanciasMiembros
              miembros={miembros}
              creadorId={plan.creador_id}
              lugaresPlan={lugaresPlan}
              usuarioActualId={user.id}
            />
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 860px) {
          .plan-grid { grid-template-columns: 1fr !important; }
          .sidebar-sticky { position: static !important; }
        }
        .link-volver-dash:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

function DetailRow({
  icon,
  bg,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', color: '#4a4a6a', fontWeight: 600, lineHeight: 1, marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: muted ? '#4a4a6a' : '#e0e0ff' }}>{value}</div>
      </div>
    </div>
  );
}
