import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/ui/Logo';
import { Sparkles, Users, Calendar, Euro, CheckCircle2, ArrowRight } from 'lucide-react';
import FormularioUnirsePlan from '@/components/planes/FormularioUnirsePlan';

const EMOJIS_TIPO: Record<string, string> = {
  cena: '🍕',
  fiesta: '🍹',
  deporte: '⚽',
  cafe: '☕',
  viaje: '✈️',
  otro: '🎯',
};

function normalizarCodigo(raw: string): string {
  let c = decodeURIComponent(raw).trim().toUpperCase();
  c = c.replace(/^.*\/UNIRSE\//i, '').replace(/^.*\/JOIN\//i, '').replace(/\s+/g, '');
  if (!c.startsWith('JNT-') && c.length === 4) {
    c = `JNT-${c}`;
  } else if (c.startsWith('JNT') && !c.startsWith('JNT-')) {
    c = `JNT-${c.slice(3)}`;
  }
  return c;
}

export default async function PaginaUnirsePlan({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const codigoLimpio = normalizarCodigo(codigo);

  const supabase = await createClient();

  let { data: plan, error } = await supabase
    .from('planes')
    .select('*')
    .ilike('codigo_invitacion', codigoLimpio)
    .maybeSingle();

  if (!plan) {
    const sufijo = codigoLimpio.replace('JNT-', '');
    const { data: planAlternativo } = await supabase
      .from('planes')
      .select('*')
      .ilike('codigo_invitacion', `%${sufijo}`)
      .maybeSingle();
    
    plan = planAlternativo;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!plan) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a12', color: '#f0f0ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <Logo tamaño="md" enlaceDestino="/" />
        
        <div className="card" style={{ maxWidth: 460, width: '100%', marginTop: '2rem', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Invitación no encontrada
          </h1>
          <p style={{ color: '#9898be', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            El código <strong style={{ color: '#c4b5fd' }}>{codigoLimpio}</strong> no corresponde a ningún plan activo.
          </p>
          <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
            Ir a mi Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { data: miembrosPlan } = await supabase
    .from('miembros_plan')
    .select('id, usuario_id')
    .eq('plan_id', plan.id);

  const { data: perfilCreador } = await supabase
    .from('perfiles')
    .select('nombre_completo, email')
    .eq('id', plan.creador_id)
    .maybeSingle();

  const emoji = EMOJIS_TIPO[plan.tipo_plan] || '🎯';
  const creadorNombre =
    perfilCreador?.nombre_completo ||
    perfilCreador?.email?.split('@')[0] ||
    'Un amigo';

  const esMiembro = user
    ? miembrosPlan?.some((m: any) => m.usuario_id === user.id) || plan.creador_id === user.id
    : false;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a12', color: '#f0f0ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <Logo tamaño="lg" enlaceDestino="/" />
      </div>

      <div
        className="card animate-fade-in-up"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(124, 92, 252, 0.15)',
            border: '1px solid rgba(124, 92, 252, 0.35)',
            color: '#c4b5fd',
            padding: '0.35rem 0.9rem',
            borderRadius: 99,
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
          }}
        >
          <Sparkles size={14} /> Invitación a un plan
        </div>

        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{emoji}</div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
          {plan.titulo}
        </h1>

        <p style={{ color: '#9898be', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          Invitación de <strong style={{ color: '#ffffff' }}>{creadorNombre}</strong>
        </p>

        {plan.descripcion && (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '1rem',
              fontSize: '0.9rem',
              color: '#d1d1e0',
              marginBottom: '1.75rem',
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            {plan.descripcion}
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            marginBottom: '2rem',
            textAlign: 'left',
          }}
        >
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#9898be', marginBottom: '0.2rem' }}>
              <Users size={13} color="#a855f7" /> Grupo
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              {miembrosPlan?.length || 1} personas
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#9898be', marginBottom: '0.2rem' }}>
              <Euro size={13} color="#22c55e" /> Presupuesto
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              {Number(plan.presupuesto_maximo) === 0 ? 'Gratis' : `~${plan.presupuesto_maximo} €`}
            </div>
          </div>

          {plan.fecha && (
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#9898be', marginBottom: '0.2rem' }}>
                <Calendar size={13} color="#ec4899" /> Fecha
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                {plan.fecha}
              </div>
            </div>
          )}
        </div>
        {user ? (
          esMiembro ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#22c55e', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                <CheckCircle2 size={18} /> Ya formas parte de este plan
              </div>
              <Link href={`/planes/${plan.id}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Entrar al plan y ver horarios <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <FormularioUnirsePlan codigo={plan.codigo_invitacion} />
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Link
              href={`/login`}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              Iniciar sesión para unirte
            </Link>
            <Link
              href={`/registro`}
              className="btn btn-ghost btn-lg"
              style={{ width: '100%' }}
            >
              Crear cuenta gratis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
