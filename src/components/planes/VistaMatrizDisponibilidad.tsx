'use client';

import { useState } from 'react';
import { MiembroPlan } from '@/types/database';
import {
  votarFranjaPropuesta,
  proponerNuevaFranja,
} from '@/app/actions/disponibilidad';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Flame,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface DisponibilidadConPerfil {
  id: string;
  miembro_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  esta_disponible: boolean;
  miembro?: {
    id: string;
    usuario_id: string;
    perfil?: {
      nombre_completo: string | null;
      email: string;
      avatar_url?: string | null;
      bio?: string | null;
    };
  };
}

interface PropsVistaMatriz {
  planId: string;
  miembroActualId?: string;
  todasDisponibilidades: DisponibilidadConPerfil[];
  miembros: MiembroPlan[];
}

const HORARIOS_RAPIDOS = [
  { nombre: 'Comida', inicio: '13:30', fin: '16:30', emoji: '🍕' },
  { nombre: 'Tardeo', inicio: '17:00', fin: '20:30', emoji: '☕' },
  { nombre: 'Cena', inicio: '21:00', fin: '00:00', emoji: '🍽️' },
  { nombre: 'Copas / Noche', inicio: '23:00', fin: '04:00', emoji: '🍹' },
];

export default function VistaMatrizDisponibilidad({
  planId,
  miembroActualId,
  todasDisponibilidades,
  miembros,
}: PropsVistaMatriz) {
  const totalMiembros = miembros.length;

  const hoy = new Date().toISOString().split('T')[0];
  const [mostrarProponer, setMostrarProponer] = useState(false);
  const [propFecha, setPropFecha] = useState(hoy);
  const [propInicio, setPropInicio] = useState('21:00');
  const [propFin, setPropFin] = useState('00:00');
  const [proponiendo, setProponiendo] = useState(false);
  const [votandoClave, setVotandoClave] = useState<string | null>(null);

  const mapaFranjas = new Map<
    string,
    {
      fecha: string;
      hora_inicio: string;
      hora_fin: string;
      disponibles: { id: string; usuarioId: string; nombre: string; avatarUrl?: string | null }[];
      noDisponibles: { id: string; usuarioId: string; nombre: string; avatarUrl?: string | null }[];
    }
  >();

  for (const d of todasDisponibilidades) {
    const horaIni = d.hora_inicio.slice(0, 5);
    const horaFin = d.hora_fin.slice(0, 5);
    const clave = `${d.fecha}_${horaIni}_${horaFin}`;
    const nombre =
      d.miembro?.perfil?.nombre_completo ||
      d.miembro?.perfil?.email?.split('@')[0] ||
      'Participante';
    const avatarUrl = d.miembro?.perfil?.avatar_url;
    const usuarioId = d.miembro?.usuario_id || '';

    if (!mapaFranjas.has(clave)) {
      mapaFranjas.set(clave, {
        fecha: d.fecha,
        hora_inicio: horaIni,
        hora_fin: horaFin,
        disponibles: [],
        noDisponibles: [],
      });
    }

    const item = mapaFranjas.get(clave)!;
    if (d.esta_disponible) {
      if (!item.disponibles.some((u) => u.id === d.miembro_id)) {
        item.disponibles.push({ id: d.miembro_id, usuarioId, nombre, avatarUrl });
      }
    } else {
      if (!item.noDisponibles.some((u) => u.id === d.miembro_id)) {
        item.noDisponibles.push({ id: d.miembro_id, usuarioId, nombre, avatarUrl });
      }
    }
  }

  const listaFranjas = Array.from(mapaFranjas.values()).map((f) => {
    const porcentaje = totalMiembros > 0 ? Math.round((f.disponibles.length / totalMiembros) * 100) : 0;
    return {
      ...f,
      porcentaje,
    };
  });

  listaFranjas.sort((a, b) => b.disponibles.length - a.disponibles.length || b.porcentaje - a.porcentaje);

  const mejorOpcion = listaFranjas[0];

  const handleVoto = async (
    fecha: string,
    hora_inicio: string,
    hora_fin: string,
    esta_disponible: boolean
  ) => {
    const clave = `${fecha}_${hora_inicio}_${hora_fin}_${esta_disponible}`;
    setVotandoClave(clave);
    const res = await votarFranjaPropuesta(planId, fecha, hora_inicio, hora_fin, esta_disponible);
    if (res.exito) {
      toast.success(esta_disponible ? '¡Te has apuntado a este horario!' : 'Has marcado que no puedes.');
    } else {
      toast.error(res.mensaje || 'Error al registrar tu voto');
    }
    setVotandoClave(null);
  };

  const handleProponerNuevo = async () => {
    if (!propFecha) {
      toast.error('Selecciona una fecha');
      return;
    }
    if (propInicio === propFin) {
      toast.error('La hora de inicio y fin no pueden ser iguales');
      return;
    }

    setProponiendo(true);
    const res = await proponerNuevaFranja(planId, propFecha, propInicio, propFin);
    if (res.exito) {
      toast.success('¡Nuevo horario propuesto al grupo!');
      setMostrarProponer(false);
    } else {
      toast.error(res.mensaje || 'Error al proponer horario');
    }
    setProponiendo(false);
  };

  return (
    <div
      className="card"
      style={{
        padding: '2rem',
        backgroundColor: 'rgba(19, 19, 31, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            <Users size={15} /> Consenso del grupo
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Horarios propuestos y votación
          </h2>
          <p style={{ color: '#9898be', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
            Acepta los horarios propuestos o añade nuevas alternativas para el grupo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarProponer(!mostrarProponer)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.1rem',
            borderRadius: 12,
            backgroundColor: mostrarProponer ? '#7c5cfc' : '#0d0d18',
            border: mostrarProponer ? '1px solid #7c5cfc' : '1px solid rgba(124, 92, 252, 0.6)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: mostrarProponer ? '0 4px 16px rgba(124, 92, 252, 0.45)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            if (!mostrarProponer) {
              e.currentTarget.style.backgroundColor = '#7c5cfc';
              e.currentTarget.style.borderColor = '#7c5cfc';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 92, 252, 0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!mostrarProponer) {
              e.currentTarget.style.backgroundColor = '#0d0d18';
              e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.6)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <Plus size={15} /> {mostrarProponer ? 'Cancelar' : 'Proponer otro horario'}
        </button>
      </div>
      {mostrarProponer && (
        <div
          className="animate-fade-in-up"
          style={{
            backgroundColor: 'rgba(124, 92, 252, 0.12)',
            border: '1px solid rgba(124, 92, 252, 0.35)',
            borderRadius: 16,
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="#a78bfa" /> Proponer un nuevo intervalo horario
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.25rem' }}>
                Fecha
              </label>
              <input
                type="date"
                value={propFecha}
                onChange={(e) => setPropFecha(e.target.value)}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.25rem' }}>
                Hora inicio
              </label>
              <input
                type="time"
                value={propInicio}
                onChange={(e) => setPropInicio(e.target.value)}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.25rem' }}>
                Hora fin
              </label>
              <input
                type="time"
                value={propFin}
                onChange={(e) => setPropFin(e.target.value)}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleProponerNuevo}
            disabled={proponiendo}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            {proponiendo ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {proponiendo ? 'Publicando horario...' : 'Publicar propuesta para todo el grupo'}
          </button>
        </div>
      )}
      {listaFranjas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(124, 92, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Clock size={24} color="#7c5cfc" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            No hay horarios propuestos todavía
          </h3>
          <p style={{ color: '#9898be', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Sé el primero en proponer un día y una franja horaria para que tus amigos voten.
          </p>
          <button
            type="button"
            onClick={() => setMostrarProponer(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Proponer primer horario
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {mejorOpcion && (
            <div
              style={{
                borderRadius: 18,
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.22) 0%, rgba(16, 185, 129, 0.18) 100%)',
                border: '1px solid rgba(124, 92, 252, 0.45)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ backgroundColor: '#7c5cfc', padding: '0.35rem 0.7rem', borderRadius: 8, color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Flame size={13} /> Horario más votado
                  </div>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    {mejorOpcion.fecha}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#86efac' }}>
                    {mejorOpcion.porcentaje}%
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#9898be', display: 'block' }}>
                    {mejorOpcion.disponibles.length} de {totalMiembros} personas
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                {mejorOpcion.hora_inicio} - {mejorOpcion.hora_fin}
              </div>
              <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 99, overflow: 'hidden', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: `${mejorOpcion.porcentaje}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, #7c5cfc, #10b981)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                {mejorOpcion.disponibles.map((u, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#86efac',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={13} /> {u.nombre}
                  </span>
                ))}

                {mejorOpcion.noDisponibles.map((u, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      color: '#fca5a5',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    <XCircle size={13} /> {u.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9898be', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
            Todos los horarios ({listaFranjas.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {listaFranjas.map((f, idx) => {
              const yaVotoSi = miembroActualId ? f.disponibles.some((d) => d.id === miembroActualId) : false;
              const yaVotoNo = miembroActualId ? f.noDisponibles.some((d) => d.id === miembroActualId) : false;

              return (
                <div
                  key={idx}
                  style={{
                    padding: '1.2rem 1.4rem',
                    borderRadius: 16,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                        {f.fecha} · {f.hora_inicio} a {f.hora_fin}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: f.porcentaje >= 75 ? '#86efac' : '#c4b5fd' }}>
                        {f.disponibles.length}/{totalMiembros} ({f.porcentaje}%)
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 99, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${f.porcentaje}%`,
                        height: '100%',
                        borderRadius: 99,
                        backgroundColor: f.porcentaje >= 75 ? '#10b981' : '#7c5cfc',
                      }}
                    />
                  </div>
                  {miembroActualId && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleVoto(f.fecha, f.hora_inicio, f.hora_fin, true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.9rem',
                          borderRadius: 8,
                          backgroundColor: yaVotoSi ? 'rgba(34, 197, 94, 0.22)' : '#0d0d18',
                          border: yaVotoSi ? '1px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.5)',
                          color: yaVotoSi ? '#86efac' : '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          if (!yaVotoSi) {
                            e.currentTarget.style.backgroundColor = '#22c55e';
                            e.currentTarget.style.borderColor = '#22c55e';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!yaVotoSi) {
                            e.currentTarget.style.backgroundColor = '#0d0d18';
                            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <CheckCircle2 size={14} /> {yaVotoSi ? 'Apuntado ✓' : 'Me apunto'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVoto(f.fecha, f.hora_inicio, f.hora_fin, false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.9rem',
                          borderRadius: 8,
                          backgroundColor: yaVotoNo ? 'rgba(244, 63, 94, 0.22)' : '#0d0d18',
                          border: yaVotoNo ? '1px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.45)',
                          color: yaVotoNo ? '#fca5a5' : '#9898be',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                          if (!yaVotoNo) {
                            e.currentTarget.style.backgroundColor = '#f43f5e';
                            e.currentTarget.style.borderColor = '#f43f5e';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(244, 63, 94, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!yaVotoNo) {
                            e.currentTarget.style.backgroundColor = '#0d0d18';
                            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.45)';
                            e.currentTarget.style.color = '#9898be';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <XCircle size={14} /> No puedo
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', color: '#9898be' }}>
                    Pueden: <strong style={{ color: '#ffffff' }}>{f.disponibles.map((d) => d.nombre).join(', ') || 'Nadie todavía'}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
