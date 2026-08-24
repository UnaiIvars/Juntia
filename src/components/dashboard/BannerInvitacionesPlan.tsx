'use client';

import { useState, useEffect } from 'react';
import { InvitacionPlan } from '@/types/database';
import { Mail, X } from 'lucide-react';

interface PropsBannerInvitacionesPlan {
  invitacionesIniciales: InvitacionPlan[];
}

const SESSION_KEY = 'juntia_inv_banner_shown';

export default function BannerInvitacionesPlan({
  invitacionesIniciales,
}: PropsBannerInvitacionesPlan) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (invitacionesIniciales.length === 0) return;
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (!alreadyShown) {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }
  }, [invitacionesIniciales.length]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || invitacionesIniciales.length === 0) return null;

  const count = invitacionesIniciales.length;

  return (
    <div
      className="animate-fade-in-up"
      style={{
        marginBottom: '1.5rem',
        borderRadius: 16,
        background: 'rgba(13, 13, 24, 0.92)',
        border: '1px solid rgba(124, 92, 252, 0.5)',
        boxShadow: '0 8px 28px rgba(124, 92, 252, 0.2)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backdropFilter: 'blur(16px)',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #7c5cfc, #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(124, 92, 252, 0.5)',
        }}
      >
        <Mail size={17} color="#ffffff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
          {count === 1
            ? '¡Tienes 1 nueva invitación!'
            : `¡Tienes ${count} nuevas invitaciones!`}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#a78bfa', marginLeft: '0.5rem' }}>
          Revísalas en la pestaña{' '}
          <strong style={{ color: '#c4b5fd' }}>Invitaciones</strong>
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden',
          backgroundColor: 'rgba(124, 92, 252, 0.15)',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#7c5cfc',
            animation: 'shrink-bar 10s linear forwards',
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: '#9898be',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
          e.currentTarget.style.color = '#f87171';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.color = '#9898be';
        }}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes shrink-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
