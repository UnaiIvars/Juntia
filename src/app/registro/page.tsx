'use client';

import { useActionState, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { registrar, type EstadoFormulario } from '@/app/actions/auth';
import { loginConGoogle } from '@/app/actions/oauth';
import { comprobarUsername } from '@/app/actions/amigos';
import Logo from '@/components/ui/Logo';
import { Loader2, Mail, Lock, User, AtSign, CheckCircle2, XCircle } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function PaginaRegistro() {
  const [estado, accion, pendiente] = useActionState(
    registrar as (state: EstadoFormulario, payload: FormData) => Promise<EstadoFormulario>,
    undefined
  );

  const [usernameValor, setUsernameValor] = useState('');
  const [usernameEstado, setUsernameEstado] = useState<'idle' | 'comprobando' | 'disponible' | 'ocupado' | 'error'>('idle');
  const [usernameMensaje, setUsernameMensaje] = useState('');

  const comprobar = useCallback(async (valor: string) => {
    const limpio = valor.replace(/^@/, '').trim().toLowerCase();
    if (!limpio || limpio.length < 3) {
      setUsernameEstado('idle');
      setUsernameMensaje('');
      return;
    }
    setUsernameEstado('comprobando');
    const res = await comprobarUsername(limpio);
    if (res.error) {
      setUsernameEstado('error');
      setUsernameMensaje(res.error);
    } else if (res.disponible) {
      setUsernameEstado('disponible');
      setUsernameMensaje('¡Disponible!');
    } else {
      setUsernameEstado('ocupado');
      setUsernameMensaje('Ya está en uso, prueba otro.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => comprobar(usernameValor), 500);
    return () => clearTimeout(timer);
  }, [usernameValor, comprobar]);

  const colorUsername =
    usernameEstado === 'disponible' ? '#22c55e' :
    usernameEstado === 'ocupado' || usernameEstado === 'error' ? '#f43f5e' :
    '#9898be';

  return (
    <main className="min-h-screen flex items-center justify-center p-6 gradient-bg">
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,92,252,0.18), transparent)',
        }}
      />

      <div className="w-full max-w-lg animate-fade-in-up" style={{ position: 'relative', zIndex: 1, paddingTop: '1.5rem', paddingBottom: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo tamaño="xl" enlaceDestino="/" />
          <p style={{ color: '#9898be', marginTop: '0.85rem', fontSize: '1rem' }}>
            Crea tu cuenta gratis y empieza a organizar planes
          </p>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.75rem', color: '#f0f0ff' }}>
            Crear cuenta
          </h1>
          {estado?.mensaje && (
            <div id="registro-error-msg" style={{
              background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.35)',
              borderRadius: 12, padding: '0.85rem 1.15rem', marginBottom: '1.5rem',
              color: '#f87171', fontSize: '0.9rem',
            }}>
              {estado.mensaje}
            </div>
          )}

          <form action={accion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="nombre" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Nombre completo
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none' }} />
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  className={`input-base ${estado?.errores?.nombre ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.6rem' }}
                  disabled={pendiente}
                  autoComplete="name"
                  required
                />
              </div>
              {estado?.errores?.nombre && <p className="error-text">{estado.errores.nombre[0]}</p>}
            </div>
            <div>
              <label htmlFor="username" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Nombre de usuario <span style={{ color: '#8585ad', fontWeight: 400 }}>(@usuario)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <AtSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none' }} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="nombre_unico"
                  value={usernameValor}
                  onChange={(e) => setUsernameValor(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  className={`input-base ${estado?.errores?.username ? 'input-error' : ''}`}
                  style={{
                    paddingLeft: '2.6rem',
                    paddingRight: '2.6rem',
                    borderColor:
                      usernameEstado === 'disponible' ? 'rgba(34, 197, 94, 0.6)' :
                      usernameEstado === 'ocupado' ? 'rgba(244, 63, 94, 0.6)' : undefined,
                  }}
                  disabled={pendiente}
                  autoComplete="username"
                  required
                />
                <div style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  {usernameEstado === 'comprobando' && <Loader2 size={15} style={{ color: '#9898be', animation: 'spin 1s linear infinite' }} />}
                  {usernameEstado === 'disponible' && <CheckCircle2 size={15} style={{ color: '#22c55e' }} />}
                  {usernameEstado === 'ocupado' && <XCircle size={15} style={{ color: '#f43f5e' }} />}
                </div>
              </div>
              {usernameValor.length >= 3 && usernameEstado !== 'idle' && (
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: colorUsername, marginTop: '0.3rem' }}>
                  {usernameEstado === 'comprobando' ? 'Comprobando...' : usernameMensaje}
                </p>
              )}
              {estado?.errores?.username && <p className="error-text">{estado.errores.username[0]}</p>}
            </div>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none' }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  className={`input-base ${estado?.errores?.email ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.6rem' }}
                  disabled={pendiente}
                  autoComplete="email"
                  required
                />
              </div>
              {estado?.errores?.email && <p className="error-text">{estado.errores.email[0]}</p>}
            </div>
            <div>
              <label htmlFor="contrasena" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none' }} />
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className={`input-base ${estado?.errores?.contrasena ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.6rem' }}
                  disabled={pendiente}
                  autoComplete="new-password"
                  required
                />
              </div>
              {estado?.errores?.contrasena && <p className="error-text">{estado.errores.contrasena[0]}</p>}
            </div>
            <div>
              <label htmlFor="confirmarContrasena" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#f0f0ff', marginBottom: '0.4rem' }}>
                Confirmar contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8585ad', pointerEvents: 'none' }} />
                <input
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  type="password"
                  placeholder="Repite la contraseña"
                  className={`input-base ${estado?.errores?.confirmarContrasena ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.6rem' }}
                  disabled={pendiente}
                  autoComplete="new-password"
                  required
                />
              </div>
              {estado?.errores?.confirmarContrasena && <p className="error-text">{estado.errores.confirmarContrasena[0]}</p>}
            </div>
            <button
              id="btn-registro"
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}
              disabled={pendiente || usernameEstado === 'ocupado' || usernameEstado === 'comprobando'}
            >
              {pendiente ? (
                <><Loader2 size={18} className="animate-spin" /> Creando cuenta...</>
              ) : (
                'Crear cuenta gratis'
              )}
            </button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#6b6b90', fontSize: '0.85rem' }}>o</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <form action={loginConGoogle}>
            <button
              type="submit"
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', gap: '0.75rem', fontSize: '0.95rem', padding: '0.85rem' }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#9898be', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#c4b5fd', fontWeight: 700, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
