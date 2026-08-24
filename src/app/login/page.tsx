'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { iniciarSesion, type EstadoFormulario } from '@/app/actions/auth';
import { loginConGoogle } from '@/app/actions/oauth';
import Logo from '@/components/ui/Logo';
import { Loader2, Mail, Lock } from 'lucide-react';

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

export default function PaginaLogin() {
  const [estado, accion, pendiente] = useActionState(
    iniciarSesion as (state: EstadoFormulario, payload: FormData) => Promise<EstadoFormulario>,
    undefined
  );

  return (
    <main className="min-h-screen flex items-center justify-center p-6 gradient-bg">
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,92,252,0.18), transparent)',
        }}
      />

      <div className="w-full max-w-lg animate-fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo tamaño="xl" enlaceDestino="/" />
          <p style={{ color: '#9898be', marginTop: '0.85rem', fontSize: '1rem' }}>
            Bienvenido de vuelta a Juntia
          </p>
        </div>
        <div className="card" style={{ padding: '2.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.75rem', color: '#f0f0ff' }}>
            Iniciar sesión
          </h1>
          {estado?.mensaje && (
            <div id="login-error-msg" style={{
              background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.35)',
              borderRadius: 12, padding: '0.85rem 1.15rem', marginBottom: '1.5rem',
              color: '#f87171', fontSize: '0.9rem',
            }}>
              {estado.mensaje}
            </div>
          )}
          <form action={loginConGoogle} style={{ marginBottom: '1.5rem' }}>
            <button
              id="btn-google-login"
              type="submit"
              className="btn btn-ghost btn-lg"
              style={{ width: '100%', gap: '0.85rem', padding: '0.9rem 1.25rem' }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: '#252540' }} />
            <span style={{ color: '#68688c', fontSize: '0.85rem', fontWeight: 500 }}>o con tu correo</span>
            <div style={{ flex: 1, height: 1, background: '#252540' }} />
          </div>
          <form action={accion} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            <div>
              <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#9898be', marginBottom: '0.5rem', display: 'block' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#5a5a7a' }} />
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  placeholder="tu@email.com"
                  className={`input-base ${estado?.errores?.email ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.85rem', paddingRight: '1rem', height: 48, fontSize: '0.95rem' }}
                  disabled={pendiente}
                />
              </div>
              {estado?.errores?.email && <p className="error-text">{estado.errores.email[0]}</p>}
            </div>

            <div>
              <label htmlFor="contrasena" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#9898be', marginBottom: '0.5rem', display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#5a5a7a' }} />
                <input
                  id="contrasena" name="contrasena" type="password" autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input-base ${estado?.errores?.contrasena ? 'input-error' : ''}`}
                  style={{ paddingLeft: '2.85rem', paddingRight: '1rem', height: 48, fontSize: '0.95rem' }}
                  disabled={pendiente}
                />
              </div>
              {estado?.errores?.contrasena && <p className="error-text">{estado.errores.contrasena[0]}</p>}
            </div>

            <button
              id="btn-login"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={pendiente}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {pendiente ? (
                <><Loader2 size={20} className="animate-spin" /> Iniciando sesión...</>
              ) : 'Entrar a Juntia'}
            </button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0 1.25rem' }}>
            <div style={{ flex: 1, height: 1, background: '#252540' }} />
            <span style={{ color: '#68688c', fontSize: '0.85rem' }}>¿Aún no tienes cuenta?</span>
            <div style={{ flex: 1, height: 1, background: '#252540' }} />
          </div>

          <Link id="link-registro" href="/registro" className="btn btn-ghost btn-lg" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </main>
  );
}
