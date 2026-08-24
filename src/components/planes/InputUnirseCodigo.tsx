'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function InputUnirseCodigo() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [enfocado, setEnfocado] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    const codigoLimpio = codigo.trim().replace(/^.*\/unirse\//i, '').toUpperCase();
    router.push(`/unirse/${codigoLimpio}`);
  };

  const tieneTexto = codigo.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        backgroundColor: '#0d0d18',
        border: enfocado
          ? '1.5px solid #a855f7'
          : '1px solid rgba(124, 92, 252, 0.45)',
        padding: '0.55rem 0.65rem 0.55rem 1.1rem',
        borderRadius: 14,
        boxShadow: enfocado
          ? '0 0 20px rgba(168, 85, 247, 0.35)'
          : '0 4px 14px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <UserPlus size={18} color={enfocado ? '#a855f7' : '#7c5cfc'} style={{ transition: 'color 0.2s ease', flexShrink: 0 }} />
      <input
        type="text"
        placeholder="Unirse con código (ej: JNT-8492)..."
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#ffffff',
          fontSize: '0.92rem',
          fontWeight: 600,
          width: 255,
        }}
      />
      <button
        type="submit"
        disabled={!tieneTexto}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 10,
          border: tieneTexto ? '1px solid rgba(124, 92, 252, 0.7)' : '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: tieneTexto
            ? (btnHover ? '#7c5cfc' : '#141424')
            : 'rgba(255, 255, 255, 0.04)',
          color: tieneTexto ? '#ffffff' : '#6b7280',
          cursor: tieneTexto ? 'pointer' : 'not-allowed',
          boxShadow: tieneTexto && btnHover ? '0 4px 14px rgba(124, 92, 252, 0.5)' : 'none',
          transform: tieneTexto && btnHover ? 'translateY(-1px)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}
        title="Unirse al plan"
      >
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
