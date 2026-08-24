'use client';

import React, { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import {
  X,
  Search,
  MapPin,
  ExternalLink,
  Loader2,
  ChevronRight,
  Globe,
  Compass,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CATEGORIAS_LUGARES,
  FOTOS_POR_DEFECTO_CATEGORIA,
  inferirCategoriaPorTexto,
  inferirPrecioPorCategoria,
  obtenerDetallesCategoria,
} from '@/lib/geo';
import { añadirLugarAlPlan } from '@/app/actions/lugares';
import toast from 'react-hot-toast';

const MapaInteractivo = dynamic(() => import('@/components/mapa/MapaInteractivo'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f1c', color: '#a78bfa' }}>
      <Loader2 size={24} className="animate-spin" />
      <span style={{ fontSize: '0.9rem', fontWeight: 700, marginLeft: '0.6rem' }}>Cargando mapa interactivo…</span>
    </div>
  ),
});

interface ModalExplorarLugaresProps {
  planId: string;
  lugaresExistentesIds: string[];
  abierto: boolean;
  alCerrar: () => void;
  alLugarAñadido?: () => void;
  modoSeleccion?: boolean; // Si true, solo selecciona sin guardar en BD
  lugarInicial?: {
    nombre: string;
    direccion?: string | null;
    categoria?: string;
    precio?: string;
    lat?: number;
    lng?: number;
    link_maps?: string | null;
  } | null;
  alSeleccionarLugar?: (datos: {
    nombre: string;
    direccion: string | null;
    categoria: string;
    precio: string;
    lat: number;
    lng: number;
    link_maps?: string | null;
  }) => void;
}

export default function ModalExplorarLugares({
  planId,
  lugaresExistentesIds = [],
  abierto,
  alCerrar,
  alLugarAñadido,
  modoSeleccion = false,
  lugarInicial = null,
  alSeleccionarLugar,
}: ModalExplorarLugaresProps) {
  const [mounted, setMounted] = useState(false);

  const [tipoVistaMapa, setTipoVistaMapa] = useState<'google' | 'interactivo'>('google');

  const [panelAbierto, setPanelAbierto] = useState(true);

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [lugarEnMapa, setLugarEnMapa] = useState('España');
  const [nombreLugar, setNombreLugar] = useState('');
  const [categoria, setCategoria] = useState('ocio');
  const [direccion, setDireccion] = useState('');
  const [precioEstimado, setPrecioEstimado] = useState('25');
  const [linkGoogleMaps, setLinkGoogleMaps] = useState('');
  const [latitudSeleccionada, setLatitudSeleccionada] = useState<number>(40.4168);
  const [longitudSeleccionada, setLongitudSeleccionada] = useState<number>(-3.7038);
  const [volarA, setVolarA] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const [sugerenciasOnline, setSugerenciasOnline] = useState<any[]>([]);
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const esEscrituraManualRef = useRef(false);

  const [isPending, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!abierto) return;

    esEscrituraManualRef.current = false;
    if (lugarInicial) {
      setTextoBusqueda(lugarInicial.nombre || '');
      setLugarEnMapa(lugarInicial.nombre || 'España');
      setNombreLugar(lugarInicial.nombre || '');
      setCategoria(lugarInicial.categoria || 'restaurante');
      setDireccion(lugarInicial.direccion || '');
      setPrecioEstimado(lugarInicial.precio || inferirPrecioPorCategoria(lugarInicial.categoria || 'restaurante'));
      setLinkGoogleMaps(lugarInicial.link_maps || '');
      setLatitudSeleccionada(lugarInicial.lat || 40.4168);
      setLongitudSeleccionada(lugarInicial.lng || -3.7038);
      if (lugarInicial.lat && lugarInicial.lng) {
        setVolarA({ lat: lugarInicial.lat, lng: lugarInicial.lng, zoom: 15 });
      }
    } else {
      setTextoBusqueda('');
      setLugarEnMapa('España');
      setNombreLugar('');
      setCategoria('ocio');
      setDireccion('');
      setPrecioEstimado(inferirPrecioPorCategoria('ocio'));
      setLinkGoogleMaps('');
      setLatitudSeleccionada(40.4168);
      setLongitudSeleccionada(-3.7038);
    }
    setSugerenciasOnline([]);
    setMostrarDropdown(false);
    setPanelAbierto(true);
  }, [abierto, lugarInicial]);

  useEffect(() => {
    if (!esEscrituraManualRef.current) {
      return;
    }

    if (!textoBusqueda || textoBusqueda.trim().length < 2) {
      setSugerenciasOnline([]);
      setMostrarDropdown(false);
      return;
    }

    const t = setTimeout(async () => {
      setBuscandoSugerencias(true);
      try {
        const res = await fetch(`/api/nominatim?q=${encodeURIComponent(textoBusqueda.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSugerenciasOnline(data.slice(0, 6));
            if (esEscrituraManualRef.current) {
              setMostrarDropdown(true);
            }
          } else {
            setSugerenciasOnline([]);
          }
        }
      } catch {
        setSugerenciasOnline([]);
      }
      setBuscandoSugerencias(false);
    }, 220);

    return () => clearTimeout(t);
  }, [textoBusqueda]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
        esEscrituraManualRef.current = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const aplicarLugar = useCallback((
    nombre: string,
    dir?: string,
    catManual?: string,
    precioManual?: string,
    lat?: number | null,
    lng?: number | null
  ) => {
    esEscrituraManualRef.current = false;
    setMostrarDropdown(false);
    setSugerenciasOnline([]);
    setPanelAbierto(true);

    const q = nombre.trim();
    if (!q) return;

    const cat = catManual || inferirCategoriaPorTexto(`${q} ${dir || ''}`);
    const precio = precioManual !== undefined ? precioManual : inferirPrecioPorCategoria(cat);
    const latFinal = typeof lat === 'number' && Number.isFinite(lat) ? lat : 40.4168;
    const lngFinal = typeof lng === 'number' && Number.isFinite(lng) ? lng : -3.7038;

    const queryMapa = dir ? `${q}, ${dir.split(',').slice(0, 2).join(',')}` : q;

    setLugarEnMapa(queryMapa);
    setNombreLugar(q);
    setCategoria(cat);
    setDireccion(dir || `${q}, España`);
    setPrecioEstimado(precio);
    setTextoBusqueda(q);
    setLatitudSeleccionada(latFinal);
    setLongitudSeleccionada(lngFinal);
    setVolarA({ lat: latFinal, lng: lngFinal, zoom: 15.5 });
  }, []);

  const handleSeleccionarSugerenciaOnline = (item: any) => {
    esEscrituraManualRef.current = false;
    setMostrarDropdown(false);
    const nombre = item.name || item.display_name.split(',')[0];
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    aplicarLugar(nombre, item.display_name, undefined, undefined, lat, lng);
  };

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    esEscrituraManualRef.current = false;
    setMostrarDropdown(false);
    if (!textoBusqueda.trim()) return;
    if (sugerenciasOnline.length > 0) {
      handleSeleccionarSugerenciaOnline(sugerenciasOnline[0]);
    } else {
      aplicarLugar(textoBusqueda);
    }
  };

  const handleClicEnMapaInteractivo = async (coords: { lat: number; lng: number }) => {
    esEscrituraManualRef.current = false;
    setMostrarDropdown(false);
    setSugerenciasOnline([]);
    setPanelAbierto(true);

    setLatitudSeleccionada(coords.lat);
    setLongitudSeleccionada(coords.lng);
    setVolarA({ lat: coords.lat, lng: coords.lng });

    try {
      const res = await fetch(`/api/reverse?lat=${coords.lat}&lon=${coords.lng}`);
      if (res.ok) {
        const data = await res.json();
        const nom = data.nombre || 'Ubicación en el mapa';
        const dir = data.direccion || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
        const cat = inferirCategoriaPorTexto(`${nom} ${dir}`);
        setNombreLugar(nom);
        setTextoBusqueda(nom);
        setDireccion(dir);
        setCategoria(cat);
        setPrecioEstimado(inferirPrecioPorCategoria(cat));
        setLugarEnMapa(dir);
      }
    } catch {
      const nom = `Punto (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`;
      setNombreLugar(nom);
      setTextoBusqueda(nom);
      setDireccion('España');
    }
  };

  const handleLimpiarBusqueda = () => {
    setTextoBusqueda('');
    setSugerenciasOnline([]);
    setMostrarDropdown(false);
    esEscrituraManualRef.current = false;
  };

  const handleAñadirAlPlan = () => {
    if (!nombreLugar.trim()) {
      toast.error('Escribe o busca el nombre del lugar');
      return;
    }

    const latFinal = Number.isFinite(latitudSeleccionada) ? latitudSeleccionada : 40.4168;
    const lngFinal = Number.isFinite(longitudSeleccionada) ? longitudSeleccionada : -3.7038;
    const urlFinal = linkGoogleMaps.trim() || null;

    if (modoSeleccion && alSeleccionarLugar) {
      alSeleccionarLugar({
        nombre: nombreLugar.trim(),
        direccion: direccion.trim() || null,
        categoria,
        precio: precioEstimado,
        lat: latFinal,
        lng: lngFinal,
        link_maps: urlFinal,
      });
      toast.success(`"${nombreLugar}" guardado en el plan 📍`);
      alCerrar();
      return;
    }

    const fotos = FOTOS_POR_DEFECTO_CATEGORIA[categoria] || FOTOS_POR_DEFECTO_CATEGORIA.restaurante;
    const precioNum = Number(precioEstimado) || 0;

    startTransition(async () => {
      const res = await añadirLugarAlPlan(planId, {
        nombre: nombreLugar.trim(),
        categoria,
        nivel_precio: precioNum === 0 ? 0 : precioNum > 30 ? 3 : 2,
        coste_estimado_por_persona: precioNum,
        direccion: direccion.trim() ? direccion.trim() : null,
        sitio_web: urlFinal,
        latitud: latFinal,
        longitud: lngFinal,
        fotos: [fotos[0]],
      });
      if (res.success) {
        toast.success(`"${nombreLugar}" añadido al plan 📍`);
        if (alLugarAñadido) alLugarAñadido();
        alCerrar();
      } else {
        toast.error(res.error || 'No se pudo añadir el lugar');
      }
    });
  };

  if (!abierto || !mounted) return null;

  const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    lugarEnMapa && lugarEnMapa !== 'España' ? lugarEnMapa : nombreLugar ? `${nombreLugar} ${direccion || ''}` : 'España'
  )}&output=embed`;

  const googleMapsExternalUrl = linkGoogleMaps.trim()
    ? linkGoogleMaps.trim()
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        nombreLugar ? `${nombreLugar} ${direccion || ''}` : lugarEnMapa || 'España'
      )}`;

  const catDetalles = obtenerDetallesCategoria(categoria);

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={alCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up"
        style={{
          width: '96vw',
          maxWidth: 1180,
          height: '90vh',
          maxHeight: 820,
          backgroundColor: '#0f0f1c',
          border: '1px solid rgba(124, 92, 252, 0.35)',
          borderRadius: 24,
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: 'rgba(15,15,28,0.98)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ea4335, #4285f4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(66,133,244,0.4)',
                flexShrink: 0,
              }}
            >
              🗺️
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                Buscador de Lugares con Google Maps
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#9898be', margin: '0.2rem 0 0' }}>
                Busca cualquier sitio o haz clic en el mapa para sincronizarlo al instante
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={alCerrar}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: '#0d0d18',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)';
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0d0d18';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={17} />
          </button>
        </div>
        <div
          ref={dropdownRef}
          style={{
            padding: '0.9rem 1.5rem',
            backgroundColor: 'rgba(12,12,22,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            zIndex: 50,
          }}
        >
          <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '0.6rem' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '1.1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#4285f4',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={textoBusqueda}
                onChange={(e) => {
                  esEscrituraManualRef.current = true;
                  setTextoBusqueda(e.target.value);
                  if (e.target.value.trim().length >= 2) {
                    setNombreLugar(e.target.value);
                  }
                }}
                onFocus={() => {
                  if (sugerenciasOnline.length > 0 && esEscrituraManualRef.current) {
                    setMostrarDropdown(true);
                  }
                }}
                placeholder="Escribe un restaurante, local, parque, laguna, estadio, bar o dirección..."
                className="input"
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: textoBusqueda ? '4.5rem' : '2.5rem',
                  height: 46,
                  fontSize: '0.95rem',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(66,133,244,0.45)',
                  borderRadius: 14,
                  color: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {buscandoSugerencias && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ color: '#4285f4' }}
                  />
                )}
                {textoBusqueda && (
                  <button
                    type="button"
                    onClick={handleLimpiarBusqueda}
                    title="Limpiar búsqueda"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      border: 'none',
                      color: '#c4b5fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              style={{
                height: 46,
                padding: '0 1.4rem',
                fontWeight: 800,
                fontSize: '0.92rem',
                borderRadius: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#0d0d18',
                border: '1px solid rgba(124, 92, 252, 0.65)',
                color: '#ffffff',
                flexShrink: 0,
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 92, 252, 0.45)';
                e.currentTarget.style.backgroundColor = '#7c5cfc';
                e.currentTarget.style.borderColor = '#7c5cfc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '#0d0d18';
                e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.65)';
              }}
            >
              <Search size={16} />
              <span>Buscar</span>
            </button>
          </form>
          {mostrarDropdown && sugerenciasOnline.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '1.5rem',
                right: '7.5rem',
                marginTop: '0.4rem',
                backgroundColor: '#16162a',
                border: '1px solid rgba(66,133,244,0.4)',
                borderRadius: 14,
                boxShadow: '0 15px 40px rgba(0,0,0,0.9)',
                overflow: 'hidden',
                zIndex: 100,
                maxHeight: 290,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '0.5rem 0.9rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9898be', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sugerencias encontradas ({sugerenciasOnline.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarDropdown(false);
                    esEscrituraManualRef.current = false;
                  }}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#f87171',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.4rem',
                    borderRadius: 6,
                  }}
                >
                  <span>✕ Cerrar</span>
                </button>
              </div>

              <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                {sugerenciasOnline.map((item, idx) => {
                  const nombre = item.name || item.display_name.split(',')[0];
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSeleccionarSugerenciaOnline(item)}
                      style={{
                        padding: '0.75rem 1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: idx < sugerenciasOnline.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(66,133,244,0.18)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                        <MapPin size={15} color="#ea4335" style={{ flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {nombre}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#9898be', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.display_name}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={15} color="#4285f4" style={{ flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            flexGrow: 1,
            display: 'grid',
            gridTemplateColumns: panelAbierto ? 'minmax(350px, 1fr) 380px' : '1fr',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <div style={{ flexGrow: 1, position: 'relative', backgroundColor: '#090910', minHeight: 0 }}>
              {tipoVistaMapa === 'google' ? (
                <iframe
                  title={`Google Maps - ${nombreLugar || lugarEnMapa}`}
                  src={googleMapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <MapaInteractivo
                  altura="100%"
                  centroInicial={[longitudSeleccionada, latitudSeleccionada]}
                  volarA={volarA}
                  pinSeleccionado={{
                    lat: latitudSeleccionada,
                    lng: longitudSeleccionada,
                    label: nombreLugar || 'Lugar seleccionado',
                  }}
                  alHacerClicEnMapa={handleClicEnMapaInteractivo}
                />
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.65rem',
                zIndex: 25,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(124, 92, 252, 0.45)',
                  borderRadius: 14,
                  padding: '0.35rem',
                  gap: '0.35rem',
                  pointerEvents: 'auto',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTipoVistaMapa('google')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 1rem',
                    borderRadius: 10,
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: tipoVistaMapa === 'google' ? '#7c5cfc' : 'transparent',
                    backgroundColor: tipoVistaMapa === 'google' ? '#7c5cfc' : 'transparent',
                    color: '#ffffff',
                    boxShadow: tipoVistaMapa === 'google' ? '0 4px 14px rgba(124, 92, 252, 0.5)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (tipoVistaMapa !== 'google') {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 92, 252, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tipoVistaMapa !== 'google') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <Globe size={15} />
                  <span>Google Maps</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoVistaMapa('interactivo')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 1rem',
                    borderRadius: 10,
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: tipoVistaMapa === 'interactivo' ? '#7c5cfc' : 'transparent',
                    backgroundColor: tipoVistaMapa === 'interactivo' ? '#7c5cfc' : 'transparent',
                    color: '#ffffff',
                    boxShadow: tipoVistaMapa === 'interactivo' ? '0 4px 14px rgba(124, 92, 252, 0.5)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (tipoVistaMapa !== 'interactivo') {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 92, 252, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tipoVistaMapa !== 'interactivo') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <Compass size={15} />
                  <span>Mapa con clics</span>
                </button>
              </div>
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: 14,
                  backgroundColor: '#0d0d18',
                  border: '1px solid rgba(124, 92, 252, 0.55)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  pointerEvents: 'auto',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85)',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c5cfc';
                  e.currentTarget.style.borderColor = '#7c5cfc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(124, 92, 252, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d18';
                  e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.55)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.85)';
                }}
              >
                <span>Abrir en Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>
            {!panelAbierto && (
              <button
                type="button"
                onClick={() => setPanelAbierto(true)}
                style={{
                  position: 'absolute',
                  bottom: '1.25rem',
                  right: '1.25rem',
                  padding: '0.7rem 1.25rem',
                  borderRadius: 14,
                  backgroundColor: '#7c5cfc',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(124,92,252,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  zIndex: 30,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 14px 36px rgba(124,92,252,0.8)';
                  e.currentTarget.style.backgroundColor = '#6d46fc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(124,92,252,0.6)';
                  e.currentTarget.style.backgroundColor = '#7c5cfc';
                }}
              >
                <SlidersHorizontal size={16} />
                <span>Datos del lugar</span>
              </button>
            )}
          </div>
          {panelAbierto && (
            <div
              style={{
                padding: '1.4rem 1.6rem',
                backgroundColor: '#0a0a15',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.2rem',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c5cfc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} /> Lugar a guardar en el plan
                  </span>
                  <button
                    type="button"
                    onClick={() => setPanelAbierto(false)}
                    title="Cerrar panel de datos para ver mapa completo"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.25)';
                      e.currentTarget.style.color = '#f87171';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '0.3rem' }}>
                      Nombre del lugar o sitio *
                    </label>
                    <input
                      type="text"
                      value={nombreLugar}
                      onChange={(e) => {
                        setNombreLugar(e.target.value);
                        if (!textoBusqueda) setTextoBusqueda(e.target.value);
                      }}
                      placeholder="Ej: Laguna de La Mermejuela, Restaurante..."
                      className="input"
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(124, 92, 252, 0.35)',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '0.3rem' }}>
                      Categoría del sitio
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => {
                        setCategoria(e.target.value);
                        setPrecioEstimado(inferirPrecioPorCategoria(e.target.value));
                      }}
                      className="input"
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: '#131326',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {CATEGORIAS_LUGARES.filter((c) => c.id !== 'todas').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '0.3rem' }}>
                      Dirección, Ciudad o Municipio
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: 45830 Miguel Esteban, Toledo, España"
                      className="input"
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        fontSize: '0.85rem',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '0.3rem' }}>
                      Link de Google Maps <span style={{ color: '#7070a0', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input
                      type="url"
                      value={linkGoogleMaps}
                      onChange={(e) => setLinkGoogleMaps(e.target.value)}
                      placeholder="Ej: https://maps.app.goo.gl/..."
                      className="input"
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        fontSize: '0.85rem',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 10,
                      backgroundColor: 'rgba(124, 92, 252, 0.08)',
                      border: '1px solid rgba(124, 92, 252, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: '#9898be' }}>
                      GPS: <span style={{ color: '#ffffff', fontWeight: 600 }}>{latitudSeleccionada.toFixed(4)}, {longitudSeleccionada.toFixed(4)}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700 }}>
                      {catDetalles.label}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={handleAñadirAlPlan}
                  disabled={isPending || !nombreLugar.trim()}
                  style={{
                    width: '100%',
                    height: 50,
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#0d0d18',
                    border: '1px solid rgba(124, 92, 252, 0.75)',
                    color: '#ffffff',
                    opacity: !nombreLugar.trim() ? 0.5 : 1,
                    cursor: !nombreLugar.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (nombreLugar.trim() && !isPending) {
                      e.currentTarget.style.backgroundColor = '#7c5cfc';
                      e.currentTarget.style.borderColor = '#7c5cfc';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 92, 252, 0.55)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d0d18';
                    e.currentTarget.style.borderColor = 'rgba(124, 92, 252, 0.75)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span>AÑADIR LUGAR</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
