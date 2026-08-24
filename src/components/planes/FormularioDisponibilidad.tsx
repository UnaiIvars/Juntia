'use client';

import { useState } from 'react';
import { guardarDisponibilidad, eliminarFranjaDisponibilidad, FranjaEntrada } from '@/app/actions/disponibilidad';
import { Disponibilidad } from '@/types/database';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const HORARIOS_PREDEFINIDOS = [
  { nombre: 'Comida / Mediodía', inicio: '13:30', fin: '16:30', emoji: '🍕' },
  { nombre: 'Tardeo / Café', inicio: '17:00', fin: '20:30', emoji: '☕' },
  { nombre: 'Cena', inicio: '21:00', fin: '00:00', emoji: '🍽️' },
  { nombre: 'Copas / Noche', inicio: '23:00', fin: '04:00', emoji: '🍹' },
];

export default function FormularioDisponibilidad({
  planId,
  fechaPlan,
  misDisponibilidades,
}: {
  planId: string;
  fechaPlan?: string | null;
  misDisponibilidades: Disponibilidad[];
}) {
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(fechaPlan || hoy);
  const [horaInicio, setHoraInicio] = useState('20:00');
  const [horaFin, setHoraFin] = useState('23:30');
  const [estaDisponible, setEstaDisponible] = useState(true);

  const [franjasLocales, setFranjasLocales] = useState<FranjaEntrada[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  const aplicarPredefinido = (inicio: string, fin: string) => {
    setHoraInicio(inicio);
    setHoraFin(fin);
  };

  const agregarFranjaLocal = () => {
    if (!fecha) {
      toast.error('Selecciona una fecha');
      return;
    }
    if (!horaInicio || !horaFin) {
      toast.error('Introduce una hora de inicio y de fin');
      return;
    }
    if (horaInicio === horaFin) {
      toast.error('La hora de inicio y fin no pueden ser iguales');
      return;
    }

    const totalActual = misDisponibilidades.length + franjasLocales.length;
    if (totalActual >= 3) {
      toast.error('Solo puedes indicar un máximo de 3 tramos horarios.');
      return;
    }

    setFranjasLocales((prev) => [
      ...prev,
      {
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        esta_disponible: estaDisponible,
      },
    ]);
    toast.success('Franja añadida a la lista');
  };

  const quitarFranjaLocal = (index: number) => {
    setFranjasLocales((prev) => prev.filter((_, i) => i !== index));
    toast.success('Franja eliminada de la lista');
  };

  const handleGuardar = async () => {
    if (franjasLocales.length === 0) {
      toast.error('Añade al menos una franja de horario a la lista');
      return;
    }

    setGuardando(true);
    const res = await guardarDisponibilidad(planId, franjasLocales);
    if (res.exito) {
      toast.success('¡Disponibilidad guardada correctamente!');
      setFranjasLocales([]);
    } else {
      toast.error(res.mensaje || 'Error al guardar');
    }
    setGuardando(false);
  };

  const handleEliminarGuardada = async (id: string) => {
    setBorrandoId(id);
    const res = await eliminarFranjaDisponibilidad(id, planId);
    if (res.exito) {
      toast.success('Franja eliminada');
    } else {
      toast.error(res.mensaje || 'Error al eliminar');
    }
    setBorrandoId(null);
  };

  const totalFranjas = misDisponibilidades.length + franjasLocales.length;

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 600 }}>
          <Clock size={16} /> Tu horario
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: totalFranjas >= 3 ? '#fbbf24' : '#86efac',
            backgroundColor: 'rgba(124, 92, 252, 0.15)',
            padding: '0.2rem 0.6rem',
            borderRadius: 8,
          }}
        >
          {totalFranjas}/3 tramos
        </span>
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
        Indicar mi disponibilidad
      </h2>
      <p style={{ color: '#9898be', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
        Añade hasta <strong>3 días y horas</strong> en los que estás libre para que el grupo encuentre el momento ideal.
      </p>
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 18,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input-base"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#9898be', marginBottom: '0.5rem' }}>
            Atajos de franja habitual
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {HORARIOS_PREDEFINIDOS.map((hp, idx) => {
              const activo = horaInicio === hp.inicio && horaFin === hp.fin;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => aplicarPredefinido(hp.inicio, hp.fin)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 10,
                    backgroundColor: activo ? '#7c5cfc' : '#0d0d18',
                    border: activo ? '1px solid #7c5cfc' : '1px solid rgba(124, 92, 252, 0.45)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: activo ? '0 4px 14px rgba(124, 92, 252, 0.45)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!activo) {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 92, 252, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!activo) {
                      e.currentTarget.style.backgroundColor = '#0d0d18';
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.45)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>{hp.emoji}</span>
                    <span>{hp.nombre}</span>
                  </div>
                  <div style={{ color: activo ? '#ffffff' : '#a78bfa', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                    {hp.inicio} - {hp.fin}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
              Desde
            </label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="input-base"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
              Hasta
            </label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="input-base"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setEstaDisponible(true)}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 12,
              backgroundColor: estaDisponible ? 'rgba(34, 197, 94, 0.18)' : '#0d0d18',
              border: estaDisponible ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.12)',
              color: estaDisponible ? '#86efac' : '#9898be',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} /> Disponible
          </button>

          <button
            type="button"
            onClick={() => setEstaDisponible(false)}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 12,
              backgroundColor: !estaDisponible ? 'rgba(244, 63, 94, 0.18)' : '#0d0d18',
              border: !estaDisponible ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.12)',
              color: !estaDisponible ? '#fca5a5' : '#9898be',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
            }}
          >
            <XCircle size={16} /> No puedo
          </button>
        </div>
        <button
          type="button"
          onClick={agregarFranjaLocal}
          disabled={totalFranjas >= 3}
          style={{
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.75rem',
            borderRadius: 12,
            backgroundColor: totalFranjas >= 3 ? 'rgba(255, 255, 255, 0.04)' : '#0d0d18',
            border: totalFranjas >= 3 ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(124, 92, 252, 0.65)',
            color: totalFranjas >= 3 ? '#6b7280' : '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: totalFranjas >= 3 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            if (totalFranjas < 3) {
              e.currentTarget.style.backgroundColor = '#7c5cfc';
              e.currentTarget.style.borderColor = '#7c5cfc';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 92, 252, 0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (totalFranjas < 3) {
              e.currentTarget.style.backgroundColor = '#0d0d18';
              e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.65)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <Plus size={17} />
          <span>
            {totalFranjas >= 3 ? 'Máximo de 3 franjas alcanzado' : 'Añadir franja a la lista'}
          </span>
        </button>
      </div>
      {franjasLocales.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.6rem' }}>
            Nuevas franjas listas para guardar ({franjasLocales.length}):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {franjasLocales.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  backgroundColor: 'rgba(124, 92, 252, 0.12)',
                  border: '1px solid rgba(124, 92, 252, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {f.esta_disponible ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : (
                    <XCircle size={16} color="#f43f5e" />
                  )}
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                    {f.fecha} · {f.hora_inicio} a {f.hora_fin}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => quitarFranjaLocal(i)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.6rem',
                    borderRadius: 8,
                    backgroundColor: '#0d0d18',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d0d18';
                    e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                >
                  <Trash2 size={13} />
                  <span>Borrar</span>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem 1.5rem',
              borderRadius: 14,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(124, 92, 252, 0.7)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: guardando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              if (!guardando) {
                e.currentTarget.style.backgroundColor = '#7c5cfc';
                e.currentTarget.style.borderColor = '#7c5cfc';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 92, 252, 0.45)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!guardando) {
                e.currentTarget.style.backgroundColor = '#0d0d18';
                e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.7)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {guardando ? 'Guardando...' : 'Confirmar y guardar disponibilidad'}
          </button>
        </div>
      )}
      {misDisponibilidades.length > 0 && (
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9898be', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>
            Tus horarios registrados ({misDisponibilidades.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {misDisponibilidades.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.9rem',
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {d.esta_disponible ? (
                    <span style={{ fontSize: '0.75rem', color: '#86efac', backgroundColor: 'rgba(34,197,94,0.15)', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>
                      Disponible
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#fca5a5', backgroundColor: 'rgba(244,63,94,0.15)', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>
                      No disponible
                    </span>
                  )}
                  <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                    {d.fecha} · {d.hora_inicio.slice(0, 5)} - {d.hora_fin.slice(0, 5)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleEliminarGuardada(d.id)}
                  disabled={borrandoId === d.id}
                  title="Eliminar esta franja"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: '#0d0d18',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    color: '#f87171',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d0d18';
                    e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.3)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                >
                  {borrandoId === d.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
