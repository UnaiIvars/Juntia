'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Loader2,
  Navigation,
} from 'lucide-react';
import { Lugar, LugarPlan } from '@/types/database';
import {
  LugarPlanConDetalles,
  eliminarLugarDelPlan,
  editarLugarDelPlan,
  añadirLugarAlPlan,
} from '@/app/actions/lugares';
import { CATEGORIAS_LUGARES } from '@/lib/geo';
import ModalExplorarLugares from '@/components/lugares/ModalExplorarLugares';
import toast from 'react-hot-toast';

interface SeccionLugaresPlanProps {
  planId: string;
  lugaresPlanIniciales: LugarPlanConDetalles[];
  esCreador: boolean;
  miembroActualId?: string;
}

export default function SeccionLugaresPlan({
  planId,
  lugaresPlanIniciales = [],
  esCreador,
}: SeccionLugaresPlanProps) {
  const [lugaresPlan, setLugaresPlan] = useState<LugarPlanConDetalles[]>(lugaresPlanIniciales);
  const [lugarSeleccionadoId, setLugarSeleccionadoId] = useState<string | null>(
    lugaresPlanIniciales[0]?.lugar?.id || null
  );
  const [lugarPlanAEditar, setLugarPlanAEditar] = useState<LugarPlanConDetalles | null>(null);
  const [modalExplorarAbierto, setModalExplorarAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mapKey, setMapKey] = useState(0);

  React.useEffect(() => {
    setLugaresPlan(lugaresPlanIniciales);
    if (!lugarSeleccionadoId && lugaresPlanIniciales[0]?.lugar?.id) {
      setLugarSeleccionadoId(lugaresPlanIniciales[0].lugar.id);
    }
  }, [lugaresPlanIniciales, lugarSeleccionadoId]);

  const lugarActivo = useMemo(() => {
    return (
      lugaresPlan.find((lp) => lp.lugar?.id === lugarSeleccionadoId)?.lugar ||
      lugaresPlan[0]?.lugar ||
      null
    );
  }, [lugaresPlan, lugarSeleccionadoId]);

  React.useEffect(() => {
    setMapKey((prev) => prev + 1);
  }, [lugarActivo?.id]);

  const handleEliminarLugar = (lugarPlanId: string, nombreLugar: string) => {
    if (!confirm(`¿Eliminar "${nombreLugar}" de las opciones de este plan?`)) return;

    startTransition(async () => {
      const res = await eliminarLugarDelPlan(lugarPlanId, planId);
      if (res.success) {
        setLugaresPlan((prev) => prev.filter((lp) => lp.id !== lugarPlanId));
        toast.success('Lugar eliminado del plan');
      } else {
        toast.error(res.error || 'Error al eliminar el lugar');
      }
    });
  };

  const handleGuardarLugar = (datos: {
    nombre: string;
    direccion: string | null;
    categoria: string;
    precio: string;
    lat: number;
    lng: number;
    link_maps?: string | null;
  }) => {
    startTransition(async () => {
      if (lugarPlanAEditar) {
        const res = await editarLugarDelPlan(lugarPlanAEditar.id, planId, {
          nombre: datos.nombre,
          categoria: datos.categoria,
          direccion: datos.direccion,
          latitud: datos.lat,
          longitud: datos.lng,
          sitio_web: datos.link_maps || null,
        });

        if (res.success) {
          setLugaresPlan((prev) =>
            prev.map((lp) =>
              lp.id === lugarPlanAEditar.id
                ? {
                    ...lp,
                    lugar: {
                      ...lp.lugar,
                      nombre: datos.nombre,
                      categoria: datos.categoria as any,
                      direccion: datos.direccion,
                      latitud: datos.lat,
                      longitud: datos.lng,
                      sitio_web: datos.link_maps || null,
                    },
                  }
                : lp
            )
          );
          toast.success('Lugar actualizado correctamente');
        } else {
          toast.error(res.error || 'Error al actualizar el lugar');
        }
      } else {
        const res = await añadirLugarAlPlan(planId, {
          nombre: datos.nombre,
          categoria: datos.categoria,
          direccion: datos.direccion,
          latitud: datos.lat,
          longitud: datos.lng,
          sitio_web: datos.link_maps || null,
        });

        if (res.success && res.data) {
          const nuevoLp: LugarPlanConDetalles = {
            ...res.data,
            lugar: {
              id: res.data.lugar_id,
              nombre: datos.nombre,
              categoria: datos.categoria as any,
              nivel_precio: 0,
              coste_estimado_por_persona: 0,
              direccion: datos.direccion,
              latitud: datos.lat,
              longitud: datos.lng,
              sitio_web: datos.link_maps || null,
              fotos: [],
              creado_en: new Date().toISOString(),
            },
          };
          setLugaresPlan((prev) => [...prev, nuevoLp]);
          setLugarSeleccionadoId(nuevoLp.lugar.id);
          toast.success('Lugar añadido al plan');
        } else {
          toast.error(res.error || 'Error al añadir el lugar');
        }
      }

      setModalExplorarAbierto(false);
      setLugarPlanAEditar(null);
    });
  };

  const googleMapsEmbedUrl = lugarActivo
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${lugarActivo.nombre} ${lugarActivo.direccion || ''}`
      )}&output=embed`
    : `https://www.google.com/maps?q=Madrid,España&output=embed`;

  const googleMapsDirectUrl = lugarActivo
    ? lugarActivo.sitio_web ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${lugarActivo.nombre} ${lugarActivo.direccion || ''}`
      )}`
    : `https://www.google.com/maps`;

  return (
    <section
      style={{
        backgroundColor: 'rgba(19, 19, 31, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: '2rem',
      }}
      className="animate-fade-in-up"
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Lugares y Opciones del Plan
            </h2>
            {lugaresPlan.length > 0 && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 8,
                }}
              >
                {lugaresPlan.length} {lugaresPlan.length === 1 ? 'opción' : 'opciones'}
              </span>
            )}
          </div>
          <p style={{ color: '#9898be', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {lugaresPlan.length === 0
              ? esCreador
                ? 'Aún no has añadido ningún lugar para este plan.'
                : 'El creador del plan aún no ha establecido un lugar específico.'
              : 'Haz clic en una opción para verla en el mapa o abrir cómo llegar.'}
          </p>
        </div>
        {esCreador && lugaresPlan.length < 3 && (
          <button
            type="button"
            onClick={() => {
              setLugarPlanAEditar(null);
              setModalExplorarAbierto(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              padding: '0.6rem 1.25rem',
              borderRadius: 12,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(124, 92, 252, 0.65)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7c5cfc';
              e.currentTarget.style.borderColor = '#7c5cfc';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 92, 252, 0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0d0d18';
              e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.65)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} />
            <span>
              {lugaresPlan.length === 0
                ? 'Buscar y añadir en Google Maps'
                : `Añadir otro lugar (${lugaresPlan.length}/3)`}
            </span>
          </button>
        )}
      </div>
      {lugaresPlan.length === 0 ? (
        <div
          style={{
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <MapPin size={24} color="#38bdf8" />
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.4rem' }}>
            {esCreador ? '¿Tienes un lugar en mente?' : 'Lugar pendiente de definir'}
          </h3>
          <p style={{ color: '#9898be', fontSize: '0.88rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            {esCreador
              ? 'Busca cualquier restaurante, cafetería, parque, local o dirección en Google Maps para que todos los participantes puedan ver dónde es.'
              : 'El organizador aún no ha añadido las opciones de ubicación para este plan.'}
          </p>

          {esCreador && (
            <button
              type="button"
              onClick={() => {
                setLugarPlanAEditar(null);
                setModalExplorarAbierto(true);
              }}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: 14,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(124, 92, 252, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Plus size={18} />
              <span>Buscar lugar con Google Maps</span>
            </button>
          )}
        </div>
      ) : (
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {lugaresPlan.map((lp, idx) => {
              if (!lp.lugar) return null;
              const estaSeleccionado = lugarActivo?.id === lp.lugar.id;
              const catDetalles = CATEGORIAS_LUGARES.find((c) => c.id === lp.lugar.categoria);
              const enlaceMaps =
                lp.lugar.sitio_web ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${lp.lugar.nombre} ${lp.lugar.direccion || ''}`
                )}`;

              return (
                <div
                  key={lp.id}
                  onClick={() => setLugarSeleccionadoId(lp.lugar.id)}
                  style={{
                    padding: '1.25rem 1.4rem',
                    borderRadius: 18,
                    backgroundColor: estaSeleccionado
                      ? 'rgba(56, 189, 248, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: estaSeleccionado
                      ? '2px solid #38bdf8'
                      : '1px solid rgba(255, 255, 255, 0.09)',
                    boxShadow: estaSeleccionado
                      ? '0 8px 24px rgba(56, 189, 248, 0.2)'
                      : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!estaSeleccionado) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!estaSeleccionado) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 6,
                        }}
                      >
                        Opción {idx + 1}
                      </span>
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
                        {catDetalles?.label || lp.lugar.categoria}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem', lineHeight: 1.3 }}>
                      {lp.lugar.nombre}
                    </h3>
                    {lp.lugar.direccion && (
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: '#9898be',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.35rem',
                          lineHeight: 1.4,
                        }}
                      >
                        <MapPin size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                        <span>{lp.lugar.direccion}</span>
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <a
                      href={enlaceMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        backgroundColor: '#0d0d18',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#38bdf8';
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.color = '#000000';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.4)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0d0d18';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>Abrir en Google Maps</span>
                      <ExternalLink size={13} />
                    </a>
                    {esCreador && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLugarPlanAEditar(lp);
                            setModalExplorarAbierto(true);
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#7c5cfc';
                            e.currentTarget.style.borderColor = '#7c5cfc';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 92, 252, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0d0d18';
                            e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.55)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <Edit3 size={12} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarLugar(lp.id, lp.lugar.nombre);
                          }}
                          disabled={isPending}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: 8,
                            backgroundColor: '#0d0d18',
                            border: '1px solid rgba(248, 113, 113, 0.45)',
                            color: '#f87171',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
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
                            e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.45)';
                            e.currentTarget.style.color = '#f87171';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Quitar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {lugarActivo && (
            <div
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                backgroundColor: '#0c0c18',
              }}
            >
              <div
                style={{
                  padding: '0.9rem 1.25rem',
                  backgroundColor: 'rgba(15, 15, 28, 0.95)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="#38bdf8" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                    Mapa: {lugarActivo.nombre}
                  </span>
                </div>
                <a
                  href={googleMapsDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    padding: '0.4rem 0.9rem',
                    borderRadius: 10,
                    backgroundColor: '#0d0d18',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#38bdf8';
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.45)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d0d18';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Navigation size={13} />
                  <span>Cómo llegar en Google Maps</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ width: '100%', height: '380px', backgroundColor: '#e5e7eb', position: 'relative' }}>
                <iframe
                  key={mapKey}
                  title={`Google Maps - ${lugarActivo.nombre}`}
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>
      )}
      <ModalExplorarLugares
        planId={planId}
        lugaresExistentesIds={lugaresPlan.map((lp) => lp.lugar_id)}
        abierto={modalExplorarAbierto}
        alCerrar={() => {
          setModalExplorarAbierto(false);
          setLugarPlanAEditar(null);
        }}
        lugarInicial={
          lugarPlanAEditar
            ? {
                nombre: lugarPlanAEditar.lugar.nombre,
                categoria: lugarPlanAEditar.lugar.categoria,
                direccion: lugarPlanAEditar.lugar.direccion,
                lat: lugarPlanAEditar.lugar.latitud,
                lng: lugarPlanAEditar.lugar.longitud,
                link_maps: lugarPlanAEditar.lugar.sitio_web,
              }
            : null
        }
        modoSeleccion={true}
        alSeleccionarLugar={handleGuardarLugar}
      />
    </section>
  );
}
