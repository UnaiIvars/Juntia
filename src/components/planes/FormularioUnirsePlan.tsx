'use client';

import { useState } from 'react';
import { unirseAPlan } from '@/app/actions/miembros';
import { Loader2, UserPlus } from 'lucide-react';

export default function FormularioUnirsePlan({ codigo }: { codigo: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnirse = async () => {
    setCargando(true);
    setError(null);
    const res = await unirseAPlan(codigo);
    if (!res.exito && res.mensaje) {
      setError(res.mensaje);
      setCargando(false);
    }
  };

  return (
    <div>
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 12,
            padding: '0.75rem 1rem',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleUnirse}
        disabled={cargando}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        {cargando ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Uniendo al grupo...
          </>
        ) : (
          <>
            <UserPlus size={18} /> Aceptar invitación y unirme
          </>
        )}
      </button>
    </div>
  );
}
