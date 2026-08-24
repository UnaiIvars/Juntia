'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/ui/Logo';
import FondoApp from '@/components/ui/FondoApp';
import { comprobarUsername, guardarUsername } from '@/app/actions/amigos';
import { AtSign, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';

export default function PaginaElegirUsername() {
  const router = useRouter();
  const [valor, setValor] = useState('');
  const [estado, setEstado] = useState<'idle' | 'comprobando' | 'disponible' | 'ocupado' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');

  const comprobar = useCallback(async (v: string) => {
    const limpio = v.replace(/^@/, '').trim().toLowerCase();
    if (!limpio || limpio.length < 3) {
      setEstado('idle');
      setMensaje('');
      return;
    }
    setEstado('comprobando');
    const res = await comprobarUsername(limpio);
    if (res.error) {
      setEstado('error');
      setMensaje(res.error);
    } else if (res.disponible) {
      setEstado('disponible');
      setMensaje('¡Disponible! Puedes usar este nombre.');
    } else {
      setEstado('ocupado');
      setMensaje('Este nombre ya está en uso, prueba otro.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => comprobar(valor), 500);
    return () => clearTimeout(timer);
  }, [valor, comprobar]);

  const handleGuardar = async () => {
    if (estado !== 'disponible') return;
    setGuardando(true);
    setErrorGuardar('');
    const res = await guardarUsername(valor);
    if (res.exito) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setErrorGuardar(res.error || 'Error desconocido.');
      setGuardando(false);
    }
  };

  const color =
    estado === 'disponible' ? '#22c55e' :
    estado === 'ocupado' || estado === 'error' ? '#f43f5e' :
    '#9898be';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090910', color: '#f0f0ff', position: 'relative' }}>
      <FondoApp />
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 14, 0.5)', zIndex: 0, pointerEvents: 'none' }} />

      <main style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div className="animate-fade-in-up" style={{ maxWidth: 480, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Logo tamaño="lg" enlaceDestino="/" />
          </div>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 28px rgba(124, 92, 252, 0.55)',
            }}>
              <AtSign size={30} color="#ffffff" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Sparkles size={13} /> Un último paso
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Elige tu nombre de usuario
            </h1>
            <p style={{ color: '#9898be', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Con tu <strong style={{ color: '#c4b5fd' }}>@usuario</strong> tus amigos podrán encontrarte fácilmente en Juntia.
            </p>
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <AtSign size={16} style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="nombre_usuario"
                className="input-base"
                style={{
                  paddingLeft: '2.6rem',
                  paddingRight: '2.6rem',
                  fontSize: '1.05rem',
                  textAlign: 'left',
                  borderColor:
                    estado === 'disponible' ? 'rgba(34, 197, 94, 0.6)' :
                    estado === 'ocupado' ? 'rgba(244, 63, 94, 0.6)' : undefined,
                }}
                disabled={guardando}
                autoFocus
              />
              <div style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                {estado === 'comprobando' && <Loader2 size={16} style={{ color: '#9898be', animation: 'spin 1s linear infinite' }} />}
                {estado === 'disponible' && <CheckCircle2 size={16} style={{ color: '#22c55e' }} />}
                {estado === 'ocupado' && <XCircle size={16} style={{ color: '#f43f5e' }} />}
              </div>
            </div>
            {valor.length >= 3 && (
              <p style={{ fontSize: '0.83rem', fontWeight: 600, color, marginBottom: '1.25rem', minHeight: '1.2rem' }}>
                {estado === 'comprobando' ? 'Comprobando disponibilidad...' : mensaje}
              </p>
            )}
            {valor.length < 3 && valor.length > 0 && (
              <p style={{ fontSize: '0.83rem', color: '#9898be', marginBottom: '1.25rem' }}>
                Mínimo 3 caracteres · Solo letras, números, _ y .
              </p>
            )}
            {valor.length === 0 && <div style={{ marginBottom: '1.25rem' }} />}

            {errorGuardar && (
              <div style={{
                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.35)',
                borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem',
                color: '#f87171', fontSize: '0.85rem',
              }}>
                {errorGuardar}
              </div>
            )}
            <button
              type="button"
              onClick={handleGuardar}
              disabled={estado !== 'disponible' || guardando}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}
            >
              {guardando ? (
                <><Loader2 size={17} className="animate-spin" /> Guardando...</>
              ) : (
                <>Continuar con @{valor || 'mi_usuario'}</>
              )}
            </button>

            <p style={{ color: '#6b6b90', fontSize: '0.78rem', marginTop: '1.25rem' }}>
              Podrás cambiarlo después desde tu perfil.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
