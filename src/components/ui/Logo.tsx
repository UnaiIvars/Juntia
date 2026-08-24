import Image from 'next/image';
import Link from 'next/link';

interface PropiedadesLogo {
  tamaño?: 'sm' | 'md' | 'lg' | 'xl';
  enlaceDestino?: string;
  className?: string;
}

const dimensiones = {
  sm: { ancho: 165, alto: 46 },
  md: { ancho: 220, alto: 62 },
  lg: { ancho: 280, alto: 79 },
  xl: { ancho: 340, alto: 96 },
};

export default function Logo({
  tamaño = 'md',
  enlaceDestino = '/',
  className = '',
}: PropiedadesLogo) {
  const { ancho, alto } = dimensiones[tamaño];

  const imagen = (
    <div
      className={`relative inline-flex items-center select-none transition-transform duration-200 hover:scale-105 ${className}`}
      style={{ width: ancho, height: alto }}
    >
      <Image
        src="/logo.svg"
        alt="Juntia"
        width={ancho}
        height={alto}
        priority
        className="w-full h-full object-contain filter drop-shadow-[0_2px_16px_rgba(255,255,255,0.25)]"
      />
    </div>
  );

  if (!enlaceDestino) return imagen;

  return (
    <Link
      href={enlaceDestino}
      className="inline-flex items-center focus:outline-none"
    >
      {imagen}
    </Link>
  );
}
