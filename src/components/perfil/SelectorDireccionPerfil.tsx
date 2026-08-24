'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Search, MapPin, X, Home, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Sugerencia {
  nombre: string;
  ciudad: string;
  displayCompleto: string;
  lat: number;
  lon: number;
}

interface SelectorDireccionPerfilProps {
  direccionInicial?: string;
  ciudadInicial?: string;
  latitudInicial?: number | null;
  longitudInicial?: number | null;
  deshabilitado?: boolean;
}

export default function SelectorDireccionPerfil({
  direccionInicial = '',
  ciudadInicial = '',
  latitudInicial = null,
  longitudInicial = null,
  deshabilitado = false,
}: SelectorDireccionPerfilProps) {
  const [texto, setTexto] = useState(direccionInicial);
  const [ciudad, setCiudad] = useState(ciudadInicial);
  const [lat, setLat] = useState<number | null>(latitudInicial);
  const [lon, setLon] = useState<number | null>(longitudInicial);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [seleccionada, setSeleccionada] = useState(Boolean(latitudInicial && longitudInicial));

  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const calcularPosicion = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    const onClickFuera = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.sd-contenedor') && !target.closest('.sd-dropdown-portal')) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  const buscar = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setSugerencias([]);
      setAbierto(false);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/nominatim?q=${encodeURIComponent(q + ', España')}`);
      if (!res.ok) throw new Error('Error en la petición');
      const data: any[] = await res.json();

      const lista: Sugerencia[] = data
        .filter(d => d.lat && d.lon && d.display_name)
        .map(d => {
          const addr = d.address || {};
          const ciudadVal = addr.city || addr.town || addr.village || addr.county || addr.state || 'España';
          return {
            nombre: d.name || d.display_name.split(',')[0],
            ciudad: ciudadVal,
            displayCompleto: d.display_name,
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
          };
        })
        .filter((v, i, a) => a.findIndex(x => x.displayCompleto === v.displayCompleto) === i)
        .slice(0, 7);

      if (!mounted.current) return;
      setSugerencias(lista);
      calcularPosicion();
      setAbierto(lista.length > 0);
    } catch (err) {
      console.error('Error buscando dirección:', err);
    } finally {
      if (mounted.current) setBuscando(false);
    }
  }, [calcularPosicion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTexto(val);
    setSeleccionada(false);
    setLat(null);
    setLon(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(val), 250);
  };

  const handleSeleccionar = (sug: Sugerencia) => {
    setTexto(sug.displayCompleto.replace(', España', ''));
    setCiudad(sug.ciudad);
    setLat(sug.lat);
    setLon(sug.lon);
    setSeleccionada(true);
    setAbierto(false);
    setSugerencias([]);
    toast.success(`📍 ${sug.nombre}, ${sug.ciudad}`);
  };

  const handleLimpiar = () => {
    setTexto('');
    setCiudad('');
    setLat(null);
    setLon(null);
    setSeleccionada(false);
    setSugerencias([]);
    setAbierto(false);
  };

  const dropdown = abierto && sugerencias.length > 0 ? ReactDOM.createPortal(
    <div
      className="sd-dropdown-portal"
      style={{
        position: 'absolute',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 99999,
        backgroundColor: '#11111f',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(124,92,252,0.2)',
      }}
    >
      {sugerencias.map((sug, idx) => (
        <button
          key={idx}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleSeleccionar(sug); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.7rem 1rem',
            border: 'none',
            borderBottom: idx < sugerencias.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            backgroundColor: 'transparent',
            color: '#fff',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span style={{ flexShrink: 0, color: '#9898be' }}>
            {idx === 0 ? <Home size={16} color="#a78bfa" /> : <Clock size={16} color="#7a7a9e" />}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            <strong style={{ color: '#ffffff', marginRight: 6 }}>{sug.nombre}</strong>
            <span style={{ color: '#9898be', fontSize: '0.83rem' }}>{sug.ciudad}</span>
          </span>
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="sd-contenedor" style={{ position: 'relative' }}>
      <input type="hidden" name="direccion" value={texto} />
      <input type="hidden" name="ciudad" value={ciudad} />
      <input type="hidden" name="latitud" value={lat ?? ''} />
      <input type="hidden" name="longitud" value={lon ?? ''} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
        <label
          htmlFor="sd-input"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          <MapPin size={15} color="#ec4899" />
          <span>Dirección habitual</span>
          <span style={{ color: '#7a7a9e', fontWeight: 400, fontSize: '0.78rem' }}>(opcional)</span>
        </label>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
          padding: '0.18rem 0.52rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        }}>
          🔒 Solo visible para ti y tus amigos
        </span>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id="sd-input"
          ref={inputRef}
          type="text"
          value={texto}
          onChange={handleChange}
          onFocus={() => {
            calcularPosicion();
            if (sugerencias.length > 0) setAbierto(true);
          }}
          placeholder="Escribe tu calle, número o barrio..."
          disabled={deshabilitado}
          autoComplete="off"
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${seleccionada ? 'rgba(124,92,252,0.55)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14,
            padding: '0.75rem 2.8rem 0.75rem 1.1rem',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = 'rgba(124,92,252,0.6)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(124,92,252,0.25)';
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = seleccionada ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <div style={{ position: 'absolute', right: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {buscando && (
            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          )}
          {texto && !buscando && (
            <button type="button" onClick={handleLimpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7a9e', padding: '2px', display: 'flex' }}>
              <X size={15} />
            </button>
          )}
          <Search size={16} color="#9898be" />
        </div>
      </div>

      {seleccionada && (
        <p style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          ✓ Dirección validada — la app calculará la distancia real en los planes
        </p>
      )}
      {!seleccionada && (
        <p style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: '#7a7a9e' }}>
          Escribe tu calle y selecciona una sugerencia para calcular la distancia real a los planes.
        </p>
      )}

      {dropdown}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
