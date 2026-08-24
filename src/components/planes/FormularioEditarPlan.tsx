'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { editarPlan, eliminarPlan, type EstadoFormularioPlan } from '@/app/actions/planes';
import { obtenerAmigos } from '@/app/actions/amigos';
import { Plan, Amistad } from '@/types/database';
import ModalExplorarLugares from '@/components/lugares/ModalExplorarLugares';
import { inferirCategoriaPorTexto, inferirPrecioPorCategoria, CATEGORIAS_LUGARES } from '@/lib/geo';
import {
  Calendar,
  Euro,
  Navigation,
  ArrowLeft,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Users,
  UserPlus,
  Check,
  MapPin,
  Search,
  ExternalLink,
  MousePointerClick,
  AlertCircle,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MapaInteractivo = dynamic(() => import('@/components/mapa/MapaInteractivo'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7, 7, 15, 0.9)', borderRadius: 20 }}>
      <Loader2 size={32} color="#7c5cfc" className="animate-spin" />
    </div>
  ),
});

const TIPOS_PLAN = [
  { id: 'cena', nombre: 'Cena o comida', emoji: '🍕', desc: 'Restaurantes, pizzerías, sushi...' },
  { id: 'fiesta', nombre: 'Copas y fiesta', emoji: '🍹', desc: 'Bares, pubs, discotecas...' },
  { id: 'deporte', nombre: 'Actividad y deporte', emoji: '⚽', desc: 'Pádel, escape room, bolera...' },
  { id: 'cafe', nombre: 'Café o tardeo', emoji: '☕', desc: 'Cafeterías, terrazas, brunch...' },
  { id: 'viaje', nombre: 'Escapada o viaje', emoji: '✈️', desc: 'Fin de semana, casa rural...' },
  { id: 'otro', nombre: 'Otro plan', emoji: '🎯', desc: 'Cine, picnic, quedada libre...' },
];

const HORARIOS_RAPIDOS = [
  { nombre: 'Comida', inicio: '13:30', fin: '16:30', emoji: '🍕' },
  { nombre: 'Tardeo', inicio: '17:00', fin: '20:30', emoji: '☕' },
  { nombre: 'Cena', inicio: '21:00', fin: '00:00', emoji: '🍽️' },
  { nombre: 'Copas / Noche', inicio: '23:00', fin: '04:00', emoji: '🍹' },
];

export interface FranjaPropuesta {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface LugarPropuesto {
  nombre: string;
  direccion: string | null;
  categoria: string;
  precio: string;
  lat: number;
  lng: number;
  link_maps?: string | null;
}

interface PropsFormularioEditarPlan {
  plan: Plan;
  franjasIniciales: FranjaPropuesta[];
  lugaresIniciales: LugarPropuesto[];
  amigosInvitadosIniciales: string[];
}

export default function FormularioEditarPlan({
  plan,
  franjasIniciales = [],
  lugaresIniciales = [],
  amigosInvitadosIniciales = [],
}: PropsFormularioEditarPlan) {
  const router = useRouter();

  const editarPlanConId = (state: EstadoFormularioPlan, payload: FormData) =>
    editarPlan(plan.id, state, payload);

  const [estado, accion, pendiente] = useActionState(
    editarPlanConId as (state: EstadoFormularioPlan, payload: FormData) => Promise<EstadoFormularioPlan>,
    undefined
  );

  const hoy = new Date().toISOString().split('T')[0];

  const [tipoSeleccionado, setTipoSeleccionado] = useState(plan.tipo_plan || 'cena');
  const [presupuesto, setPresupuesto] = useState(
    plan.presupuesto_maximo !== undefined && plan.presupuesto_maximo !== null
      ? Number(plan.presupuesto_maximo)
      : 25
  );
  const [distancia, setDistancia] = useState(
    plan.distancia_maxima !== undefined && plan.distancia_maxima !== null
      ? Number(plan.distancia_maxima)
      : 10
  );
  const [fechaGeneral, setFechaGeneral] = useState(plan.fecha || hoy);

  const [franjasPropuestas, setFranjasPropuestas] = useState<FranjaPropuesta[]>(franjasIniciales);
  const [nuevaFecha, setNuevaFecha] = useState(plan.fecha || hoy);
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('');

  const [lugaresPropuestos, setLugaresPropuestos] = useState<LugarPropuesto[]>(lugaresIniciales);
  const [indiceLugarEditando, setIndiceLugarEditando] = useState<number | null>(null);
  const [modalBuscadorAbierto, setModalBuscadorAbierto] = useState(false);

  const [amigos, setAmigos] = useState<Amistad[]>([]);
  const [usuarioActualId, setUsuarioActualId] = useState<string>('');
  const [cargandoAmigos, setCargandoAmigos] = useState(true);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState<string[]>(amigosInvitadosIniciales);

  const [eliminando, setEliminando] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await obtenerAmigos();
        setAmigos(res.amigos || []);
        if (res.usuarioId) {
          setUsuarioActualId(res.usuarioId);
        }
      } catch (err) {
        console.error('Error cargando amigos:', err);
      } finally {
        setCargandoAmigos(false);
      }
    }
    cargar();
  }, []);

  const agregarFranja = () => {
    if (!nuevaFecha) {
      toast.error('Selecciona el día propuesto');
      return;
    }
    if (!nuevaHoraInicio || !nuevaHoraFin) {
      toast.error('Introduce una hora de inicio y de fin (o pulsa un atajo rápido)');
      return;
    }
    if (nuevaHoraInicio === nuevaHoraFin) {
      toast.error('La hora de inicio y fin no pueden ser iguales.');
      return;
    }
    if (franjasPropuestas.length >= 3) {
      toast.error('Solo puedes proponer un máximo de 3 franjas horarias.');
      return;
    }

    const yaExiste = franjasPropuestas.some(
      (f) => f.fecha === nuevaFecha && f.hora_inicio === nuevaHoraInicio && f.hora_fin === nuevaHoraFin
    );
    if (yaExiste) {
      toast.error('Este horario ya está añadido a la propuesta.');
      return;
    }

    setFranjasPropuestas((prev) => [
      ...prev,
      { fecha: nuevaFecha, hora_inicio: nuevaHoraInicio, hora_fin: nuevaHoraFin },
    ]);
    setFechaGeneral(nuevaFecha);
    toast.success('Horario añadido a la propuesta');
  };

  const eliminarFranja = (index: number) => {
    setFranjasPropuestas((prev) => prev.filter((_, i) => i !== index));
    toast.success('Horario eliminado');
  };

  const aplicarAtajo = (inicio: string, fin: string) => {
    setNuevaHoraInicio(inicio);
    setNuevaHoraFin(fin);
  };

  const toggleAmigo = (amigoId: string) => {
    setAmigosSeleccionados((prev) =>
      prev.includes(amigoId) ? prev.filter((id) => id !== amigoId) : [...prev, amigoId]
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            <Sparkles size={16} /> Ajustes del plan
          </div>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Editar plan
          </h1>
          <p style={{ color: '#9898be', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Código de invitación: <strong style={{ color: '#c4b5fd', fontFamily: 'monospace' }}>{plan.codigo_invitacion}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalEliminarAbierto(true)}
          disabled={eliminando || pendiente}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 12,
            backgroundColor: '#0d0d18',
            border: '1px solid rgba(248, 113, 113, 0.5)',
            color: '#f87171',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
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
            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {eliminando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {eliminando ? 'Eliminando...' : 'Eliminar plan'}
        </button>
      </div>
      {estado?.mensaje && (
        <div
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 14,
            padding: '1rem 1.25rem',
            color: '#fca5a5',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '2rem',
          }}
        >
          {estado.mensaje}
        </div>
      )}

      <form
        action={accion}
        onSubmit={(e) => {
          if (franjasPropuestas.length === 0) {
            e.preventDefault();
            toast.error('Debes tener al menos 1 horario propuesto para el grupo.');
            const seccion = document.getElementById('seccion-horarios-grupo');
            if (seccion) {
              seccion.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
      >
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(19, 19, 31, 0.75)', backdropFilter: 'blur(16px)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem' }}>
            1. Información básica
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="titulo" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Nombre del plan <span style={{ color: '#ec4899' }}>*</span>
              </label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                defaultValue={plan.titulo}
                className={`input-base ${estado?.errores?.titulo ? 'input-error' : ''}`}
                disabled={pendiente}
                required
              />
              {estado?.errores?.titulo && (
                <p className="error-text">{estado.errores.titulo[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="descripcion" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Descripción o notas <span style={{ color: '#9898be', fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                defaultValue={plan.descripcion || ''}
                className="input-base"
                style={{ resize: 'vertical' }}
                disabled={pendiente}
              />
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(19, 19, 31, 0.75)', backdropFilter: 'blur(16px)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            2. Tipo de plan
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#9898be', marginBottom: '1.25rem' }}>
            Categoría para las sugerencias del grupo.
          </p>

          <input type="hidden" name="tipo_plan" value={tipoSeleccionado} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.9rem',
            }}
          >
            {TIPOS_PLAN.map((tipo) => {
              const esSeleccionado = tipoSeleccionado === tipo.id;
              return (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => setTipoSeleccionado(tipo.id)}
                  style={{
                    textAlign: 'left',
                    padding: '1.1rem 1rem',
                    borderRadius: 14,
                    backgroundColor: esSeleccionado ? 'rgba(124, 92, 252, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                    border: esSeleccionado ? '2px solid #7c5cfc' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: esSeleccionado ? '0 4px 18px rgba(124, 92, 252, 0.3)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!esSeleccionado) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!esSeleccionado) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>{tipo.emoji}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: esSeleccionado ? '#ffffff' : '#e2e2f0' }}>
                    {tipo.nombre}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9898be', marginTop: '0.2rem' }}>
                    {tipo.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div
          id="seccion-horarios-grupo"
          className="card"
          style={{
            padding: '2rem',
            backgroundColor: 'rgba(19, 19, 31, 0.75)',
            backdropFilter: 'blur(16px)',
            border: franjasPropuestas.length === 0 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(124, 92, 252, 0.3)',
            borderRadius: 20,
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700 }}>
              <Clock size={16} /> Horarios de la quedada
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: franjasPropuestas.length === 0 ? '#f87171' : franjasPropuestas.length === 3 ? '#fbbf24' : '#86efac',
                backgroundColor: franjasPropuestas.length === 0 ? 'rgba(248, 113, 113, 0.15)' : 'rgba(124, 92, 252, 0.15)',
                padding: '0.2rem 0.65rem',
                borderRadius: 8,
              }}
            >
              {franjasPropuestas.length}/3 horarios (mín. 1)
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            3. Propón los horarios para el grupo <span style={{ color: '#ec4899', fontSize: '0.9rem' }}>*</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#9898be', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Añade entre <strong>1 y 3 franjas horarias</strong> que propones. Tus amigos votarán cuál les viene mejor al unirse al plan.
          </p>

          <input
            type="hidden"
            name="franjas_horarias"
            value={JSON.stringify(franjasPropuestas)}
          />
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.35rem' }}>
                Día propuesto
              </label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => {
                  setNuevaFecha(e.target.value);
                  setFechaGeneral(e.target.value);
                }}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9898be', marginBottom: '0.4rem' }}>
                Atajos rápidos
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {HORARIOS_RAPIDOS.map((hr, i) => {
                  const activo = nuevaHoraInicio === hr.inicio && nuevaHoraFin === hr.fin;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => aplicarAtajo(hr.inicio, hr.fin)}
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
                      <div>{hr.emoji} {hr.nombre}</div>
                      <div style={{ fontSize: '0.7rem', color: activo ? '#ffffff' : '#a78bfa', marginTop: '0.15rem' }}>
                        {hr.inicio} - {hr.fin}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.3rem' }}>
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={nuevaHoraInicio}
                  onChange={(e) => setNuevaHoraInicio(e.target.value)}
                  className="input-base"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.3rem' }}>
                  Hora fin
                </label>
                <input
                  type="time"
                  value={nuevaHoraFin}
                  onChange={(e) => setNuevaHoraFin(e.target.value)}
                  className="input-base"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={agregarFranja}
              disabled={franjasPropuestas.length >= 3}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                backgroundColor: franjasPropuestas.length >= 3 ? 'rgba(255, 255, 255, 0.04)' : '#0d0d18',
                border: franjasPropuestas.length >= 3 ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(124, 92, 252, 0.65)',
                color: franjasPropuestas.length >= 3 ? '#6b7280' : '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: franjasPropuestas.length >= 3 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (franjasPropuestas.length < 3) {
                  e.currentTarget.style.backgroundColor = '#7c5cfc';
                  e.currentTarget.style.borderColor = '#7c5cfc';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 92, 252, 0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (franjasPropuestas.length < 3) {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.65)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <Plus size={17} />
              <span>
                {franjasPropuestas.length >= 3
                  ? 'Máximo de 3 horarios alcanzado'
                  : 'Añadir este horario a la propuesta'}
              </span>
            </button>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
              Horarios que propondrás al grupo ({franjasPropuestas.length}/3):
            </div>

            {franjasPropuestas.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 14,
                  backgroundColor: 'rgba(244, 63, 94, 0.06)',
                  border: '1px dashed rgba(244, 63, 94, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#fca5a5',
                  fontSize: '0.86rem',
                }}
              >
                <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Aún no has añadido ningún horario.</strong> Selecciona un atajo arriba o indica las horas y pulsa <em>"Añadir este horario a la propuesta"</em>.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {franjasPropuestas.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      backgroundColor: 'rgba(124, 92, 252, 0.12)',
                      border: '1px solid rgba(124, 92, 252, 0.35)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CheckCircle2 size={16} color="#86efac" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                        {f.fecha} · {f.hora_inicio} a {f.hora_fin}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarFranja(idx)}
                      title="Borrar este horario"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 8,
                        backgroundColor: '#0d0d18',
                        border: '1px solid rgba(248, 113, 113, 0.4)',
                        color: '#f87171',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(239, 68, 68, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0d0d18';
                        e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                        e.currentTarget.style.color = '#f87171';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Borrar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(19, 19, 31, 0.75)', backdropFilter: 'blur(16px)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem' }}>
            4. Preferencias de presupuesto y distancia
          </h2>

          <input type="hidden" name="fecha" value={fechaGeneral} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="presupuesto_maximo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#f0f0ff' }}>
                  <Euro size={16} color="#22c55e" /> Presupuesto aprox. por persona
                </label>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>
                  {presupuesto === 0 ? '0 € (Gratis)' : `${presupuesto} €`}
                </span>
              </div>
              <input
                type="range"
                id="presupuesto_maximo"
                name="presupuesto_maximo"
                min="0"
                max="150"
                step="5"
                value={presupuesto}
                onChange={(e) => setPresupuesto(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c5cfc', cursor: 'pointer' }}
                disabled={pendiente}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5a5a7a', marginTop: '0.25rem' }}>
                <span>0 € (Gratis)</span>
                <span>50 € (Medio)</span>
                <span>150 €+ (Premium)</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="distancia_maxima" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: '#f0f0ff' }}>
                  <Navigation size={16} color="#ec4899" /> Radio máximo de desplazamiento
                </label>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ec4899' }}>
                  {distancia} km
                </span>
              </div>
              <input
                type="range"
                id="distancia_maxima"
                name="distancia_maxima"
                min="1"
                max="50"
                step="1"
                value={distancia}
                onChange={(e) => setDistancia(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
                disabled={pendiente}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5a5a7a', marginTop: '0.25rem' }}>
                <span>1 km (En el barrio)</span>
                <span>10 km (Ciudad)</span>
                <span>50 km (Alrededores)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(19, 19, 31, 0.75)', backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="#38bdf8" />
              5. Lugares y Opciones del Plan <span style={{ color: '#9898be', fontSize: '0.85rem', fontWeight: 400 }}>(opcional, hasta 3)</span>
            </h2>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '0.25rem 0.65rem', borderRadius: 8 }}>
              {lugaresPropuestos.length}/3 {lugaresPropuestos.length === 1 ? 'lugar' : 'lugares'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9898be', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Propón hasta 3 opciones de lugares o sitios concretos para que los miembros puedan ver dónde es.
          </p>

          <input
            type="hidden"
            name="lugares_propuestos"
            value={JSON.stringify(lugaresPropuestos)}
          />
          {lugaresPropuestos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {lugaresPropuestos.map((lug, idx) => {
                const catDetalles = CATEGORIAS_LUGARES.find((c) => c.id === lug.categoria);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.2rem',
                      borderRadius: 16,
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      border: '1.5px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                          Opción {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', backgroundColor: 'rgba(124, 92, 252, 0.15)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                          {catDetalles?.label || lug.categoria}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.3rem' }}>
                        {lug.nombre}
                      </h4>

                      {lug.direccion && (
                        <p style={{ fontSize: '0.8rem', color: '#9898be', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.35rem', lineHeight: 1.4 }}>
                          <MapPin size={13} color="#38bdf8" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                          <span>{lug.direccion}</span>
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIndiceLugarEditando(idx);
                          setModalBuscadorAbierto(true);
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 8,
                          backgroundColor: '#0d0d18',
                          border: '1px solid rgba(124, 92, 252, 0.55)',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#7c5cfc';
                          e.currentTarget.style.borderColor = '#7c5cfc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0d0d18';
                          e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.55)';
                        }}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLugaresPropuestos((prev) => prev.filter((_, i) => i !== idx));
                          toast.success('Lugar eliminado');
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 8,
                          backgroundColor: '#0d0d18',
                          border: '1px solid rgba(248, 113, 113, 0.45)',
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
                          e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.45)';
                          e.currentTarget.style.color = '#f87171';
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {lugaresPropuestos.length < 3 ? (
            <button
              type="button"
              onClick={() => {
                setIndiceLugarEditando(null);
                setModalBuscadorAbierto(true);
              }}
              style={{
                width: '100%',
                padding: '1.25rem',
                borderRadius: 16,
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                border: '1.5px dashed rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Search size={18} />
              <span>
                {lugaresPropuestos.length === 0
                  ? 'Buscar lugar con Google Maps'
                  : `Añadir otro lugar (${lugaresPropuestos.length}/3)`}
              </span>
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.75rem', color: '#9898be', fontSize: '0.85rem' }}>
              Has alcanzado el límite de 3 lugares propuestos para este plan.
            </div>
          )}
        </div>
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(19, 19, 31, 0.75)', backdropFilter: 'blur(16px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="#a78bfa" />
              6. Invitar a tus amigos
            </h2>
            {amigosSeleccionados.length > 0 && (
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#86efac', backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '0.25rem 0.65rem', borderRadius: 8 }}>
                {amigosSeleccionados.length} {amigosSeleccionados.length === 1 ? 'amigo seleccionado' : 'amigos seleccionados'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9898be', marginBottom: '1.25rem' }}>
            Elige a quiénes les llegará la notificación directa en su Dashboard para unirse.
          </p>

          <input
            type="hidden"
            name="amigos_invitados"
            value={JSON.stringify(amigosSeleccionados)}
          />

          {cargandoAmigos ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9898be', padding: '1.5rem 0', justifyContent: 'center' }}>
              <Loader2 size={18} className="animate-spin" color="#7c5cfc" /> Cargando tus amigos...
            </div>
          ) : amigos.length === 0 ? (
            <div style={{ padding: '1.25rem', borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#9898be', marginBottom: '0.5rem' }}>
                Aún no tienes amigos añadidos en Juntia.
              </p>
              <p style={{ fontSize: '0.8rem', color: '#6b6b90' }}>
                No te preocupes, también puedes compartirles el código del plan ({plan.codigo_invitacion}).
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {amigos.map((amistad) => {
                const amigoReal =
                  amistad.solicitante_id === usuarioActualId
                    ? amistad.receptor
                    : amistad.solicitante;
                if (!amigoReal) return null;

                const seleccionado = amigosSeleccionados.includes(amigoReal.id);

                return (
                  <button
                    key={amigoReal.id}
                    type="button"
                    onClick={() => toggleAmigo(amigoReal.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 14,
                      backgroundColor: seleccionado ? 'rgba(124, 92, 252, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                      border: seleccionado ? '2px solid #7c5cfc' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: seleccionado ? '0 4px 16px rgba(124, 92, 252, 0.3)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      if (!seleccionado) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      if (!seleccionado) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: seleccionado ? '2px solid #ffffff' : '1.5px solid rgba(255, 255, 255, 0.2)',
                    }}>
                      {amigoReal.avatar_url ? (
                        <img src={amigoReal.avatar_url} alt={amigoReal.nombre_completo || 'Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                          {(amigoReal.nombre_completo || amigoReal.username || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {amigoReal.nombre_completo || amigoReal.username}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>
                        @{amigoReal.username}
                      </div>
                    </div>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: seleccionado ? '#7c5cfc' : 'rgba(255, 255, 255, 0.08)',
                      border: seleccionado ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {seleccionado && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Link
            href={`/planes/${plan.id}`}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 14,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="btn-cancelar-link"
          >
            Cancelar
          </Link>

          <button
            id="btn-guardar-plan"
            type="submit"
            disabled={pendiente || eliminando}
            style={{
              padding: '0.75rem 1.8rem',
              borderRadius: 14,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(124, 92, 252, 0.75)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: 200,
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="btn-guardar-link"
          >
            {pendiente ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando cambios...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
      <ModalExplorarLugares
        planId={plan.id}
        lugaresExistentesIds={[]}
        abierto={modalBuscadorAbierto}
        alCerrar={() => {
          setModalBuscadorAbierto(false);
          setIndiceLugarEditando(null);
        }}
        lugarInicial={indiceLugarEditando !== null ? lugaresPropuestos[indiceLugarEditando] : null}
        modoSeleccion={true}
        alSeleccionarLugar={(lugarSeleccionado) => {
          if (indiceLugarEditando !== null) {
            setLugaresPropuestos((prev) =>
              prev.map((l, i) => (i === indiceLugarEditando ? lugarSeleccionado : l))
            );
            toast.success('Lugar modificado');
          } else {
            if (lugaresPropuestos.length >= 3) {
              toast.error('Solo puedes añadir un máximo de 3 lugares.');
              return;
            }
            setLugaresPropuestos((prev) => [...prev, lugarSeleccionado]);
            toast.success('Lugar añadido');
          }
          setModalBuscadorAbierto(false);
          setIndiceLugarEditando(null);
        }}
      />
      {modalEliminarAbierto && (
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
          onClick={() => setModalEliminarAbierto(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: 'rgba(18, 14, 28, 0.98)',
              border: '1px solid rgba(244, 63, 94, 0.45)',
              borderRadius: 24,
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
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Trash2 size={26} color="#f87171" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem' }}>
              ¿Eliminar el plan "{plan.titulo}"?
            </h3>
            <p style={{ color: '#9898be', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 1.75rem' }}>
              Esta acción no se puede deshacer. Se eliminarán todas las votaciones y los miembros ya no podrán acceder.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => setModalEliminarAbierto(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEliminando(true);
                  const res = await eliminarPlan(plan.id);
                  if (res.exito) {
                    toast.success('Plan eliminado');
                    router.push('/dashboard');
                  } else {
                    toast.error(`Error al eliminar: ${res.error || 'Error desconocido'}`);
                    setEliminando(false);
                    setModalEliminarAbierto(false);
                  }
                }}
                disabled={eliminando}
                style={{
                  flex: 1.3,
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(248, 113, 113, 0.65)',
                  color: '#f87171',
                  fontSize: '0.9rem',
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
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.65)';
                  e.currentTarget.style.color = '#f87171';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {eliminando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-cancelar-link:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px);
        }
        .btn-guardar-link:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 6px 20px rgba(124, 92, 252, 0.5);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
