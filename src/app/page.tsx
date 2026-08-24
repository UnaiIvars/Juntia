import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Sparkles,
  Percent,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import DemoInteractivoLanding from '@/components/landing/DemoInteractivoLanding';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090910', color: '#f0f0ff', position: 'relative', overflowX: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Image
          src="/hero-bg.jpg"
          alt="Juntia Background"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.3 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 90% 70% at 50% 25%, rgba(9, 9, 16, 0.5) 0%, #090910 85%)',
          }}
        />
      </div>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(9, 9, 16, 0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          height: 86,
          display: 'flex',
          alignItems: 'center',
          padding: '0 2.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo tamaño="xl" enlaceDestino="/" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.65rem 1.3rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                borderRadius: 12,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.6)',
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="btn-landing-login"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.65rem 1.35rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                borderRadius: 12,
                backgroundColor: '#7c5cfc',
                border: '1px solid #7c5cfc',
                color: '#ffffff',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(124, 92, 252, 0.45)',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="btn-landing-cta-sm"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>
      <main style={{ position: 'relative', zIndex: 1 }}>
        <section
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '4.5rem 1.5rem 2.5rem',
            textAlign: 'center',
          }}
        >
          <div
            className="animate-fade-in-up"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.45rem 1.25rem',
              borderRadius: 99,
              backgroundColor: 'rgba(124, 92, 252, 0.15)',
              border: '1px solid rgba(124, 92, 252, 0.35)',
              marginBottom: '2rem',
            }}
          >
            <Sparkles size={16} color="#a855f7" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#c4b5fd' }}>
              La app para decidir planes en grupo
            </span>
          </div>
          <h1
            className="animate-fade-in-up animate-delay-100"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.4rem)',
              fontWeight: 800,
              lineHeight: 1.12,
              color: '#ffffff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Convierte el{' '}
            <span className="gradient-text">&ldquo;¿qué hacemos?&rdquo;</span>
            <br />
            en un plan decidido
          </h1>
          <p
            className="animate-fade-in-up animate-delay-200"
            style={{
              fontSize: '1.15rem',
              color: '#9898be',
              maxWidth: 640,
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}
          >
            Invita a tus amigos con un enlace. Cada uno indica sus horarios, presupuesto y gustos. Juntia calcula automáticamente el lugar perfecto con el mayor porcentaje de compatibilidad.
          </p>
          <div
            className="animate-fade-in-up animate-delay-300"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              marginBottom: '4.5rem',
            }}
          >
            <Link
              href="/registro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.95rem 2rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: 14,
                backgroundColor: '#7c5cfc',
                border: '1px solid #7c5cfc',
                color: '#ffffff',
                textDecoration: 'none',
                boxShadow: '0 6px 22px rgba(124, 92, 252, 0.45)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="btn-hero-primary"
            >
              Crear mi primer plan
              <ChevronRight size={20} />
            </Link>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.95rem 2rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: 14,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.6)',
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="btn-hero-secondary"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <DemoInteractivoLanding />
        </section>
        <section
          style={{
            maxWidth: 1150,
            margin: '0 auto',
            padding: '4rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              ¿Cómo funciona Juntia?
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#9898be', margin: 0 }}>
              Organizar un plan nunca fue tan rápido, transparente y libre de discusiones.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div
              className="feature-card-interactive"
              style={{
                padding: '2.25rem 2rem',
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                transition: 'all 0.22s ease',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(124, 92, 252, 0.15)',
                  border: '1px solid rgba(124, 92, 252, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#c4b5fd',
                  marginBottom: '1.25rem',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.6rem' }}>
                Crea el plan e invita
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#9898be', lineHeight: 1.6, margin: 0 }}>
                Ponle título a la quedada y comparte el enlace directo o código único por WhatsApp con tu grupo de amigos.
              </p>
            </div>
            <div
              className="feature-card-interactive"
              style={{
                padding: '2.25rem 2rem',
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                transition: 'all 0.22s ease',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#e9d5ff',
                  marginBottom: '1.25rem',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.6rem' }}>
                Votad disponibilidad y gustos
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#9898be', lineHeight: 1.6, margin: 0 }}>
                Cada amigo indica en 1 minuto qué días/horas puede, cuánto quiere gastar y qué tipo de lugares le apetecen.
              </p>
            </div>
            <div
              className="feature-card-interactive"
              style={{
                padding: '2.25rem 2rem',
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                transition: 'all 0.22s ease',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#86efac',
                  marginBottom: '1.25rem',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.6rem' }}>
                El sistema decide el ganador
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#9898be', lineHeight: 1.6, margin: 0 }}>
                El algoritmo calcula la mejor opción en el mapa con su % de compatibilidad y genera la tarjeta final del plan.
              </p>
            </div>
          </div>
        </section>
        <section
          style={{
            maxWidth: 1150,
            margin: '0 auto',
            padding: '2rem 1.5rem 4rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div
              className="feature-card-interactive"
              style={{
                padding: '2rem',
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                transition: 'all 0.22s ease',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(124, 92, 252, 0.15)', border: '1px solid rgba(124, 92, 252, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Calendar size={22} color="#7c5cfc" />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                Cuadrícula de Horarios
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#9898be', lineHeight: 1.6, margin: 0 }}>
                Visualiza al instante en qué franjas horarias coincide el mayor número de participantes.
              </p>
            </div>

            <div
              className="feature-card-interactive"
              style={{
                padding: '2rem',
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                transition: 'all 0.22s ease',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <MapPin size={22} color="#ec4899" />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                Buscador y Google Maps
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#9898be', lineHeight: 1.6, margin: 0 }}>
                Explora restaurantes, bares y actividades cercanos filtrando por distancia y presupuesto.
              </p>
            </div>

            <div
              className="feature-card-interactive"
              style={{
                padding: '2rem',
                backgroundColor: 'rgba(13, 13, 24, 0.85)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                transition: 'all 0.22s ease',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Percent size={22} color="#06b6d4" />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                Algoritmo Inteligente
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#9898be', lineHeight: 1.6, margin: 0 }}>
                Ponderación clara (40% tiempo, 25% coste, 20% gustos, 15% ubicación) sin sesgos.
              </p>
            </div>
          </div>
        </section>
        <section style={{ maxWidth: 940, margin: '0 auto 6rem', padding: '0 1.5rem' }}>
          <div
            style={{
              borderRadius: 28,
              padding: '3.5rem 2rem',
              background: 'linear-gradient(135deg, rgba(124, 92, 252, 0.25) 0%, rgba(168, 85, 247, 0.12) 50%, rgba(13, 13, 24, 0.95) 100%)',
              border: '1px solid rgba(124, 92, 252, 0.45)',
              textAlign: 'center',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(124, 92, 252, 0.2)',
            }}
          >
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
              ¿Listo para organizar tu próximo plan?
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#9898be', maxWidth: 480, margin: '0 auto 2.25rem', lineHeight: 1.6 }}>
              Crea un grupo en 30 segundos y olvídate de las discusiones eternas en el chat.
            </p>
            <Link
              href="/registro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem 2.6rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: 14,
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.65)',
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="btn-cta-final"
            >
              Empezar gratis ahora →
            </Link>
          </div>
        </section>
      </main>
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#090910',
          padding: '2.5rem 1.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.85rem',
            color: '#5a5a7a',
          }}
        >
          <Logo tamaño="sm" enlaceDestino="/" />
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Juntia. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/login" className="footer-link-interactive" style={{ color: '#9898be', textDecoration: 'none', fontWeight: 600, transition: 'all 0.15s ease' }}>Iniciar sesión</Link>
            <Link href="/registro" className="footer-link-interactive" style={{ color: '#9898be', textDecoration: 'none', fontWeight: 600, transition: 'all 0.15s ease' }}>Crear cuenta</Link>
          </div>
        </div>
      </footer>
      <style>{`
        .btn-landing-login:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
        .btn-landing-cta-sm:hover {
          background-color: #6d46f9 !important;
          border-color: #6d46f9 !important;
          box-shadow: 0 6px 20px rgba(124, 92, 252, 0.65);
          transform: translateY(-1px);
        }
        .btn-hero-primary:hover {
          background-color: #6d46f9 !important;
          border-color: #6d46f9 !important;
          box-shadow: 0 8px 28px rgba(124, 92, 252, 0.7);
          transform: translateY(-2px);
        }
        .btn-hero-secondary:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 6px 22px rgba(124, 92, 252, 0.45);
          transform: translateY(-2px);
        }
        .feature-card-interactive:hover {
          border-color: rgba(124, 92, 252, 0.5) !important;
          box-shadow: 0 10px 30px rgba(124, 92, 252, 0.18) !important;
          transform: translateY(-3px);
        }
        .btn-cta-final:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 8px 26px rgba(124, 92, 252, 0.6) !important;
          transform: translateY(-2px);
        }
        .footer-link-interactive:hover {
          color: #c4b5fd !important;
        }
      `}</style>
    </div>
  );
}
