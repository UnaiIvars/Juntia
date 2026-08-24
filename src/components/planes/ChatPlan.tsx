'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { enviarMensaje, MensajeConPerfil } from '@/app/actions/mensajes';
import toast from 'react-hot-toast';

interface ChatPlanProps {
  planId: string;
  miembroActualId: string | undefined;
  usuarioActualId: string;
  mensajesIniciales: MensajeConPerfil[];
  miembros?: { perfil?: { nombre_completo?: string | null; username?: string | null } | null }[];
}

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '?';
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatearHora(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date();
  const esHoy =
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate();

  if (esHoy) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPlan({
  planId,
  miembroActualId,
  usuarioActualId,
  mensajesIniciales,
  miembros = [],
}: ChatPlanProps) {
  const [mensajes, setMensajes] = useState<MensajeConPerfil[]>(mensajesIniciales);
  const [texto, setTexto] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const scrollAlFondo = useCallback((suave = true) => {
    bottomRef.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollAlFondo(false);
  }, []);

  useEffect(() => {
    scrollAlFondo(true);
  }, [mensajes.length]);

  useEffect(() => {
    const canal = supabase
      .channel(`chat-plan-${planId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `plan_id=eq.${planId}`,
        },
        async (payload) => {
          const nuevoRaw = payload.new as {
            id: string;
            plan_id: string;
            miembro_id: string;
            contenido: string;
            creado_en: string;
          };

          const remitenteConocido = mensajes.find(
            (m) => m.remitente?.id === nuevoRaw.miembro_id
          )?.remitente;

          const nuevoMensaje: MensajeConPerfil = {
            ...nuevoRaw,
            remitente: remitenteConocido ?? {
              id: nuevoRaw.miembro_id,
              usuario_id: '',
              perfil: null,
            },
          };

          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;
            return [...prev, nuevoMensaje];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [planId, mensajes]);

  const handleEnviar = () => {
    const contenido = texto.trim();
    if (!contenido || isPending) return;

    setTexto('');

    startTransition(async () => {
      const res = await enviarMensaje(planId, contenido);
      if (!res.success) {
        toast.error(res.error || 'Error al enviar el mensaje');
        setTexto(contenido); // restaurar si falla
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  type MensajeAgrupado = MensajeConPerfil & { esPropio: boolean; esUltimoDelGrupo: boolean; esPrimeroDelGrupo: boolean };

  const mensajesAgrupados: MensajeAgrupado[] = mensajes.map((m, i) => {
    const prev = i > 0 ? mensajes[i - 1] : null;
    const next = i < mensajes.length - 1 ? mensajes[i + 1] : null;
    const esPropio = m.remitente?.usuario_id === usuarioActualId || m.remitente?.id === miembroActualId;
    const esPrimeroDelGrupo = !prev || prev.remitente?.id !== m.remitente?.id;
    const esUltimoDelGrupo = !next || next.remitente?.id !== m.remitente?.id;
    return { ...m, esPropio, esPrimeroDelGrupo, esUltimoDelGrupo };
  });

  return (
    <section
      style={{
        backgroundColor: 'rgba(13,13,22,0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: 520,
      }}
    >
      <div
        style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexShrink: 0,
          backgroundColor: 'rgba(10,10,20,0.6)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #7c5cfc, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MessageCircle size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Chat del grupo
          </div>
          <div style={{ fontSize: '0.73rem', color: '#a78bfa', fontWeight: 600, marginTop: '0.1rem' }}>
            {miembros.length > 0
              ? miembros.map((m) => m.perfil?.nombre_completo || m.perfil?.username || 'Participante').join(' · ')
              : 'Chat del plan'}
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {mensajes.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: '#3a3a5a',
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            <MessageCircle size={36} strokeWidth={1.5} />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4a4a6a', marginBottom: '0.25rem' }}>
                Todavía no hay mensajes
              </div>
              <div style={{ fontSize: '0.82rem', color: '#3a3a5a' }}>
                Sé el primero en escribir algo al grupo
              </div>
            </div>
          </div>
        ) : (
          mensajesAgrupados.map((m) => {
            const nombre = m.remitente?.perfil?.nombre_completo;
            const avatar = m.remitente?.perfil?.avatar_url;

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: m.esPropio ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '0.5rem',
                  marginBottom: m.esUltimoDelGrupo ? '0.65rem' : '0.1rem',
                }}
              >
                <div style={{ width: 28, flexShrink: 0 }}>
                  {!m.esPropio && m.esUltimoDelGrupo && (
                    <div
                      title={nombre || 'Usuario'}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#2a2a42',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: '#a78bfa',
                      }}
                    >
                      {avatar ? (
                        <img src={avatar} alt={nombre || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        iniciales(nombre)
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.esPropio ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                    gap: '0.15rem',
                  }}
                >
                  {!m.esPropio && m.esPrimeroDelGrupo && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#7c5cfc',
                        paddingLeft: '0.6rem',
                      }}
                    >
                      {nombre || 'Participante'}
                    </span>
                  )}
                  <div
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: m.esPropio
                        ? m.esPrimeroDelGrupo
                          ? '16px 4px 16px 16px'
                          : '16px 4px 4px 16px'
                        : m.esPrimeroDelGrupo
                        ? '4px 16px 16px 16px'
                        : '4px 16px 16px 4px',
                      backgroundColor: m.esPropio
                        ? 'rgba(124, 92, 252, 0.85)'
                        : 'rgba(255,255,255,0.07)',
                      color: m.esPropio ? '#fff' : '#e0e0ff',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      fontWeight: 400,
                      wordBreak: 'break-word',
                      backdropFilter: m.esPropio ? 'none' : 'blur(8px)',
                      border: m.esPropio ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: m.esPropio ? '0 4px 14px rgba(124,92,252,0.3)' : 'none',
                    }}
                  >
                    {m.contenido}
                  </div>
                  {m.esUltimoDelGrupo && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        color: '#3d3d5a',
                        paddingLeft: m.esPropio ? 0 : '0.5rem',
                        paddingRight: m.esPropio ? '0.5rem' : 0,
                      }}
                    >
                      {formatearHora(m.creado_en)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div
        style={{
          padding: '0.9rem 1.1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(10,10,20,0.6)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.7rem',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje… (Enter para enviar)"
          aria-label="Mensaje para el chat del plan"
          disabled={isPending}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '0.6rem 0.9rem',
            color: '#e0e0ff',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease',
            minHeight: 40,
            maxHeight: 120,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(124,92,252,0.5)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
        <button
          type="button"
          onClick={handleEnviar}
          aria-label="Enviar mensaje"
          disabled={!texto.trim() || isPending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: texto.trim() && !isPending
              ? 'linear-gradient(135deg, #7c5cfc, #38bdf8)'
              : 'rgba(255,255,255,0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: texto.trim() && !isPending ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: texto.trim() && !isPending ? '0 4px 14px rgba(124,92,252,0.5)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (texto.trim() && !isPending) {
              e.currentTarget.style.transform = 'scale(1.08) translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
          }}
        >
          {isPending ? (
            <Loader2 size={16} color="rgba(255,255,255,0.5)" className="animate-spin" />
          ) : (
            <Send size={16} color={texto.trim() ? '#fff' : 'rgba(255,255,255,0.2)'} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
