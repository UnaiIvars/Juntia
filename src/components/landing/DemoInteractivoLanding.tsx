'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Euro,
  MapPin,
  Users,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCheck,
} from 'lucide-react';

export default function DemoInteractivoLanding() {
  const [votado, setVotado] = useState<'si' | 'no' | null>('si');
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard?.writeText('JNT-8942');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: 960,
        margin: '0 auto 6rem',
        textAlign: 'left',
      }}
      className="animate-fade-in-up animate-delay-300"
    >
      <div
        style={{
          borderRadius: 28,
          background: 'linear-gradient(145deg, rgba(124, 92, 252, 0.3) 0%, rgba(255, 255, 255, 0.05) 45%, rgba(13, 13, 24, 0.95) 100%)',
          padding: '1.5px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 45px rgba(124, 92, 252, 0.22)',
          transition: 'all 0.3s ease',
        }}
        className="demo-card-container"
      >
        <div
          style={{
            backgroundColor: 'rgba(13, 13, 24, 0.92)',
            backdropFilter: 'blur(24px)',
            borderRadius: 26,
            padding: '2.25rem 2.25rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 14px rgba(124, 92, 252, 0.4)',
                }}
              >
                U
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Unai Ivars</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#fbbf24',
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      border: '1px solid rgba(251, 191, 36, 0.35)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 6,
                    }}
                  >
                    Creador
                  </span>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600 }}>@unaiivrs_</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#34d399',
                  backgroundColor: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 10,
                }}
              >
                <Sparkles size={14} />
                <span>100% Compatibilidad</span>
              </div>
              <button
                type="button"
                onClick={handleCopiar}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 10,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(124, 92, 252, 0.55)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                className="demo-btn-codigo"
              >
                {copiado ? <CheckCheck size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copiado ? '¡Copiado!' : 'JNT-8942'}</span>
              </button>
            </div>
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: '#ffffff',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Cena de viernes & Hamburguesas 🍔
            </h3>
            <p style={{ color: '#9898be', fontSize: '0.94rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
              Quedada con el grupo para cenar en un sitio nuevo, ponernos al día y echar unas risas.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#c4b5fd',
                  backgroundColor: 'rgba(124, 92, 252, 0.12)',
                  border: '1px solid rgba(124, 92, 252, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 10,
                }}
              >
                <Calendar size={14} color="#a855f7" /> Este Viernes
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#86efac',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 10,
                }}
              >
                <Euro size={14} /> ~20 € / pers
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#f472b6',
                  backgroundColor: 'rgba(236, 72, 153, 0.12)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 10,
                }}
              >
                <MapPin size={14} /> A menos de 5 km
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#d4d4f4',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 10,
                }}
              >
                <Users size={14} color="#a855f7" /> 5 amigos unidos
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(18, 18, 32, 0.85)',
                border: '1px solid rgba(124, 92, 252, 0.3)',
                borderRadius: 20,
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ⭐ Horario más votado
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399' }}>
                    5 de 5 pueden
                  </span>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="#7c5cfc" />
                  Viernes · 21:00h - 23:30h
                </div>
                <div style={{ width: '100%', height: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', margin: '0.75rem 0' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#22c55e', borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#9898be', fontWeight: 600 }}>¿Te apuntas?</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setVotado('si')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 10,
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: votado === 'si' ? '#22c55e' : 'rgba(34, 197, 94, 0.4)',
                      backgroundColor: votado === 'si' ? '#22c55e' : '#0d0d18',
                      color: votado === 'si' ? '#ffffff' : '#86efac',
                      transition: 'all 0.18s ease',
                    }}
                    className="demo-btn-voto-si"
                  >
                    <Check size={14} /> Me apunto
                  </button>
                  <button
                    type="button"
                    onClick={() => setVotado('no')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 10,
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: votado === 'no' ? '#ef4444' : 'rgba(239, 68, 68, 0.4)',
                      backgroundColor: votado === 'no' ? '#ef4444' : '#0d0d18',
                      color: votado === 'no' ? '#ffffff' : '#fca5a5',
                      transition: 'all 0.18s ease',
                    }}
                    className="demo-btn-voto-no"
                  >
                    <X size={14} /> No puedo
                  </button>
                </div>
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(18, 18, 32, 0.85)',
                border: '1px solid rgba(124, 92, 252, 0.3)',
                borderRadius: 20,
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    📍 Lugar sugerido
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>
                    ★ 4.9 (420 reseñas)
                  </span>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                  The Burger Craft & Grill
                </div>
                <div style={{ fontSize: '0.84rem', color: '#9898be' }}>
                  C/ Mayor 24 · A 1.2 km de la mayoría
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.3rem' }}>
                  {['U', 'M', 'A', 'D', '+1'].map((letra, i) => (
                    <div
                      key={i}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: i === 0 ? '#7c5cfc' : i === 1 ? '#ec4899' : i === 2 ? '#3b82f6' : '#1e1b4b',
                        border: '2px solid #0d0d18',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        marginLeft: i > 0 ? -8 : 0,
                      }}
                    >
                      {letra}
                    </div>
                  ))}
                </div>

                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 10,
                    backgroundColor: '#0d0d18',
                    border: '1px solid rgba(124, 92, 252, 0.55)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                  }}
                  className="demo-btn-maps"
                >
                  <span>Google Maps</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1.25rem',
            }}
          >
            <span style={{ fontSize: '0.88rem', color: '#9898be' }}>
              💡 <strong style={{ color: '#ffffff' }}>Plan en tiempo real:</strong> Votaciones sincronizadas al instante con tus amigos.
            </span>

            <a
              href="/registro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.35rem',
                borderRadius: 12,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.65)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="demo-btn-ver-plan"
            >
              <span>Probar gratis ahora</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .demo-card-container:hover {
          transform: translateY(-3px);
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.9), 0 0 55px rgba(124, 92, 252, 0.35) !important;
        }
        .demo-btn-codigo:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
        .demo-btn-voto-si:hover {
          background-color: #22c55e !important;
          border-color: #22c55e !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.45);
          transform: translateY(-1px);
        }
        .demo-btn-voto-no:hover {
          background-color: #ef4444 !important;
          border-color: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
          transform: translateY(-1px);
        }
        .demo-btn-maps:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
        .demo-btn-ver-plan:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 6px 20px rgba(124, 92, 252, 0.55);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
