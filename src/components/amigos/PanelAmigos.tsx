'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  UserPlus,
  UserCheck,
  X,
  Loader2,
  Users,
  Bell,
  Check,
  AtSign,
  Calendar,
  MapPin,
  AlertTriangle,
  User,
} from 'lucide-react';
import {
  buscarUsuarioPorUsername,
  enviarSolicitudAmistad,
  aceptarSolicitudAmistad,
  rechazarSolicitudAmistad,
  cancelarSolicitudAmistad,
  obtenerAmigos,
  obtenerSolicitudesPendientes,
} from '@/app/actions/amigos';
import { Amistad, Perfil } from '@/types/database';
import toast from 'react-hot-toast';

interface PropsPanelAmigos {
  usuarioId: string;
}

type TabActiva = 'buscar' | 'solicitudes' | 'amigos';

function AvatarPerfil({ perfil, size = 40 }: { perfil: Perfil; size?: number }) {
  const iniciales = (perfil.nombre_completo || perfil.username || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (perfil.avatar_url) {
    return (
      <img
        src={perfil.avatar_url}
        alt={perfil.nombre_completo || perfil.username || 'Avatar'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 800,
        color: '#ffffff',
        flexShrink: 0,
      }}
    >
      {iniciales}
    </div>
  );
}

export default function PanelAmigos({ usuarioId }: PropsPanelAmigos) {
  const [abierto, setAbierto] = useState(false);
  const [tabActiva, setTabActiva] = useState<TabActiva>('amigos');

  const [busqueda, setBusqueda] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState<Perfil | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  const [amigos, setAmigos] = useState<Amistad[]>([]);
  const [solicitudes, setSolicitudes] = useState<Amistad[]>([]);
  const [cargando, setCargando] = useState(false);

  const [perfilDetalle, setPerfilDetalle] = useState<Perfil | null>(null);
  const [amistadAEliminar, setAmistadAEliminar] = useState<{ id: string; perfil: Perfil } | null>(null);
  const [eliminandoAmigo, setEliminandoAmigo] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    const [resAmigos, resSolicitudes] = await Promise.all([
      obtenerAmigos(),
      obtenerSolicitudesPendientes(),
    ]);
    setAmigos(resAmigos.amigos);
    setSolicitudes(resSolicitudes.solicitudes);
    setCargando(false);
  }, []);

  useEffect(() => {
    if (abierto) cargarDatos();
  }, [abierto, cargarDatos]);

  const handleBusqueda = (valor: string) => {
    setBusqueda(valor);
    setResultadoBusqueda(null);
    setSolicitudEnviada(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const limpio = valor.replace(/^@/, '').trim();
    if (!limpio || limpio.length < 2) return;
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      const res = await buscarUsuarioPorUsername(limpio);
      setResultadoBusqueda(res.perfil);
      setBuscando(false);
    }, 550);
  };

  const handleEnviarSolicitud = async (receptorId: string) => {
    setEnviandoSolicitud(true);
    const res = await enviarSolicitudAmistad(receptorId);
    if (res.exito) {
      setSolicitudEnviada(true);
      toast.success('¡Solicitud enviada!');
    } else {
      toast.error(res.error || 'Error al enviar solicitud');
    }
    setEnviandoSolicitud(false);
  };

  const handleAceptar = async (amistadId: string) => {
    const res = await aceptarSolicitudAmistad(amistadId);
    if (res.exito) {
      toast.success('¡Solicitud aceptada!');
      cargarDatos();
    } else {
      toast.error(res.error || 'Error');
    }
  };

  const handleRechazar = async (amistadId: string) => {
    const res = await rechazarSolicitudAmistad(amistadId);
    if (res.exito) {
      toast('Solicitud rechazada', { icon: '👋' });
      cargarDatos();
    } else {
      toast.error(res.error || 'Error');
    }
  };

  const confirmarEliminarAmigo = async () => {
    if (!amistadAEliminar) return;
    setEliminandoAmigo(true);
    const res = await cancelarSolicitudAmistad(amistadAEliminar.id);
    if (res.exito) {
      toast('Amigo eliminado', { icon: '👋' });
      setAmistadAEliminar(null);
      cargarDatos();
    } else {
      toast.error(res.error || 'Error al eliminar');
    }
    setEliminandoAmigo(false);
  };

  const NUM_SOLICITUDES = solicitudes.length;

  const estiloPanel: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: 320,
    backgroundColor: 'rgba(11, 11, 20, 0.98)',
    backdropFilter: 'blur(24px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    transform: abierto ? 'translateX(0)' : 'translateX(-320px)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: abierto ? '4px 0 40px rgba(0,0,0,0.7), 0 0 60px rgba(124,92,252,0.15)' : 'none',
  };

  const estiloBtnFlecha: React.CSSProperties = {
    position: 'fixed',
    left: abierto ? 320 : 0,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 101,
    width: 28,
    height: 72,
    backgroundColor: '#0d0d18',
    border: '1px solid rgba(124, 92, 252, 0.7)',
    borderLeft: 'none',
    borderRadius: '0 12px 12px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, box-shadow 0.2s',
    boxShadow: '2px 0 12px rgba(124, 92, 252, 0.3)',
  };

  const perfilAmigo = (amistad: Amistad) =>
    amistad.solicitante_id === usuarioId ? amistad.receptor : amistad.solicitante;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        style={estiloBtnFlecha}
        title={abierto ? 'Cerrar panel de amigos' : 'Abrir panel de amigos'}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#7c5cfc';
          e.currentTarget.style.borderColor = '#7c5cfc';
          e.currentTarget.style.boxShadow = '2px 0 24px rgba(124, 92, 252, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0d0d18';
          e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.7)';
          e.currentTarget.style.boxShadow = '2px 0 12px rgba(124, 92, 252, 0.3)';
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {abierto ? <ChevronLeft size={16} color="#fff" /> : <ChevronRight size={16} color="#fff" />}
          {!abierto && NUM_SOLICITUDES > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -18,
                right: -8,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#f43f5e',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {NUM_SOLICITUDES}
            </div>
          )}
        </div>
      </button>
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <div style={estiloPanel}>
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                <Users size={13} /> Panel social
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Amigos</h2>
            </div>
            <button
              onClick={() => setAbierto(false)}
              style={{
                background: '#0d0d18',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9898be',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0d0d18';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#9898be';
              }}
              aria-label="Cerrar panel"
            >
              <X size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {([
              { id: 'amigos', label: 'Amigos', icon: <UserCheck size={13} /> },
              { id: 'solicitudes', label: `Solicitudes${NUM_SOLICITUDES > 0 ? ` (${NUM_SOLICITUDES})` : ''}`, icon: <Bell size={13} /> },
              { id: 'buscar', label: 'Buscar', icon: <Search size={13} /> },
            ] as { id: TabActiva; label: string; icon: React.ReactNode }[]).map((tab) => {
              const activo = tabActiva === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.3rem',
                    borderRadius: 10,
                    backgroundColor: activo ? '#7c5cfc' : '#0d0d18',
                    border: activo ? '1px solid #7c5cfc' : '1px solid rgba(124, 92, 252, 0.3)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    boxShadow: activo ? '0 3px 12px rgba(124, 92, 252, 0.4)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!activo) {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 92, 252, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!activo) {
                      e.currentTarget.style.backgroundColor = '#0d0d18';
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.3)';
                    }
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {tabActiva === 'buscar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#9898be', marginBottom: '0.65rem' }}>
                  Busca a alguien por su <strong style={{ color: '#c4b5fd' }}>@usuario</strong>
                </p>
                <div style={{ position: 'relative' }}>
                  <AtSign size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => handleBusqueda(e.target.value)}
                    placeholder="nombre_usuario"
                    className="input-base"
                    style={{ paddingLeft: '2.2rem', fontSize: '0.88rem' }}
                  />
                  {buscando && (
                    <Loader2 size={14} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#9898be', animation: 'spin 1s linear infinite' }} />
                  )}
                </div>
              </div>
              {resultadoBusqueda && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    onClick={() => setPerfilDetalle(resultadoBusqueda)}
                    style={{ cursor: 'pointer' }}
                    title="Ver perfil"
                  >
                    <AvatarPerfil perfil={resultadoBusqueda} size={44} />
                  </div>
                  <div
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    onClick={() => setPerfilDetalle(resultadoBusqueda)}
                  >
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {resultadoBusqueda.nombre_completo || resultadoBusqueda.username}
                    </div>
                    <div style={{ color: '#9898be', fontSize: '0.78rem' }}>
                      @{resultadoBusqueda.username}
                    </div>
                  </div>

                  {solicitudEnviada ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#86efac', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      <Check size={14} /> Enviada
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEnviarSolicitud(resultadoBusqueda!.id)}
                      disabled={enviandoSolicitud}
                      title="Enviar solicitud de amistad"
                      style={{
                        backgroundColor: '#0d0d18',
                        border: '1px solid rgba(124, 92, 252, 0.7)',
                        borderRadius: 10,
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        color: '#ffffff',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#7c5cfc';
                        e.currentTarget.style.borderColor = '#7c5cfc';
                        e.currentTarget.style.boxShadow = '0 3px 12px rgba(124, 92, 252, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0d0d18';
                        e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.7)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {enviandoSolicitud ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    </button>
                  )}
                </div>
              )}

              {busqueda.length >= 2 && !buscando && !resultadoBusqueda && (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b6b90', fontSize: '0.85rem' }}>
                  <AtSign size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4, display: 'block' }} />
                  No se encontró ningún usuario con ese nombre.
                </div>
              )}
            </div>
          )}
          {tabActiva === 'solicitudes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cargando ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 size={22} style={{ color: '#7c5cfc', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : solicitudes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#6b6b90' }}>
                  <Bell size={30} style={{ margin: '0 auto 0.75rem', opacity: 0.4, display: 'block' }} />
                  <p style={{ fontSize: '0.85rem' }}>Sin solicitudes pendientes</p>
                </div>
              ) : (
                solicitudes.map((sol) => {
                  const solicitante = sol.solicitante;
                  if (!solicitante) return null;
                  return (
                    <div
                      key={sol.id}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 14,
                        padding: '0.9rem',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem', cursor: 'pointer' }}
                        onClick={() => setPerfilDetalle(solicitante)}
                      >
                        <AvatarPerfil perfil={solicitante} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {solicitante.nombre_completo || solicitante.username}
                          </div>
                          <div style={{ color: '#9898be', fontSize: '0.75rem' }}>@{solicitante.username}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleAceptar(sol.id)}
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: 8,
                            backgroundColor: '#0d0d18',
                            border: '1px solid rgba(34, 197, 94, 0.6)',
                            color: '#86efac',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.18s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#22c55e';
                            e.currentTarget.style.borderColor = '#22c55e';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(34, 197, 94, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0d0d18';
                            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                            e.currentTarget.style.color = '#86efac';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <Check size={13} /> Aceptar
                        </button>
                        <button
                          onClick={() => handleRechazar(sol.id)}
                          style={{
                            flex: 1,
                            padding: '0.45rem',
                            borderRadius: 8,
                            backgroundColor: '#0d0d18',
                            border: '1px solid rgba(248, 113, 113, 0.45)',
                            color: '#f87171',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.18s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0d0d18';
                            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.45)';
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <X size={13} /> Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          {tabActiva === 'amigos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {cargando ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 size={22} style={{ color: '#7c5cfc', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : amigos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#6b6b90' }}>
                  <Users size={30} style={{ margin: '0 auto 0.75rem', opacity: 0.4, display: 'block' }} />
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Aún no tienes amigos</p>
                  <button
                    onClick={() => setTabActiva('buscar')}
                    style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Buscar usuarios
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.75rem', color: '#6b6b90', marginBottom: '0.25rem', fontWeight: 600 }}>
                    {amigos.length} {amigos.length === 1 ? 'amigo' : 'amigos'}
                  </p>
                  {amigos.map((amistad) => {
                    const amigo = perfilAmigo(amistad);
                    if (!amigo) return null;
                    return (
                      <div
                        key={amistad.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.75rem 0.85rem',
                          borderRadius: 14,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0, cursor: 'pointer' }}
                          onClick={() => setPerfilDetalle(amigo)}
                          title="Ver perfil de este amigo"
                        >
                          <AvatarPerfil perfil={amigo} size={38} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {amigo.nombre_completo || amigo.username}
                            </div>
                            <div style={{ color: '#9898be', fontSize: '0.75rem' }}>@{amigo.username}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAmistadAEliminar({ id: amistad.id, perfil: amigo })}
                          title="Eliminar de amigos"
                          style={{
                            background: '#0d0d18',
                            border: '1px solid rgba(248, 113, 113, 0.35)',
                            borderRadius: 8,
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#f87171',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0d0d18';
                            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.35)';
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {perfilDetalle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            backgroundColor: 'rgba(5, 5, 12, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setPerfilDetalle(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: 'rgba(15, 15, 26, 0.95)',
              border: '1px solid rgba(124, 92, 252, 0.4)',
              borderRadius: 24,
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 92, 252, 0.2)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPerfilDetalle(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9898be',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0d0d18';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#9898be';
              }}
            >
              <X size={16} />
            </button>
            <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  padding: 3,
                  background: 'linear-gradient(135deg, #7c5cfc, #ec4899)',
                  boxShadow: '0 8px 24px rgba(124, 92, 252, 0.4)',
                }}
              >
                {perfilDetalle.avatar_url ? (
                  <img
                    src={perfilDetalle.avatar_url}
                    alt={perfilDetalle.nombre_completo || 'Avatar'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: '#1c1c30',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 900,
                      color: '#ffffff',
                    }}
                  >
                    {(perfilDetalle.nombre_completo || perfilDetalle.username || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.2rem' }}>
              {perfilDetalle.nombre_completo || perfilDetalle.username}
            </h3>
            {perfilDetalle.username && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#c4b5fd',
                  backgroundColor: 'rgba(124, 92, 252, 0.15)',
                  border: '1px solid rgba(124, 92, 252, 0.3)',
                  padding: '0.2rem 0.75rem',
                  borderRadius: 10,
                  marginBottom: '1rem',
                }}
              >
                @{perfilDetalle.username}
              </div>
            )}
            {perfilDetalle.bio && (
              <p style={{ color: '#d4d4f4', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1.25rem', fontStyle: 'italic' }}>
                "{perfilDetalle.bio}"
              </p>
            )}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {perfilDetalle.creado_en && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(124, 92, 252, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={18} color="#a78bfa" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9898be', fontWeight: 600, textTransform: 'uppercase' }}>
                      Miembro desde
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                      {new Date(perfilDetalle.creado_en).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(perfilDetalle.ciudad || perfilDetalle.direccion) && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={18} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#9898be', fontWeight: 600, textTransform: 'uppercase' }}>
                      Ubicación
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                      {perfilDetalle.ciudad || perfilDetalle.direccion}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPerfilDetalle(null)}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '0.7rem 1.25rem',
                borderRadius: 12,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.6)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7c5cfc';
                e.currentTarget.style.borderColor = '#7c5cfc';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 92, 252, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0d0d18';
                e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.6)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Cerrar perfil
            </button>
          </div>
        </div>
      )}
      {amistadAEliminar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 115,
            backgroundColor: 'rgba(5, 5, 12, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setAmistadAEliminar(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: 'rgba(18, 14, 28, 0.98)',
              border: '1px solid rgba(244, 63, 94, 0.45)',
              borderRadius: 22,
              padding: '2rem 1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(244, 63, 94, 0.2)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <AlertTriangle size={26} color="#f87171" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem' }}>
              ¿Eliminar a {amistadAEliminar.perfil.nombre_completo || `@${amistadAEliminar.perfil.username}`}?
            </h3>
            <p style={{ color: '#9898be', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1.75rem' }}>
              Dejaréis de estar conectados como amigos en Juntia y no podréis invitaros mutuamente a nuevos planes de forma directa.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => setAmistadAEliminar(null)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: 12,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarEliminarAmigo}
                disabled={eliminandoAmigo}
                style={{
                  flex: 1.3,
                  padding: '0.7rem 1rem',
                  borderRadius: 12,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(248, 113, 113, 0.65)',
                  color: '#f87171',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.65)';
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {eliminandoAmigo ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                {eliminandoAmigo ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
