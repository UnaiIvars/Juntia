'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Plan } from '@/types/database';

interface PropsBotonAjustesModal {
  plan: Plan;
  textoBoton?: string;
  estiloBoton?: React.CSSProperties;
}

export default function BotonAjustesModal({
  plan,
  textoBoton,
  estiloBoton,
}: PropsBotonAjustesModal) {
  return (
    <Link
      href={`/planes/${plan.id}/editar`}
      title="Ajustes del plan (Editar o eliminar)"
      className="btn-gear-spin"
      style={estiloBoton}
    >
      <Settings size={17} />
      {textoBoton && <span>{textoBoton}</span>}
    </Link>
  );
}
