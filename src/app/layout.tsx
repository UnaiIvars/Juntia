import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Juntia — Organiza planes con tus amigos',
  description: 'Juntia te ayuda a decidir qué hacer, cuándo y dónde con tu grupo. Disponibilidad, presupuesto, mapa y votaciones en un solo lugar.',
  keywords: ['planes', 'amigos', 'organizar', 'actividades', 'grupo'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#13131f',
              color: '#f0f0ff',
              border: '1px solid #252540',
              borderRadius: '12px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#13131f' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#13131f' },
            },
          }}
        />
      </body>
    </html>
  );
}
