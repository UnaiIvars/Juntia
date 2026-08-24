'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Plus,
  ArrowRight,
  Clock,
  Euro,
  Navigation,
  UserCheck,
  Copy,
  Check,
  X,
  Mail,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BotonAjustesModal from '@/components/planes/BotonAjustesModal';
import { Plan, InvitacionPlan } from '@/types/database';
import { responderInvitacionPlan } from '@/app/actions/invitaciones';

interface TabsPlanesProps {
  planesPropios: (Plan & { creador?: any; miembros_plan?: any[]; miembros_conteo?: number })[];
  invitacionesPendientes: InvitacionPlan[];
  usuarioId: string;
  emojis?: Record<string, string>;
}

function BotonCopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopiar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    toast.success('¡Código copiado al portapapeles!');

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopiar}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Copiar código de invitación"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.38rem 0.75rem',
        borderRadius: 10,
        backgroundColor: copiado ? 'rgba(34, 197, 94, 0.2)' : hovered ? '#7c5cfc' : '#0d0d18',
        border: copiado
          ? '1px solid #22c55e'
          : hovered
          ? '1px solid #7c5cfc'
          : '1px solid rgba(124, 92, 252, 0.45)',
        color: '#ffffff',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 14px rgba(124, 92, 252, 0.4)' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {copiado ? (
        <>
          <Check size={13} color="#86efac" />
          <span style={{ color: '#86efac', fontWeight: 800 }}>¡Copiado!</span>
        </>
      ) : (
        <>
          <Copy size={13} color={hovered ? '#ffffff' : '#a78bfa'} />
          <span style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>{codigo}</span>
        </>
      )}
    </button>
  );
}

export default function TabsPlanes({
  planesPropios: planesIniciales,
  invitacionesPendientes: invitacionesIniciales,
  usuarioId,
}: TabsPlanesProps) {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState<'propios' | 'amigos'>('propios');
  const [planes, setPlanes] = useState(planesIniciales);
  const [invitaciones, setInvitaciones] = useState<InvitacionPlan[]>(invitacionesIniciales);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const handleAceptarInvitacion = async (invitacion: InvitacionPlan) => {
    setProcesandoId(invitacion.id);
    try {
      const res = await responderInvitacionPlan(invitacion.id, true);
      if (res.exito && res.planId) {
        toast.success('¡Te has unido al plan!');
        setInvitaciones((prev) => prev.filter((i) => i.id !== invitacion.id));
        if (invitacion.plan) {
          setPlanes((prev) => [
            {
              ...invitacion.plan,
              creador: invitacion.anfitrion,
              miembros_conteo: 2,
            } as any,
            ...prev,
          ]);
        }
        setTabActiva('propios');
        router.push(`/planes/${res.planId}`);
      } else {
        toast.error(res.error || 'Error al unirse al plan');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazarInvitacion = async (invitacionId: string) => {
    setProcesandoId(invitacionId);
    try {
      const res = await responderInvitacionPlan(invitacionId, false);
      if (res.exito) {
        toast('Invitación rechazada', { icon: '👋' });
        setInvitaciones((prev) => prev.filter((i) => i.id !== invitacionId));
      } else {
        toast.error(res.error || 'Error al rechazar invitación');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="animate-fade-in-up animate-delay-200">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginBottom: '2rem',
          backgroundColor: 'rgba(13, 13, 24, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 18,
          padding: '0.45rem',
          width: '100%',
        }}
      >
        {[
          { key: 'propios' as const, label: 'Mis planes', icon: Clock, count: planes.length },
          { key: 'amigos' as const, label: 'Invitaciones', icon: Mail, count: invitaciones.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTabActiva(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 14,
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: tabActiva === key ? '#7c5cfc' : 'transparent',
              color: tabActiva === key ? '#ffffff' : '#9898be',
              boxShadow: tabActiva === key ? '0 4px 16px rgba(124, 92, 252, 0.45)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (tabActiva !== key) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (tabActiva !== key) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9898be';
              }
            }}
          >
            <Icon size={17} />
            <span>{label}</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: 8,
                backgroundColor: tabActiva === key ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                color: tabActiva === key ? '#ffffff' : '#7a7a9e',
                marginLeft: '0.2rem',
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>
      {tabActiva === 'propios' && (
        <>
          {planes.length === 0 ? (
            <div
              style={{
                backgroundColor: 'rgba(13, 13, 24, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px dashed rgba(124, 92, 252, 0.3)',
                borderRadius: 24,
                padding: '4.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                {[Calendar, Users, ArrowRight].map((Icon, i) => (
                  <div
                    key={i}
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 16,
                      backgroundColor: 'rgba(124, 92, 252, 0.12)',
                      border: '1px solid rgba(124, 92, 252, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color="#a855f7" />
                  </div>
                ))}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Aún no tienes planes creados
              </h2>
              <p style={{ color: '#9898be', maxWidth: 440, lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
                Crea tu primer plan grupal, define horarios e invita a tus amigos con un código.
              </p>

              <Link
                href="/planes/nuevo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.7rem 1.5rem',
                  borderRadius: 14,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(124, 92, 252, 0.65)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  marginTop: '0.5rem',
                  transition: 'all 0.2s ease',
                }}
                className="tab-empty-link"
              >
                <Plus size={17} /> Crear un plan ahora
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {planes.map((plan: any) => {
                const esCreador = plan.creador_id === usuarioId;
                const miembrosConteo = plan.miembros_plan?.length || plan.miembros_conteo || 1;
                const creador = plan.creador;
                const inicialCreador = (creador?.nombre_completo || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={plan.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(13, 13, 24, 0.85)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 24,
                      padding: '1.85rem 1.85rem 1.6rem',
                      transition: 'all 0.22s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.45)';
                      e.currentTarget.style.boxShadow = '0 10px 32px rgba(124, 92, 252, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#7c5cfc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: '#ffffff',
                              overflow: 'hidden',
                              border: '2px solid rgba(255, 255, 255, 0.2)',
                              flexShrink: 0,
                            }}
                          >
                            {creador?.avatar_url ? (
                              <img
                                src={creador.avatar_url}
                                alt={creador.nombre_completo || 'Usuario'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              inicialCreador
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                              {creador?.nombre_completo || (esCreador ? 'Tú' : 'Organizador')}
                            </span>
                            {creador?.username ? (
                              <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600 }}>
                                @{creador.username}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#7a7a9a' }}>
                                {esCreador ? 'Creador' : 'Organizador'}
                              </span>
                            )}
                          </div>
                        </div>

                        {esCreador && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <BotonAjustesModal plan={plan} />
                          </div>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                        {plan.titulo}
                      </h3>
                      {plan.descripcion && (
                        <p style={{ color: '#9898be', fontSize: '0.9rem', lineHeight: 1.45, margin: '0 0 1.2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {plan.descripcion}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {plan.fecha && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#c4b5fd', backgroundColor: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                            <Calendar size={14} color="#a855f7" /> {plan.fecha}
                          </div>
                        )}
                        {plan.presupuesto_maximo !== undefined && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#86efac', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                            <Euro size={14} /> {Number(plan.presupuesto_maximo) === 0 ? 'Gratis' : `~${plan.presupuesto_maximo} €`}
                          </div>
                        )}
                        {plan.distancia_maxima && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#f472b6', backgroundColor: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                            <Navigation size={14} /> {plan.distancia_maxima} km
                          </div>
                        )}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#d4d4f4', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                          <Users size={14} color="#a855f7" /> {miembrosConteo} {miembrosConteo === 1 ? 'persona' : 'personas'}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#7a7a9a', fontWeight: 600 }}>Código:</span>
                        <BotonCopiarCodigo codigo={plan.codigo_invitacion} />
                      </div>

                      <Link
                        href={`/planes/${plan.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          padding: '0.6rem 1.25rem',
                          borderRadius: 12,
                          backgroundColor: '#0d0d18',
                          border: '1px solid rgba(124, 92, 252, 0.55)',
                          color: '#ffffff',
                          textDecoration: 'none',
                          transition: 'all 0.18s ease',
                        }}
                        className="plan-card-link"
                      >
                        Ver plan <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {tabActiva === 'amigos' && (
        <>
          {invitaciones.length === 0 ? (
            <div
              style={{
                backgroundColor: 'rgba(13, 13, 24, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px dashed rgba(124, 92, 252, 0.3)',
                borderRadius: 24,
                padding: '4.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    backgroundColor: 'rgba(124, 92, 252, 0.12)',
                    border: '1px solid rgba(124, 92, 252, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={24} color="#a855f7" />
                </div>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                No tienes invitaciones pendientes
              </h2>
              <p style={{ color: '#9898be', maxWidth: 440, lineHeight: 1.6, margin: 0, fontSize: '0.92rem' }}>
                Cuando un amigo te invite a un plan, aparecerá aquí para que puedas unirte y votar horarios.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {invitaciones.map((inv) => {
                const plan = inv.plan;
                const anfitrion = inv.anfitrion;
                if (!plan) return null;

                const inicialAnfitrion = (anfitrion?.nombre_completo || 'A').charAt(0).toUpperCase();
                const esCargando = procesandoId === inv.id;

                return (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(13, 13, 24, 0.88)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(124, 92, 252, 0.35)',
                      boxShadow: '0 8px 28px rgba(124, 92, 252, 0.15)',
                      borderRadius: 24,
                      padding: '1.85rem 1.85rem 1.6rem',
                      transition: 'all 0.22s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.65)';
                      e.currentTarget.style.boxShadow = '0 10px 34px rgba(124, 92, 252, 0.28)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.35)';
                      e.currentTarget.style.boxShadow = '0 8px 28px rgba(124, 92, 252, 0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              backgroundColor: '#7c5cfc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: '#ffffff',
                              overflow: 'hidden',
                              border: '2px solid rgba(255, 255, 255, 0.2)',
                              flexShrink: 0,
                            }}
                          >
                            {anfitrion?.avatar_url ? (
                              <img
                                src={anfitrion.avatar_url}
                                alt={anfitrion.nombre_completo || 'Anfitrión'}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              inicialAnfitrion
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                              {anfitrion?.nombre_completo || 'Tu amigo'}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600 }}>
                              {anfitrion?.username ? `@${anfitrion.username}` : 'Te ha invitado'}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            color: '#38bdf8',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            padding: '0.25rem 0.7rem',
                            borderRadius: 10,
                          }}
                        >
                          Nueva invitación
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                        {plan.titulo}
                      </h3>
                      {plan.descripcion && (
                        <p style={{ color: '#9898be', fontSize: '0.9rem', lineHeight: 1.45, margin: '0 0 1.2rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {plan.descripcion}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {plan.fecha && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#c4b5fd', backgroundColor: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                            <Calendar size={14} color="#a855f7" /> {plan.fecha}
                          </div>
                        )}
                        {plan.presupuesto_maximo !== undefined && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#86efac', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                            <Euro size={14} /> {Number(plan.presupuesto_maximo) === 0 ? 'Gratis' : `~${plan.presupuesto_maximo} €`}
                          </div>
                        )}
                        {plan.distancia_maxima && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#f472b6', backgroundColor: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)', padding: '0.3rem 0.7rem', borderRadius: 10, fontWeight: 700 }}>
                            <Navigation size={14} /> {plan.distancia_maxima} km
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRechazarInvitacion(inv.id)}
                        disabled={esCargando}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          padding: '0.55rem 1rem',
                          borderRadius: 12,
                          backgroundColor: '#0d0d18',
                          border: '1px solid rgba(248, 113, 113, 0.45)',
                          color: '#f87171',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0d0d18';
                          e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.45)';
                          e.currentTarget.style.color = '#f87171';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <X size={14} /> Rechazar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAceptarInvitacion(inv)}
                        disabled={esCargando}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          padding: '0.6rem 1.35rem',
                          borderRadius: 12,
                          backgroundColor: '#0d0d18',
                          border: '1px solid rgba(34, 197, 94, 0.65)',
                          color: '#86efac',
                          cursor: 'pointer',
                          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#22c55e';
                          e.currentTarget.style.borderColor = '#22c55e';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.45)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0d0d18';
                          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.65)';
                          e.currentTarget.style.color = '#86efac';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {esCargando ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <UserCheck size={15} />
                        )}
                        Aceptar invitación
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        .tab-empty-link:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124,92,252,0.4);
          transform: translateY(-1px);
        }
        .plan-card-link:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124,92,252,0.4);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
