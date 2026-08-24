import { MiembroPlan } from '@/types/database';
import { Crown } from 'lucide-react';

interface PropsListaParticipantes {
  miembros: MiembroPlan[];
  creadorId: string;
}

const COLORES_AVATAR = [
  'linear-gradient(135deg, #7c5cfc, #a855f7)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #10b981, #22c55e)',
  'linear-gradient(135deg, #f59e0b, #eab308)',
];

export default function ListaParticipantes({
  miembros,
  creadorId,
}: PropsListaParticipantes) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(13, 13, 24, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 20,
        padding: '1.5rem',
      }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          Participantes ({miembros.length})
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#9898be', marginTop: '0.2rem' }}>
          Personas unidas a este plan
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {miembros.map((m, index) => {
          const esCreador = m.usuario_id === creadorId || m.rol === 'administrador';
          const nombre = m.perfil?.nombre_completo || m.perfil?.email?.split('@')[0] || 'Participante';
          const username = m.perfil?.username;
          const inicial = nombre.charAt(0).toUpperCase();
          const avatarUrl = m.perfil?.avatar_url;
          const colorFondo = COLORES_AVATAR[index % COLORES_AVATAR.length];

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.9rem',
                borderRadius: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                gap: '0.75rem',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: avatarUrl ? 'transparent' : colorFondo,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1.5px solid rgba(124, 92, 252, 0.5)',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    inicial
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {nombre}
                    </span>
                    {esCreador && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          padding: '0.1rem 0.45rem',
                          borderRadius: 6,
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        <Crown size={11} /> Creador
                      </span>
                    )}
                  </div>
                  {username && (
                    <div style={{ fontSize: '0.73rem', color: '#a78bfa', fontWeight: 600 }}>
                      @{username}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
