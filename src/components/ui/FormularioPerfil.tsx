'use client';

import { useState, useTransition, useActionState } from 'react';
import {
  actualizarPerfil,
  cambiarNombreUsuario,
  obtenerInfoCambiosUsername,
  type EstadoPerfil,
} from '@/app/actions/perfil';
import { Perfil } from '@/types/database';
import {
  User,
  AtSign,
  MapPin,
  Compass,
  Mail,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Edit3,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SelectorDireccionPerfil from '@/components/perfil/SelectorDireccionPerfil';

interface FormularioPerfilProps {
  perfil: Perfil;
  infoCambiosInicial?: {
    cambiosUsados: number;
    cambiosRestantes: number;
    puedeCambiar: boolean;
  };
}

export default function FormularioPerfil({
  perfil,
  infoCambiosInicial = { cambiosUsados: 0, cambiosRestantes: 2, puedeCambiar: true },
}: FormularioPerfilProps) {
  const [estado, accion, pendiente] = useActionState(actualizarPerfil, undefined);
  
  const [usernameActual, setUsernameActual] = useState(perfil.username || '');
  const [infoCambios, setInfoCambios] = useState(infoCambiosInicial);
  const [modalUsernameAbierto, setModalUsernameAbierto] = useState(false);
  const [nuevoUsernameInput, setNuevoUsernameInput] = useState(perfil.username || '');
  const [isPendingUsername, startTransitionUsername] = useTransition();

  const bioActual = (perfil as any).bio || '';
  const ciudadActual = (perfil as any).ciudad || '';
  const direccionActual = (perfil as any).direccion || '';

  const handleAbrirModalUsername = () => {
    setNuevoUsernameInput(usernameActual);
    setModalUsernameAbierto(true);
  };

  const handleConfirmarCambioUsername = () => {
    const limpio = nuevoUsernameInput.trim().toLowerCase().replace(/^@/, '');
    if (!limpio || limpio.length < 3) {
      toast.error('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    startTransitionUsername(async () => {
      const res = await cambiarNombreUsuario(limpio);
      if (res.exito) {
        toast.success(res.mensaje);
        if (res.nuevoUsername) setUsernameActual(res.nuevoUsername);
        if (typeof res.cambiosRestantes === 'number') {
          setInfoCambios({
            cambiosUsados: 2 - res.cambiosRestantes,
            cambiosRestantes: res.cambiosRestantes,
            puedeCambiar: res.cambiosRestantes > 0,
          });
        }
        setModalUsernameAbierto(false);
      } else {
        toast.error(res.mensaje);
      }
    });
  };

  return (
    <>
      <form action={accion} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {estado?.exito && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: 14,
              padding: '0.85rem 1.25rem',
              color: '#86efac',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            {estado.mensaje}
          </div>
        )}
        {estado?.mensaje && !estado.exito && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 14,
              padding: '0.85rem 1.25rem',
              color: '#f87171',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={18} color="#f43f5e" />
            {estado.mensaje}
          </div>
        )}
        <div>
          <label
            htmlFor="nombre_completo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.45rem',
            }}
          >
            <User size={15} color="#7c5cfc" />
            <span>Nombre completo</span>
            <span style={{ color: '#ec4899' }}>*</span>
          </label>
          <input
            id="nombre_completo"
            name="nombre_completo"
            type="text"
            defaultValue={perfil.nombre_completo || ''}
            placeholder="Tu nombre y apellidos..."
            className={`input-base ${estado?.errores?.nombre_completo ? 'input-error' : ''}`}
            maxLength={60}
            disabled={pendiente}
            required
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              padding: '0.75rem 1.1rem',
              color: '#ffffff',
              fontSize: '0.95rem',
              width: '100%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(124, 92, 252, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {estado?.errores?.nombre_completo && (
            <p className="error-text" style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              {estado.errores.nombre_completo[0]}
            </p>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              <AtSign size={15} color="#a855f7" />
              <span>Nombre de usuario</span>
            </label>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: infoCambios.cambiosRestantes > 0 ? '#a78bfa' : '#f87171',
                backgroundColor: infoCambios.cambiosRestantes > 0 ? 'rgba(124, 92, 252, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                padding: '0.15rem 0.55rem',
                borderRadius: 8,
              }}
            >
              {infoCambios.cambiosRestantes}/2 cambios este mes
            </span>
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem 0.65rem 1.1rem',
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'border-color 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 10,
                backgroundColor: 'rgba(124, 92, 252, 0.08)',
                border: '1px solid rgba(124, 92, 252, 0.2)',
                cursor: 'default',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(124, 92, 252, 0.18)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(124, 92, 252, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(124, 92, 252, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ color: '#a855f7', fontWeight: 800, fontSize: '1rem' }}>@</span>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff', letterSpacing: '0.02em' }}>
                {usernameActual || 'sin_usuario'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAbrirModalUsername}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.35), rgba(168, 85, 247, 0.35))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                padding: '0.45rem 0.9rem',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(124, 92, 252, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #7c5cfc, #a855f7)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.8)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(168, 85, 247, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 92, 252, 0.35), rgba(168, 85, 247, 0.35))';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 92, 252, 0.2)';
              }}
            >
              <Edit3 size={13} color="#ffffff" />
              <span>Cambiar @usuario</span>
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#7a7a9e', marginTop: '0.35rem' }}>
            Tus amigos te encontrarán por este @nombre. Pulsa el botón para cambiarlo (máx. 2 veces/mes).
          </p>
        </div>
        <div>
          <label
            htmlFor="ciudad"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.45rem',
            }}
          >
            <MapPin size={15} color="#38bdf8" />
            <span>Ciudad / De dónde eres</span>
            <span style={{ color: '#7a7a9e', fontWeight: 400, fontSize: '0.78rem' }}>(opcional)</span>
          </label>
          <input
            id="ciudad"
            name="ciudad"
            type="text"
            defaultValue={ciudadActual}
            placeholder="Ej: Madrid, Valencia, Barcelona..."
            className={`input-base ${estado?.errores?.ciudad ? 'input-error' : ''}`}
            maxLength={80}
            disabled={pendiente}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              padding: '0.75rem 1.1rem',
              color: '#ffffff',
              fontSize: '0.95rem',
              width: '100%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {estado?.errores?.ciudad && (
            <p className="error-text" style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              {estado.errores.ciudad[0]}
            </p>
          )}
        </div>
        <SelectorDireccionPerfil
          direccionInicial={direccionActual}
          ciudadInicial={ciudadActual}
          latitudInicial={(perfil as any).latitud}
          longitudInicial={(perfil as any).longitud}
          deshabilitado={pendiente}
        />
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#9898be',
              marginBottom: '0.45rem',
            }}
          >
            <Mail size={15} color="#9898be" />
            <span>Email</span>
          </label>
          <input
            type="email"
            value={perfil.email}
            readOnly
            className="input-base"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 14,
              padding: '0.75rem 1.1rem',
              color: '#9898be',
              fontSize: '0.95rem',
              width: '100%',
              opacity: 0.6,
              cursor: 'not-allowed',
            }}
          />
          <p style={{ fontSize: '0.78rem', color: '#5a5a7a', marginTop: '0.35rem' }}>
            El email no se puede modificar directamente.
          </p>
        </div>
        <div>
          <label
            htmlFor="bio"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.45rem',
            }}
          >
            <Sparkles size={15} color="#f59e0b" />
            <span>Sobre ti</span>
            <span style={{ color: '#7a7a9e', fontWeight: 400, fontSize: '0.78rem' }}>(opcional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={bioActual}
            placeholder="Cuéntale algo al grupo... tus planes favoritos, gustos, disponibilidad habitual..."
            className={`input-base ${estado?.errores?.bio ? 'input-error' : ''}`}
            maxLength={200}
            disabled={pendiente}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              padding: '0.75rem 1.1rem',
              color: '#ffffff',
              fontSize: '0.95rem',
              width: '100%',
              resize: 'vertical',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {estado?.errores?.bio ? (
            <p className="error-text" style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>
              {estado.errores.bio[0]}
            </p>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#7a7a9e', marginTop: '0.35rem' }}>
              Máximo 200 caracteres. Tus amigos lo verán en los planes.
            </p>
          )}
        </div>
        <button
          id="btn-guardar-perfil"
          type="submit"
          disabled={pendiente}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.75rem',
            borderRadius: 14,
            backgroundColor: '#0d0d18',
            border: '1px solid rgba(124, 92, 252, 0.7)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: pendiente ? 'not-allowed' : 'pointer',
            opacity: pendiente ? 0.7 : 1,
            transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: '0.5rem',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            if (!pendiente) {
              e.currentTarget.style.backgroundColor = '#7c5cfc';
              e.currentTarget.style.borderColor = '#7c5cfc';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 92, 252, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!pendiente) {
              e.currentTarget.style.backgroundColor = '#0d0d18';
              e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.7)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {pendiente ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Guardando información...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Guardar cambios</span>
            </>
          )}
        </button>
      </form>
      {modalUsernameAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(5, 5, 12, 0.82)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => {
            if (!isPendingUsername) setModalUsernameAbierto(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#121224',
              border: '1px solid rgba(124, 92, 252, 0.4)',
              borderRadius: 24,
              padding: '2rem',
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(124, 92, 252, 0.2)',
              position: 'relative',
              animation: 'modalFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AtSign size={20} color="#a855f7" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Cambiar @usuario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalUsernameAbierto(false)}
                disabled={isPendingUsername}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9898be',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#9898be';
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              style={{
                backgroundColor: infoCambios.cambiosRestantes > 0 ? 'rgba(124, 92, 252, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                border: infoCambios.cambiosRestantes > 0 ? '1px solid rgba(124, 92, 252, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: 16,
                padding: '1rem 1.15rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              {infoCambios.cambiosRestantes > 0 ? (
                <ShieldAlert size={20} color="#c4b5fd" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              ) : (
                <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              )}
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#e0e0ff' }}>
                <strong style={{ color: infoCambios.cambiosRestantes > 0 ? '#c4b5fd' : '#f87171', display: 'block', marginBottom: '0.2rem' }}>
                  {infoCambios.cambiosRestantes > 0
                    ? `Te queda ${infoCambios.cambiosRestantes} de 2 cambios disponibles este mes`
                    : 'Límite de 2 cambios alcanzado este mes'}
                </strong>
                <span>
                  Solo puedes cambiar tu nombre de usuario <strong>2 veces cada mes</strong> para mantener la coherencia con tus amigos en los planes.
                </span>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="nuevo_username"
                style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.45rem' }}
              >
                Nuevo nombre de usuario
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a855f7',
                    fontWeight: 800,
                    fontSize: '1rem',
                    pointerEvents: 'none',
                  }}
                >
                  @
                </span>
                <input
                  id="nuevo_username"
                  type="text"
                  value={nuevoUsernameInput}
                  onChange={(e) => setNuevoUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="nuevo_usuario"
                  disabled={isPendingUsername || !infoCambios.puedeCambiar}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: 14,
                    padding: '0.75rem 1.1rem 0.75rem 2.4rem',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    width: '100%',
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: '0.76rem', color: '#7a7a9e', marginTop: '0.35rem' }}>
                Mínimo 3 caracteres. Letras, números, puntos y guiones bajos.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setModalUsernameAbierto(false)}
                disabled={isPendingUsername}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarCambioUsername}
                disabled={isPendingUsername || !infoCambios.puedeCambiar || !nuevoUsernameInput.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.35rem',
                  borderRadius: 12,
                  background: infoCambios.puedeCambiar ? 'linear-gradient(135deg, #7c5cfc, #a855f7)' : '#33334d',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: infoCambios.puedeCambiar && !isPendingUsername ? 'pointer' : 'not-allowed',
                  boxShadow: infoCambios.puedeCambiar ? '0 6px 20px rgba(124, 92, 252, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (infoCambios.puedeCambiar && !isPendingUsername) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(168, 85, 247, 0.55)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (infoCambios.puedeCambiar && !isPendingUsername) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 92, 252, 0.4)';
                  }
                }}
              >
                {isPendingUsername ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando @usuario...</span>
                  </>
                ) : (
                  <span>Confirmar cambio</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
