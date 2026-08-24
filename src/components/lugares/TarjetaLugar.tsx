'use client';

import React from 'react';
import {
  MapPin,
  Star,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Navigation,
  Building2,
} from 'lucide-react';
import { Lugar } from '@/types/database';
import {
  obtenerDetallesCategoria,
  formatearDistancia,
  formatearNivelPrecio,
  calcularDistanciaKm,
} from '@/lib/geo';

interface TarjetaLugarProps {
  lugar: Lugar & { valoracion?: number };
  ubicacionUsuario?: { lat: number; lng: number } | null;
  estaSeleccionado?: boolean;
  estaEnElPlan?: boolean;
  alSeleccionar?: () => void;
  alVerDetalles?: () => void;
  alAñadirAlPlan?: () => void;
  alEliminarDelPlan?: () => void;
  cargandoAccion?: boolean;
  compacto?: boolean;
}

export default function TarjetaLugar({
  lugar,
  ubicacionUsuario,
  estaSeleccionado = false,
  estaEnElPlan = false,
  alSeleccionar,
  alVerDetalles,
  alAñadirAlPlan,
  alEliminarDelPlan,
  cargandoAccion = false,
  compacto = false,
}: TarjetaLugarProps) {
  const cat = obtenerDetallesCategoria(lugar.categoria);

  const distanciaKm = ubicacionUsuario
    ? calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, lugar.latitud, lugar.longitud)
    : undefined;

  const fotoPrincipal =
    lugar.fotos && lugar.fotos.length > 0
      ? lugar.fotos[0]
      : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80';

  const valoracion = (lugar as any).valoracion || 4.7;

  const partesDir = (lugar.direccion || '').split(',').map((s) => s.trim());
  const ciudad =
    partesDir.length > 1
      ? partesDir[partesDir.length - 2] || partesDir[partesDir.length - 1]
      : 'España';

  const googleMapsUrl =
    lugar.sitio_web ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lugar.nombre} ${lugar.direccion || ''}`
    )}`;

  if (compacto) {
    return (
      <div
        onClick={alSeleccionar}
        className="group transition-all duration-200"
        style={{
          backgroundColor: estaSeleccionado ? 'rgba(124, 92, 252, 0.18)' : 'rgba(22, 22, 38, 0.9)',
          border: estaSeleccionado ? '2px solid #7c5cfc' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: '0.85rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'center',
          boxShadow: estaSeleccionado ? '0 0 20px rgba(124, 92, 252, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 78,
            height: 78,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: '#0c0c16',
          }}
        >
          <img
            src={fotoPrincipal}
            alt={lugar.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              left: 2,
              backgroundColor: 'rgba(9, 9, 16, 0.85)',
              borderRadius: 6,
              padding: '0.1rem 0.35rem',
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
            }}
          >
            <Star size={9} fill="#fbbf24" />
            <span>{valoracion}</span>
          </div>
        </div>
        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: cat.color || '#c4b5fd',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                padding: '0.1rem 0.4rem',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </span>

            {lugar.coste_estimado_por_persona !== undefined && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80' }}>
                {Number(lugar.coste_estimado_por_persona) === 0 ? 'Gratis' : `~${lugar.coste_estimado_por_persona} €`}
              </span>
            )}
          </div>

          <h4
            style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={lugar.nombre}
          >
            {lugar.nombre}
          </h4>

          {lugar.direccion && (
            <p
              style={{
                fontSize: '0.74rem',
                color: '#9898be',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title={lugar.direccion}
            >
              <MapPin size={11} style={{ flexShrink: 0, color: '#ec4899' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lugar.direccion}</span>
            </p>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: '0.72rem',
              color: '#38bdf8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              textDecoration: 'none',
              marginTop: '0.1rem',
            }}
          >
            <span>Ver en Google Maps</span>
            <ExternalLink size={10} />
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
          {alAñadirAlPlan && !estaEnElPlan && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                alAñadirAlPlan();
              }}
              disabled={cargandoAccion}
              className="btn btn-primary btn-sm"
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                borderRadius: 10,
              }}
            >
              <Plus size={14} />
              Añadir
            </button>
          )}

          {estaEnElPlan && (
            <div
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#86efac',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Check size={13} />
              En el plan
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={alSeleccionar}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        backgroundColor: estaSeleccionado ? 'rgba(30, 27, 60, 0.95)' : 'rgba(19, 19, 31, 0.85)',
        border: estaEnElPlan ? '2px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
        boxShadow: estaEnElPlan
          ? '0 8px 25px rgba(34, 197, 94, 0.15)'
          : '0 4px 20px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div className="relative w-full overflow-hidden" style={{ height: '170px' }}>
        <img
          src={fotoPrincipal}
          alt={lugar.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 15, 26, 0.95) 0%, rgba(15, 15, 26, 0.2) 60%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: 'rgba(9, 9, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${cat.color || 'rgba(255,255,255,0.2)'}`,
            borderRadius: 10,
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#ffffff',
          }}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </div>
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            display: 'flex',
            gap: '0.4rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(9, 9, 16, 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 8,
              padding: '0.25rem 0.55rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#fbbf24',
            }}
          >
            <Star size={12} fill="#fbbf24" />
            <span>{valoracion}</span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(9, 9, 16, 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 8,
              padding: '0.25rem 0.55rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#4ade80',
            }}
          >
            {formatearNivelPrecio(lugar.nivel_precio)}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '0.65rem',
            left: '0.75rem',
            backgroundColor: 'rgba(15, 15, 26, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '0.2rem 0.55rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#e2e8f0',
          }}
        >
          <Building2 size={11} color="#a78bfa" />
          <span>{ciudad}</span>
        </div>
      </div>
      <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {lugar.nombre}
          </h3>
          {lugar.direccion && (
            <p
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                fontSize: '0.82rem',
                color: '#9898be',
                marginTop: '0.5rem',
                marginBottom: '0.6rem',
                lineHeight: 1.4,
              }}
              title={lugar.direccion}
            >
              <MapPin size={14} style={{ flexShrink: 0, color: '#ec4899', marginTop: '0.15rem' }} />
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {lugar.direccion}
              </span>
            </p>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginTop: '0.6rem',
              paddingTop: '0.6rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#4ade80',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                padding: '0.2rem 0.55rem',
                borderRadius: 6,
                border: '1px solid rgba(34, 197, 94, 0.25)',
              }}
            >
              {Number(lugar.coste_estimado_por_persona) === 0 ? 'Sin coste' : `~${lugar.coste_estimado_por_persona} € / persona`}
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
                padding: '0.2rem 0.5rem',
                borderRadius: 6,
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Google Maps</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1.1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {alAñadirAlPlan && !estaEnElPlan && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                alAñadirAlPlan();
              }}
              disabled={cargandoAccion}
              className="btn btn-primary btn-sm"
              style={{
                flexGrow: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: 12,
              }}
            >
              <Plus size={16} />
              Añadir a este plan
            </button>
          )}

          {estaEnElPlan && alEliminarDelPlan && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                alEliminarDelPlan();
              }}
              disabled={cargandoAccion}
              className="btn btn-ghost btn-sm"
              style={{
                flexGrow: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
              }}
            >
              <Trash2 size={14} />
              Quitar del plan
            </button>
          )}

          {estaEnElPlan && !alEliminarDelPlan && (
            <div
              style={{
                flexGrow: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#86efac',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                borderRadius: 12,
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Check size={15} />
              Lugar añadido al plan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
