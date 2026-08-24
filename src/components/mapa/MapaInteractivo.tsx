'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Locate, Plus, Minus, Layers, Compass, RefreshCw, MapPin } from 'lucide-react';
import { obtenerDetallesCategoria } from '@/lib/geo';

export interface PuntoMapa {
  id: string;
  nombre: string;
  categoria?: string;
  latitud: number;
  longitud: number;
  precio?: number;
  direccion?: string | null;
  foto?: string;
  valoracion?: number;
}

export interface BoundsMapas {
  sur: number;
  norte: number;
  oeste: number;
  este: number;
  zoom: number;
}

export interface DestinoVuelo {
  lat: number;
  lng: number;
  zoom?: number;
  timestamp?: number;
}

export interface PinActivo {
  lat: number;
  lng: number;
  label?: string;
}

interface MapaInteractivoProps {
  lugares?: PuntoMapa[];
  lugarSeleccionadoId?: string | null;
  alSeleccionarLugar?: (lugar: PuntoMapa) => void;
  alHacerClicEnMapa?: (coords: { lat: number; lng: number }) => void;
  pinSeleccionado?: PinActivo | null;
  ubicacionUsuario?: { lat: number; lng: number } | null;
  alCambiarUbicacionUsuario?: (coords: { lat: number; lng: number }) => void;
  alCambiarBounds?: (bounds: BoundsMapas) => void;
  volarA?: DestinoVuelo | null;
  centroInicial?: [number, number]; // [lng, lat]
  zoomInicial?: number;
  altura?: string | number;
  className?: string;
  estiloInicial?: 'voyager' | 'dark';
}

export default function MapaInteractivo({
  lugares = [],
  lugarSeleccionadoId,
  alSeleccionarLugar,
  alHacerClicEnMapa,
  pinSeleccionado,
  ubicacionUsuario,
  alCambiarUbicacionUsuario,
  alCambiarBounds,
  volarA,
  centroInicial = [-3.7038, 40.4168],
  zoomInicial = 14,
  altura = '100%',
  className = '',
  estiloInicial = 'voyager',
}: MapaInteractivoProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const activePinMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [mapaListo, setMapaListo] = useState(false);
  const [estiloMapa, setEstiloMapa] = useState<'voyager' | 'dark'>(estiloInicial);

  const alCambiarBoundsRef = useRef(alCambiarBounds);
  alCambiarBoundsRef.current = alCambiarBounds;

  const alSeleccionarLugarRef = useRef(alSeleccionarLugar);
  alSeleccionarLugarRef.current = alSeleccionarLugar;

  const alHacerClicEnMapaRef = useRef(alHacerClicEnMapa);
  alHacerClicEnMapaRef.current = alHacerClicEnMapa;

  const getStyleSpec = useCallback((estilo: 'voyager' | 'dark'): maplibregl.StyleSpecification => {
    if (estilo === 'voyager') {
      return {
        version: 8,
        sources: {
          'carto-voyager': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap &copy; CARTO',
          },
        },
        layers: [
          {
            id: 'carto-voyager-layer',
            type: 'raster',
            source: 'carto-voyager',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      };
    }

    return {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleSpec(estiloMapa),
      center: centroInicial,
      zoom: zoomInicial,
      attributionControl: false,
    });

    map.on('load', () => {
      setMapaListo(true);
      map.resize();
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (alHacerClicEnMapaRef.current) {
        alHacerClicEnMapaRef.current({ lat, lng });
      }
    });

    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    const handleMoveEnd = () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        if (!alCambiarBoundsRef.current) return;
        const b = map.getBounds();
        alCambiarBoundsRef.current({
          sur: b.getSouth(),
          norte: b.getNorth(),
          oeste: b.getWest(),
          este: b.getEast(),
          zoom: map.getZoom(),
        });
      }, 500);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (moveTimer) clearTimeout(moveTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapaListo || !volarA) return;
    mapRef.current.flyTo({
      center: [volarA.lng, volarA.lat],
      zoom: volarA.zoom || 15.5,
      essential: true,
      duration: 1100,
    });
  }, [volarA, mapaListo]);

  useEffect(() => {
    const currentMap = mapRef.current;
    if (!currentMap || !mapaListo) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    lugares.forEach((lugar) => {
      const isSelected = lugar.id === lugarSeleccionadoId;
      const categoria = lugar.categoria || 'otro';
      const detalles = obtenerDetallesCategoria(categoria);

      const markerEl = document.createElement('div');
      const bgColor = isSelected ? '#2563eb' : detalles.color || '#6366f1';
      const borderColor = isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)';
      const scaleSize = isSelected ? 1.2 : 1;

      markerEl.innerHTML = `
        <div style="position: relative; width: ${32 * scaleSize}px; height: ${40 * scaleSize}px; cursor: pointer; filter: ${isSelected ? 'drop-shadow(0 8px 12px rgba(37, 99, 235, 0.5))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'};transform: scale(${scaleSize}) translateZ(0);">
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: ${24 * scaleSize}px; height: ${24 * scaleSize}px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: ${10 * scaleSize}px; font-weight: 700;">
            ${detalles.emoji}
          </div>
          <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%) translateY(0); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid ${bgColor};"></div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: markerEl, anchor: 'top' })
        .setLngLat([lugar.longitud, lugar.latitud])
        .addTo(currentMap);

      markerEl.title = lugar.nombre;
      markerEl.style.transition = 'transform 0.2s ease-in-out';

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (alSeleccionarLugarRef.current) {
          alSeleccionarLugarRef.current(lugar);
        }
      });

      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.15)';
      });
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
      });

      markersRef.current[lugar.id] = marker;
    });
  }, [lugares, lugarSeleccionadoId, mapaListo]);

  useEffect(() => {
    const currentMap = mapRef.current;
    if (!currentMap || !mapaListo) return;

    if (ubicacionUsuario) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([ubicacionUsuario.lng, ubicacionUsuario.lat]);
      } else {
        const userEl = document.createElement('div');
        userEl.innerHTML = `
          <div style="position: relative; width: 40px; height: 40px; cursor: pointer;">
            <div style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.2); border: 2px solid #3b82f6; border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="position: absolute; top: 8px; left: 8px; width: 24px; height: 24px; background: #3b82f6; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);"></div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: userEl, anchor: 'center' })
          .setLngLat([ubicacionUsuario.lng, ubicacionUsuario.lat])
          .addTo(currentMap);

        userMarkerRef.current = marker;
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [ubicacionUsuario, mapaListo]);

  useEffect(() => {
    const currentMap = mapRef.current;
    if (!currentMap || !mapaListo) return;

    if (pinSeleccionado) {
      if (activePinMarkerRef.current) {
        activePinMarkerRef.current.setLngLat([pinSeleccionado.lng, pinSeleccionado.lat]);
      } else {
        const pinEl = document.createElement('div');
        pinEl.innerHTML = `
          <div style="position: relative; width: 34px; height: 34px; cursor: pointer;">
            <div style="position: absolute; inset: 0; background: rgba(234, 67, 53, 0.4); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 2px; left: 2px; width: 30px; height: 30px; background: #ea4335; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(234, 67, 53, 0.7); display: flex; align-items: center; justify-content: center;">
              <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: pinEl, anchor: 'bottom' })
          .setLngLat([pinSeleccionado.lng, pinSeleccionado.lat])
          .addTo(currentMap);

        activePinMarkerRef.current = marker;
      }
    } else if (activePinMarkerRef.current) {
      activePinMarkerRef.current.remove();
      activePinMarkerRef.current = null;
    }
  }, [pinSeleccionado, mapaListo]);

  const alternarEstilo = useCallback(() => {
    const nuevoEstilo = estiloMapa === 'voyager' ? 'dark' : 'voyager';
    setEstiloMapa(nuevoEstilo);
    if (mapRef.current) {
      mapRef.current.setStyle(getStyleSpec(nuevoEstilo));
    }
  }, [estiloMapa, getStyleSpec]);

  const detectarUbicacionUsuario = useCallback(() => {
    if (!navigator.geolocation) return;

    setCargandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (alCambiarUbicacionUsuario) {
          alCambiarUbicacionUsuario(coords);
        }

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 15,
            duration: 1200,
          });
        }
        setCargandoUbicacion(false);
      },
      () => { setCargandoUbicacion(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [alCambiarUbicacionUsuario]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: typeof altura === 'number' ? `${altura}px` : altura,
        overflow: 'hidden',
        backgroundColor: '#e5e7eb',
      }}
      className={className}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={alternarEstilo}
          title="Cambiar vista de mapa"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            color: '#1e1b4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          }}
        >
          <Layers size={15} />
        </button>

        <button
          type="button"
          onClick={detectarUbicacionUsuario}
          disabled={cargandoUbicacion}
          title="Mi ubicación"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          }}
        >
          <Locate size={15} className={cargandoUbicacion ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '10px 10px 4px 4px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            color: '#1e1b4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          }}
        >
          <Plus size={15} />
        </button>

        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '4px 4px 10px 10px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0,0,0,0.12)',
            marginTop: '-0.3rem',
            color: '#1e1b4b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          }}
        >
          <Minus size={15} />
        </button>
      </div>
      <div
        style={{
          position: 'absolute',
          top: '0.85rem',
          left: '0.85rem',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          borderRadius: 20,
          padding: '0.35rem 0.8rem',
          fontSize: '0.74rem',
          fontWeight: 700,
          color: '#1e1b4b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ea4335', display: 'inline-block' }}></span>
        <span>Haz clic en cualquier punto del mapa para seleccionarlo</span>
      </div>
    </div>
  );
}
