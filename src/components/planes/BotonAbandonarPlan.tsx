'use client';

import { useState } from 'react';
import { abandonarPlan } from '@/app/actions/miembros';
import { LogOut, Loader2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BotonAbandonarPlan({
  planId,
  tituloPlan,
}: {
  planId: string;
  tituloPlan: string;
}) {
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleConfirmarAbandono = async () => {
    setCargando(true);
    try {
      const res = await abandonarPlan(planId);
      if (res.exito) {
        toast.success('Has abandonado el plan.');
      } else if (res.mensaje) {
        toast.error(res.mensaje);
        setCargando(false);
        setModalAbierto(false);
      }
    } catch {
      toast.error('Error al intentar abandonar el plan.');
      setCargando(false);
      setModalAbierto(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        disabled={cargando}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#0d0d18',
          color: '#f87171',
          border: '1px solid rgba(244, 63, 94, 0.45)',
          padding: '0.65rem 1.25rem',
          borderRadius: 12,
          fontSize: '0.88rem',
          fontWeight: 800,
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="btn-abandonar-plan-hero"
      >
        <LogOut size={15} />
        <span>Abandonar plan</span>
      </button>
      {modalAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => !cargando && setModalAbierto(false)}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 15, 26, 0.96)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 24,
              padding: '2rem',
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(244, 63, 94, 0.15)',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-scale-in"
          >
            <button
              type="button"
              onClick={() => !cargando && setModalAbierto(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9898be',
                width: 32,
                height: 32,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#9898be';
              }}
            >
              <X size={16} />
            </button>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={28} color="#f43f5e" />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.6rem' }}>
              ¿Abandonar este plan?
            </h3>

            <p style={{ fontSize: '0.92rem', color: '#9898be', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
              Dejarás de ser participante de <strong style={{ color: '#ffffff' }}>{tituloPlan}</strong>. Ya no aparecerás en el grupo ni en las votaciones de horarios.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={cargando}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.2rem',
                  borderRadius: 12,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(124, 92, 252, 0.5)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c5cfc';
                  e.currentTarget.style.borderColor = '#7c5cfc';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(124, 92, 252, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.5)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarAbandono}
                disabled={cargando}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.2rem',
                  borderRadius: 12,
                  backgroundColor: '#ef4444',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.borderColor = '#dc2626';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.45)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {cargando ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                <span>{cargando ? 'Saliendo...' : 'Sí, abandonar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-abandonar-plan-hero:hover {
          background-color: #ef4444 !important;
          border-color: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45) !important;
          transform: translateY(-1px) !important;
        }
      `}</style>
    </>
  );
}

