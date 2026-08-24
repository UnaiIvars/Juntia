import Image from 'next/image';

export default function FondoApp() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#07070f',
      }}
    >
      { }
      <Image
        src="/fondo-juntia.png"
        alt=""
        fill
        priority
        unoptimized
        style={{
          objectFit: 'cover',
          objectPosition: 'center center',
          opacity: 0.32,
          filter: 'contrast(1.1) brightness(0.9)',
        }}
      />

      { }
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(124, 92, 252, 0.22) 0%, transparent 60%), linear-gradient(180deg, rgba(7, 7, 15, 0.65) 0%, rgba(7, 7, 15, 0.88) 100%)',
        }}
      />

      { }
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1000px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(124, 92, 252, 0.28) 0%, rgba(168, 85, 247, 0.12) 45%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
    </div>
  );
}
