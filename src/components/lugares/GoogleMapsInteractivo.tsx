'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface GoogleMapsInteractivoProps {
  ubicacionInicial?: { lat: number; lng: number };
  busqueda?: string;
  onLugarSeleccionado?: (lugar: {
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
    tipo?: string;
  }) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function GoogleMapsInteractivo({
  ubicacionInicial = { lat: 40.4168, lng: -3.7038 },
  busqueda = 'Madrid',
  onLugarSeleccionado,
}: GoogleMapsInteractivoProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const searchBoxRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!GOOGLE_MAPS_API_KEY) {
      setErrorMapa('API key de Google Maps no configurada');
      setCargando(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=es`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google || !mapContainerRef.current) return;

      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: ubicacionInicial,
          zoom: 15,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
        });

        mapRef.current = map;
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Busca un lugar...';
        input.value = busqueda;
        input.style.cssText = `
          position: absolute;
          top: 10px;
          left: 10px;
          width: 280px;
          padding: 12px 16px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-family: inherit;
          z-index: 5;
        `;

        map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);

        const searchBox = new window.google.maps.places.SearchBox(input);
        searchBoxRef.current = searchBox;

        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places.length === 0) return;

          const place = places[0];
          if (place.geometry?.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(17);

            if (onLugarSeleccionado) {
              onLugarSeleccionado({
                nombre: place.name || '',
                direccion: place.formatted_address || '',
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                tipo: place.types?.[0],
              });
            }
          }
        });

        const marker = new window.google.maps.Marker({
          position: ubicacionInicial,
          map: map,
          title: busqueda,
        });

        map.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          marker.setPosition(e.latLng);

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat, lng } },
            (results: any[], status: string) => {
              if (status === 'OK' && results[0]) {
                const result = results[0];
                const nombre =
                  result.address_components?.[0]?.long_name ||
                  result.name ||
                  `Punto en el mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

                if (onLugarSeleccionado) {
                  onLugarSeleccionado({
                    nombre: nombre,
                    direccion: result.formatted_address || nombre,
                    lat,
                    lng,
                    tipo: result.types?.[0],
                  });
                }
              }
            }
          );
        });

        setCargando(false);
      } catch (error) {
        console.error('Error inicializando Google Maps:', error);
        setErrorMapa('Error al cargar el mapa');
        setCargando(false);
      }
    };

    script.onerror = () => {
      setErrorMapa('Error al cargar Google Maps API');
      setCargando(false);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#e5e7eb' }}>
      {cargando && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Loader size={28} className="animate-spin" color="#ffffff" />
            <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 600 }}>Cargando mapa...</span>
          </div>
        </div>
      )}
      {errorMapa && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fee2e2',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center', color: '#dc2626' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Error</div>
            <div>{errorMapa}</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: '#991b1b' }}>
              Verifica que NEXT_PUBLIC_GOOGLE_MAPS_API_KEY esté configurada en .env.local
            </div>
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
        }}
      />
    </div>
  );
}
