'use client';

import { useRef, useState } from 'react';
import { subirAvatar } from '@/app/actions/perfil';
import { Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AvatarUploader({
  avatarUrl,
  nombre,
}: {
  avatarUrl: string | null;
  nombre: string | null;
}) {
  const inicial = nombre?.charAt(0).toUpperCase() || '?';
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCambioArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const url = URL.createObjectURL(archivo);
    setPreview(url);

    setSubiendo(true);
    const fd = new FormData();
    fd.append('avatar', archivo);

    const res = await subirAvatar(undefined, fd);
    if (res?.exito) {
      toast.success(res.mensaje || '¡Foto actualizada!');
    } else {
      toast.error(res?.mensaje || 'Error al subir la foto');
      setPreview(avatarUrl);
    }
    setSubiendo(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      <div
        style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            width: 125,
            height: 125,
            borderRadius: '50%',
            overflow: 'hidden',
            background: preview ? 'transparent' : 'linear-gradient(135deg, #7c5cfc, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid transparent',
            outline: isHovered
              ? '3px solid #a855f7'
              : '3px solid rgba(124, 92, 252, 0.5)',
            outlineOffset: '2px',
            boxShadow: isHovered
              ? '0 0 22px rgba(168, 85, 247, 0.55)'
              : '0 4px 18px rgba(0, 0, 0, 0.4)',
            transition: 'outline-color 0.25s ease, box-shadow 0.25s ease',
            position: 'relative',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt={nombre || 'Avatar'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#ffffff' }}>
              {inicial}
            </span>
          )}
          {subiendo && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
            >
              <Loader2 size={30} color="#ffffff" className="animate-spin" />
            </div>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${isHovered ? '#a855f7' : 'rgba(124, 92, 252, 0.7)'}`,
            boxShadow: isHovered
              ? '0 0 12px rgba(168, 85, 247, 0.6)'
              : '0 2px 8px rgba(0, 0, 0, 0.5)',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease',
            backgroundColor: isHovered ? '#7c5cfc' : '#0d0d18',
          }}
        >
          <Camera size={16} color="white" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.55rem 1.1rem',
          borderRadius: 12,
          backgroundColor: '#0d0d18',
          border: '1px solid rgba(124, 92, 252, 0.6)',
          color: '#ffffff',
          fontSize: '0.88rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: '0.5rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#7c5cfc';
          e.currentTarget.style.borderColor = '#7c5cfc';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 92, 252, 0.5)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0d0d18';
          e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.6)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Camera size={14} /> Cambiar foto de perfil
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleCambioArchivo}
        style={{ display: 'none' }}
      />
    </div>
  );
}
