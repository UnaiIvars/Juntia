import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Logo from '@/components/ui/Logo';
import FondoApp from '@/components/ui/FondoApp';
import { ArrowLeft } from 'lucide-react';
import FormularioEditarPlan from '@/components/planes/FormularioEditarPlan';

export default async function PaginaEditarPlan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: plan, error } = await supabase
    .from('planes')
    .select(`
      *,
      miembros_plan (
        id,
        usuario_id,
        rol
      )
    `)
    .eq('id', id)
    .single();

  if (error || !plan) {
    notFound();
  }

  if (plan.creador_id !== user.id) {
    redirect('/dashboard');
  }

  const miembroCreador = plan.miembros_plan?.find((m: any) => m.usuario_id === user.id);

  const { data: franjasData } = miembroCreador
    ? await supabase
        .from('disponibilidad_usuarios')
        .select('*')
        .eq('miembro_id', miembroCreador.id)
        .eq('esta_disponible', true)
        .order('fecha', { ascending: true })
    : { data: [] };

  const franjasIniciales = (franjasData || []).map((f: any) => ({
    fecha: f.fecha,
    hora_inicio: f.hora_inicio.slice(0, 5),
    hora_fin: f.hora_fin.slice(0, 5),
  }));

  const { data: lugaresPlanData } = await supabase
    .from('lugares_plan')
    .select('*, lugar:lugares(*)')
    .eq('plan_id', id);

  const lugaresIniciales = (lugaresPlanData || [])
    .filter((lp: any) => lp.lugar)
    .map((lp: any) => ({
      nombre: lp.lugar.nombre,
      direccion: lp.lugar.direccion,
      categoria: lp.lugar.categoria,
      precio: lp.lugar.nivel_precio ? `${lp.lugar.nivel_precio}` : '0',
      lat: Number(lp.lugar.latitud),
      lng: Number(lp.lugar.longitud),
      link_maps: lp.lugar.sitio_web,
    }));

  const { data: invData } = await supabase
    .from('invitaciones_plan')
    .select('usuario_invitado_id')
    .eq('plan_id', id);

  const amigosInvitadosIniciales = (invData || []).map((i: any) => i.usuario_invitado_id);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090910', color: '#f0f0ff', position: 'relative' }}>
      <FondoApp />
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 14, 0.55)', zIndex: 0, pointerEvents: 'none' }} />
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(9, 9, 16, 0.9)',
          backdropFilter: 'blur(24px)',
          height: 86,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
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
          <Logo tamaño="xl" enlaceDestino="/dashboard" />
          
          <Link
            href={`/planes/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 800,
              textDecoration: 'none',
              padding: '0.65rem 1.3rem',
              borderRadius: 12,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(124, 92, 252, 0.6)',
              color: '#ffffff',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="btn-volver-link"
          >
            <ArrowLeft size={16} />
            Volver al plan
          </Link>
        </div>
      </header>
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '3.5rem 1.5rem 6rem', position: 'relative', zIndex: 10 }}>
        <FormularioEditarPlan
          plan={plan}
          franjasIniciales={franjasIniciales}
          lugaresIniciales={lugaresIniciales}
          amigosInvitadosIniciales={amigosInvitadosIniciales}
        />
      </main>

      <style>{`
        .btn-volver-link:hover {
          background-color: #7c5cfc !important;
          border-color: #7c5cfc !important;
          box-shadow: 0 4px 14px rgba(124, 92, 252, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
