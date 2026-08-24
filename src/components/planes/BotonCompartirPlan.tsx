'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface PropsBotonCompartir {
  codigoInvitacion: string;
  tituloPlan: string;
}

export default function BotonCompartirPlan({
  codigoInvitacion,
}: PropsBotonCompartir) {
  const [copiado, setCopiado] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigoInvitacion);
      setCopiado(true);
      toast.success('¡Código de invitación copiado!');
      setTimeout(() => setCopiado(false), 2500);
    } catch (e) {
      toast.error('No se pudo copiar el código.');
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(13, 13, 24, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(124, 92, 252, 0.35)',
        borderRadius: 20,
        padding: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
      }}
    >
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Invita a tus amigos
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.35rem' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Código:</span>
          <span
            style={{
              color: '#c4b5fd',
              fontFamily: 'monospace',
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              backgroundColor: 'rgba(124, 92, 252, 0.15)',
              padding: '0.2rem 0.6rem',
              borderRadius: 8,
              border: '1px solid rgba(124, 92, 252, 0.25)',
            }}
          >
            {codigoInvitacion}
          </span>
        </div>
        <p style={{ color: '#9898be', fontSize: '0.85rem', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
          Cualquier amigo con este código podrá unirse al grupo para votar horarios y proponer lugares.
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={copiarCodigo}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 12,
            backgroundColor: copiado ? 'rgba(34, 197, 94, 0.2)' : hovered ? '#7c5cfc' : '#0d0d18',
            border: copiado
              ? '1px solid #22c55e'
              : hovered
              ? '1px solid #7c5cfc'
              : '1px solid rgba(124, 92, 252, 0.65)',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: hovered ? '0 4px 16px rgba(124, 92, 252, 0.45)' : 'none',
            transform: hovered ? 'translateY(-1px)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {copiado ? (
            <>
              <Check size={16} color="#86efac" />
              <span style={{ color: '#86efac' }}>¡Código copiado!</span>
            </>
          ) : (
            <>
              <Copy size={16} color={hovered ? '#ffffff' : '#a78bfa'} />
              <span>Copiar código</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
