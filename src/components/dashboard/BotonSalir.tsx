'use client';

import { LogOut } from 'lucide-react';
import { cerrarSesion } from '@/app/actions/auth';

export default function BotonSalir() {
  return (
    <form action={cerrarSesion}>
      <button
        id="btn-logout"
        type="submit"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.55rem',
          padding: '0.7rem 1.4rem',
          fontSize: '0.95rem',
          fontWeight: 800,
          borderRadius: 14,
          backgroundColor: '#0d0d18',
          border: '1px solid rgba(124, 92, 252, 0.55)',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#7c5cfc';
          e.currentTarget.style.borderColor = '#7c5cfc';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,92,252,0.45)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0d0d18';
          e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.55)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <LogOut size={18} />
        Salir
      </button>
    </form>
  );
}
