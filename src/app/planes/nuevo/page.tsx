'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { crearPlan, type EstadoFormularioPlan } from '@/app/actions/planes';
import { obtenerAmigos } from '@/app/actions/amigos';
import { Amistad, Perfil } from '@/types/database';
import Logo from '@/components/ui/Logo';
import FondoApp from '@/components/ui/FondoApp';
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

export default function PaginaCrearPlan() {
  const [estado, accion, pendiente] = useActionState(
    crearPlan as (state: EstadoFormularioPlan, payload: FormData) => Promise<EstadoFormularioPlan>,
    undefined
  );

  const hoy = new Date().toISOString().split('T')[0];

  const [tipoSeleccionado, setTipoSeleccionado] = useState('cena');
  const [presupuesto, setPresupuesto] = useState(25);
  const [distancia, setDistancia] = useState(10);
  const [fechaGeneral, setFechaGeneral] = useState(hoy);

  const [franjasPropuestas, setFranjasPropuestas] = useState<FranjaPropuesta[]>([]);

  const [nuevaFecha, setNuevaFecha] = useState(hoy);
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('');

  const [lugaresPropuestos, setLugaresPropuestos] = useState<{
    nombre: string;
    direccion: string | null;
    categoria: string;
    precio: string;
    lat: number;
    lng: number;
    link_maps?: string | null;
  }[]>([]);
  const [indiceLugarEditando, setIndiceLugarEditando] = useState<number | null>(null);

  const [modalBuscadorAbierto, setModalBuscadorAbierto] = useState(false);

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

  const [amigos, setAmigos] = useState<Amistad[]>([]);
  const [usuarioActualId, setUsuarioActualId] = useState<string>('');
  const [cargandoAmigos, setCargandoAmigos] = useState(true);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState<string[]>([]);

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

  const toggleAmigo = (amigoId: string) => {
    setAmigosSeleccionados((prev) =>
      prev.includes(amigoId) ? prev.filter((id) => id !== amigoId) : [...prev, amigoId]
    );
  };

  const aplicarAtajo = (inicio: string, fin: string) => {
    setNuevaHoraInicio(inicio);
    setNuevaHoraFin(fin);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090910', color: '#f0f0ff', position: 'relative' }}>
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
              textDecoration: 'none',
              padding: '0.65rem 1.3rem',
              borderRadius: 12,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(124, 92, 252, 0.6)',
              color: '#ffffff',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="btn-volver-dashboard"
          >
            <ArrowLeft size={16} />
            Volver al Dashboard
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '3.5rem 1.5rem 6rem', position: 'relative', zIndex: 10 }}>
        <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#a78bfa',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            <Sparkles size={16} /> Nuevo evento
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Crear un nuevo plan
          </h1>
          <p style={{ color: '#9898be', fontSize: '1rem', marginTop: '0.4rem' }}>
            Define las opciones iniciales y los horarios que propones para que tu grupo vote.
          </p>
        </div>
        {estado?.mensaje && (
          <div
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 14,
              padding: '1rem 1.25rem',
              color: '#f87171',
              fontSize: '0.95rem',
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
              toast.error('Debes añadir al menos 1 horario propuesto para el grupo.');
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
                  placeholder="Ej: Cena del Viernes, Torneo de Pádel..."
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
                  placeholder="¿Algún detalle que quieras comentar al grupo?"
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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>{tipo.emoji}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: esSeleccionado ? '#ffffff' : '#e2e2f0' }}>
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
                    <strong>Aún no has añadido ningún horario.</strong> Selecciona un atajo arriba o indica las horas y pulsa <em>"Añadir este horario a la propuesta"</em> para que tu grupo pueda votar.
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
          <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(19, 19, 31, 0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700 }}>
                <MapPin size={16} /> Lugares del plan
              </div>
              {lugaresPropuestos.length > 0 && (
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '0.2rem 0.65rem', borderRadius: 8 }}>
                  {lugaresPropuestos.length} / 3 lugares
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
              5. ¿Tienes uno o varios sitios en mente? <span style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 500 }}>(opcional · máx. 3)</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9898be', marginBottom: '1.25rem' }}>
              Puedes proponer hasta 3 sitios diferentes usando Google Maps para que tus amigos los vean y puedan elegir o votar cuál prefieren.
            </p>
            <input type="hidden" name="lugares_propuestos" value={JSON.stringify(lugaresPropuestos)} />
            {lugaresPropuestos.length > 0 && (
              <>
                <input type="hidden" name="lugar_nombre" value={lugaresPropuestos[0].nombre} />
                <input type="hidden" name="lugar_direccion" value={lugaresPropuestos[0].direccion || ''} />
                <input type="hidden" name="lugar_categoria" value={lugaresPropuestos[0].categoria} />
                <input type="hidden" name="lugar_precio" value={lugaresPropuestos[0].precio} />
                <input type="hidden" name="lugar_link_maps" value={lugaresPropuestos[0].link_maps || ''} />
                <input type="hidden" name="lugar_lat" value={lugaresPropuestos[0].lat.toString()} />
                <input type="hidden" name="lugar_lng" value={lugaresPropuestos[0].lng.toString()} />
              </>
            )}
            {lugaresPropuestos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: lugaresPropuestos.length < 3 ? '1rem' : 0 }}>
                {lugaresPropuestos.map((lug, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.2rem 1.4rem',
                      borderRadius: 16,
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.9rem',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: 'rgba(56, 189, 248, 0.18)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <MapPin size={22} color="#38bdf8" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
                              Opción {idx + 1}
                            </span>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{lug.nombre}</span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#a78bfa',
                                backgroundColor: 'rgba(124, 92, 252, 0.15)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 6,
                                textTransform: 'capitalize',
                              }}
                            >
                              {CATEGORIAS_LUGARES.find((c) => c.id === lug.categoria)?.label || lug.categoria}
                            </span>
                          </div>
                          {lug.direccion && (
                            <div style={{ fontSize: '0.8rem', color: '#9898be', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <MapPin size={13} color="#38bdf8" />
                              <span>{lug.direccion}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIndiceLugarEditando(idx);
                            setModalBuscadorAbierto(true);
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLugaresPropuestos((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: 10,
                            backgroundColor: 'rgba(248, 113, 113, 0.12)',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            color: '#f87171',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 113, 113, 0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.12)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingTop: '0.65rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        gap: '0.5rem',
                      }}
                    >
                      <a
                        href={
                          lug.link_maps ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lug.nombre} ${lug.direccion || ''}`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#38bdf8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#7dd3fc';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#38bdf8';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <span>Ver en Google Maps</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {lugaresPropuestos.length < 3 && (
              <button
                type="button"
                onClick={() => {
                  setIndiceLugarEditando(null);
                  setModalBuscadorAbierto(true);
                }}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  borderRadius: 14,
                  backgroundColor: 'rgba(56, 189, 248, 0.09)',
                  border: '2px dashed rgba(56, 189, 248, 0.45)',
                  color: '#38bdf8',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.09)';
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Search size={18} />
                <span>
                  {lugaresPropuestos.length === 0
                    ? 'Buscar lugar con Google Maps'
                    : `+ Añadir otro lugar alternativo (${lugaresPropuestos.length}/3)`}
                </span>
              </button>
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
                  No te preocupes, una vez creado el plan podrás compartirles el código o enlace por WhatsApp.
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
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.8rem 1.6rem',
                borderRadius: 14,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0d0d18';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Cancelar
            </Link>
            
            <button
              id="btn-guardar-plan"
              type="submit"
              disabled={pendiente}
              style={{
                minWidth: 220,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.8rem',
                borderRadius: 14,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.7)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 800,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: pendiente ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!pendiente) {
                  e.currentTarget.style.backgroundColor = '#7c5cfc';
                  e.currentTarget.style.borderColor = '#7c5cfc';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 92, 252, 0.45)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!pendiente) {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.7)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {pendiente ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creando plan...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Publicar plan e invitar
                </>
              )}
            </button>
          </div>
        </form>
      </main>
      <ModalExplorarLugares
        planId="nuevo"
        lugaresExistentesIds={[]}
        abierto={modalBuscadorAbierto}
        alCerrar={() => {
          setModalBuscadorAbierto(false);
          setIndiceLugarEditando(null);
        }}
        lugarInicial={indiceLugarEditando !== null ? lugaresPropuestos[indiceLugarEditando] : null}
        modoSeleccion={true}
        alSeleccionarLugar={(datos) => {
          if (indiceLugarEditando !== null) {
            setLugaresPropuestos((prev) => {
              const copia = [...prev];
              copia[indiceLugarEditando] = datos;
              return copia;
            });
          } else {
            setLugaresPropuestos((prev) => [...prev.slice(0, 2), datos]);
          }
          setModalBuscadorAbierto(false);
          setIndiceLugarEditando(null);
        }}
      />

      <style>{`
        .btn-volver-dashboard:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
