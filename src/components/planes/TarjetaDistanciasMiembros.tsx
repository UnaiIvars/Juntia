'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation, MapPin, Compass, ArrowRight } from 'lucide-react';
import { MiembroPlan, LugarPlan } from '@/types/database';

interface TarjetaDistanciasMiembrosProps {
  miembros: MiembroPlan[];
  creadorId: string;
  lugaresPlan: LugarPlan[];
  planLatCentro?: number | null;
  planLonCentro?: number | null;
  usuarioActualId: string;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number): string {
  return km < 1 ? '<1 km' : `${Math.round(km)} km`;
}

async function geo(q: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(`/api/nominatim?q=${encodeURIComponent(q)}`, { cache: 'force-cache' });
    if (!res.ok) return null;
    const data: any[] = await res.json();
    if (!data || !data.length) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lon)) return null;
    return [lat, lon];
  } catch {
    return null;
  }
}

export default function TarjetaDistanciasMiembros({
  miembros,
  creadorId,
  lugaresPlan,
  planLatCentro,
  planLonCentro,
  usuarioActualId,
}: TarjetaDistanciasMiembrosProps) {
  const lugarPrincipal = lugaresPlan.length > 0 && lugaresPlan[0]?.lugar ? lugaresPlan[0].lugar : null;
  const nombreDestino = lugarPrincipal?.nombre || (planLatCentro ? 'Punto de encuentro' : null);

  const [distancias, setDistancias] = useState<Record<string, number | null>>({});
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let activo = true;

    async function calcular() {
      try {
        let destLat: number | null = null;
        let destLon: number | null = null;

        const lpLat = parseFloat(String(lugarPrincipal?.latitud ?? ''));
        const lpLon = parseFloat(String(lugarPrincipal?.longitud ?? ''));
        if (!isNaN(lpLat) && !isNaN(lpLon) && lpLat !== 0) {
          destLat = lpLat;
          destLon = lpLon;
        } else if (planLatCentro && planLonCentro) {
          destLat = Number(planLatCentro);
          destLon = Number(planLonCentro);
        } else if (lugarPrincipal?.nombre) {
          const q = [lugarPrincipal.nombre, lugarPrincipal.direccion, 'España'].filter(Boolean).join(', ');
          const coords = await geo(q);
          if (coords) { destLat = coords[0]; destLon = coords[1]; }
        } else if (nombreDestino) {
          const coords = await geo(`${nombreDestino}, España`);
          if (coords) { destLat = coords[0]; destLon = coords[1]; }
        }

        if (!activo) return;
        if (destLat === null || destLon === null) return;

        const resultado: Record<string, number | null> = {};

        await Promise.all(
          miembros.map(async (m) => {
            const p = m.perfil as any;
            if (!p) { resultado[m.id] = null; return; }

            const mLat = parseFloat(String(p.latitud ?? ''));
            const mLon = parseFloat(String(p.longitud ?? ''));

            if (!isNaN(mLat) && !isNaN(mLon) && mLat !== 0 && mLon !== 0) {
              resultado[m.id] = haversineKm(mLat, mLon, destLat!, destLon!);
              return;
            }

            const texto = [p.direccion, p.ciudad].filter((x: string) => x && x.trim()).join(', ');
            if (!texto) { resultado[m.id] = null; return; }

            const coords = await geo(`${texto}, España`);
            resultado[m.id] = coords ? haversineKm(coords[0], coords[1], destLat!, destLon!) : null;
          })
        );

        if (activo) setDistancias(resultado);
      } catch (err) {
        console.error('Error calculando distancias al plan:', err);
      } finally {
        if (activo) setListo(true);
      }
    }

    calcular();
    return () => { activo = false; };
  }, []);

  return (
    <div
      style={{
        backgroundColor: 'rgba(13, 13, 24, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: '1.4rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: 'rgba(236, 72, 153, 0.14)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Navigation size={15} color="#ec4899" />
        </div>
        <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Distancia al plan
        </h3>
      </div>

      {nombreDestino ? (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.75rem', borderRadius: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '1rem', fontSize: '0.78rem', color: '#c4b5fd',
          }}
        >
          <MapPin size={13} color="#a855f7" />
          <span>Al punto de encuentro: <strong style={{ color: '#fff' }}>{nombreDestino}</strong></span>
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: '#9898be', margin: '0 0 0.85rem', lineHeight: 1.4 }}>
          Añade un lugar al plan para ver las distancias.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {miembros.map((miembro) => {
          const perfil = miembro.perfil as any;
          const esYo = miembro.usuario_id === usuarioActualId;
          const dist = distancias[miembro.id];
          const tieneDireccion = Boolean(
            (perfil?.latitud && parseFloat(String(perfil.latitud)) !== 0) ||
            perfil?.direccion
          );

          return (
            <div
              key={miembro.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.6rem', padding: '0.5rem 0.65rem', borderRadius: 12,
                backgroundColor: esYo ? 'rgba(124, 92, 252, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: '1px solid',
                borderColor: esYo ? 'rgba(124, 92, 252, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                {perfil?.avatar_url ? (
                  <img src={perfil.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.74rem', color: '#fff', flexShrink: 0,
                    }}
                  >
                    {perfil?.nombre_completo?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {perfil?.nombre_completo || 'Usuario'}
                    </span>
                    {esYo && <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 800 }}>(Tú)</span>}
                  </div>
                  {perfil?.username && (
                    <div style={{ fontSize: '0.72rem', color: '#7a7a9e', fontWeight: 600 }}>@{perfil.username}</div>
                  )}
                </div>
              </div>

              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {!listo && tieneDireccion ? (
                  <span style={{ fontSize: '0.74rem', color: '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#a78bfa', display: 'inline-block', animation: 'distPulse 1.5s infinite' }} />
                    Calculando...
                  </span>
                ) : typeof dist === 'number' ? (
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.82rem', fontWeight: 800,
                      color: dist < 1 ? '#86efac' : dist <= 5 ? '#fde047' : '#f472b6',
                      backgroundColor: dist < 1 ? 'rgba(34,197,94,0.12)' : dist <= 5 ? 'rgba(234,179,8,0.12)' : 'rgba(236,72,153,0.12)',
                      border: '1px solid',
                      borderColor: dist < 1 ? 'rgba(34,197,94,0.3)' : dist <= 5 ? 'rgba(234,179,8,0.3)' : 'rgba(236,72,153,0.3)',
                      padding: '0.25rem 0.6rem', borderRadius: 8,
                    }}
                  >
                    <Compass size={12} />
                    {fmtDist(dist)}
                  </span>
                ) : esYo ? (
                  <Link
                    href="/perfil"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.72rem', fontWeight: 800, color: '#ec4899',
                      backgroundColor: 'rgba(236,72,153,0.12)',
                      border: '1px solid rgba(236,72,153,0.3)',
                      padding: '0.22rem 0.55rem', borderRadius: 8,
                      textDecoration: 'none',
                    }}
                  >
                    Añadir ubicación <ArrowRight size={11} />
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#606080', fontStyle: 'italic' }}>Sin ubicación</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes distPulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
    </div>
  );
}
