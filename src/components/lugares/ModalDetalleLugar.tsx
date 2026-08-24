'use client';

import React from 'react';
import {
  X,
  MapPin,
  Star,
  Euro,
  Navigation,
  Phone,
  Globe,
  Plus,
  Compass,
  Check,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Lugar } from '@/types/database';
import {
  obtenerDetallesCategoria,
  formatearDistancia,
  formatearNivelPrecio,
  calcularDistanciaKm,
} from '@/lib/geo';

interface ModalDetalleLugarProps {
  lugar: (Lugar & { valoracion?: number }) | null;
  abierto: boolean;
  alCerrar: () => void;
  ubicacionUsuario?: { lat: number; lng: number } | null;
  estaEnElPlan?: boolean;
  alAñadirAlPlan?: () => void;
  cargandoAccion?: boolean;
}

export default function ModalDetalleLugar({
  lugar,
  abierto,
  alCerrar,
  ubicacionUsuario,
  estaEnElPlan = false,
  alAñadirAlPlan,
  cargandoAccion = false,
}: ModalDetalleLugarProps) {
  if (!abierto || !lugar) return null;

  const cat = obtenerDetallesCategoria(lugar.categoria);
  const distanciaKm = ubicacionUsuario
    ? calcularDistanciaKm(ubicacionUsuario.lat, ubicacionUsuario.lng, lugar.latitud, lugar.longitud)
    : undefined;

  const fotos = lugar.fotos && lugar.fotos.length > 0
    ? lugar.fotos
    : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'];

  const valoracion = (lugar as any).valoracion || 4.8;

  const partesDir = (lugar.direccion || '').split(',').map((s) => s.trim());
  const ciudad =
    partesDir.length > 1
      ? partesDir[partesDir.length - 2] || partesDir[partesDir.length - 1]
      : 'España';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lugar.nombre} ${lugar.direccion || ''}`
  )}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={alCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#13131f',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={alCerrar}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          <X size={18} />
        </button>
        <div style={{ position: 'relative', height: 260, width: '100%', overflow: 'hidden' }}>
          <img
            src={fotos[0]}
            alt={lugar.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, #13131f 0%, transparent 60%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: '1.2rem', left: '1.5rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: 'rgba(9, 9, 16, 0.85)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${cat.color || '#7c5cfc'}`,
                borderRadius: 10,
                padding: '0.35rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </span>

            <span
              style={{
                backgroundColor: 'rgba(9, 9, 16, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: 10,
                padding: '0.35rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Star size={14} fill="#fbbf24" />
              <span>{valoracion} / 5.0</span>
            </span>

            <span
              style={{
                backgroundColor: 'rgba(9, 9, 16, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 10,
                padding: '0.35rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Building2 size={13} color="#a78bfa" />
              <span>{ciudad}</span>
            </span>
          </div>
        </div>
        <div style={{ padding: '1.5rem 1.75rem 2rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            {lugar.nombre}
          </h2>

          {lugar.direccion && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', color: '#9898be', fontSize: '0.92rem' }}>
              <MapPin size={16} color="#ec4899" />
              <span>{lugar.direccion}</span>
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              marginTop: '1.35rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '0.85rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9898be', marginBottom: '0.2rem' }}>Precio Estimado</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4ade80' }}>
                {formatearNivelPrecio(lugar.nivel_precio)} (~{lugar.coste_estimado_por_persona} €)
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '0.85rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9898be', marginBottom: '0.2rem' }}>Ciudad / Región</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#c4b5fd' }}>
                {ciudad}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '0.85rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#9898be', marginBottom: '0.2rem' }}>Coordenadas</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                {lugar.latitud.toFixed(3)}, {lugar.longitud.toFixed(3)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.9rem',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 12,
                color: '#38bdf8',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Ver ubicación en Google Maps</span>
              <ExternalLink size={14} />
            </a>

            {lugar.telefono && (
              <a
                href={`tel:${lugar.telefono}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#c4b5fd',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <Phone size={15} />
                <span>{lugar.telefono}</span>
              </a>
            )}

            {lugar.sitio_web && (
              <a
                href={lugar.sitio_web}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#60a5fa',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                }}
              >
                <Globe size={15} />
                <span>{lugar.sitio_web}</span>
              </a>
            )}
          </div>
          <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem' }}>
            {alAñadirAlPlan && !estaEnElPlan && (
              <button
                type="button"
                onClick={alAñadirAlPlan}
                disabled={cargandoAccion}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: 14,
                }}
              >
                <Plus size={18} />
                Añadir este lugar al plan
              </button>
            )}

            {estaEnElPlan && (
              <div
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  textAlign: 'center',
                  borderRadius: 14,
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#86efac',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Check size={18} />
                Este lugar ya está en el plan
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
