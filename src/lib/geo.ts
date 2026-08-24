import { Lugar } from '@/types/database';

export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export function formatearDistancia(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export const CATEGORIAS_LUGARES = [
  { id: 'todas', label: 'Todos los lugares', emoji: '✨', color: '#7c5cfc' },
  { id: 'restaurante', label: 'Restaurantes', emoji: '🍽️', color: '#f59e0b' },
  { id: 'tapas', label: 'Tapas y Bares', emoji: '🍢', color: '#ef4444' },
  { id: 'copas', label: 'Copas y Cócteles', emoji: '🍸', color: '#8b5cf6' },
  { id: 'cafe', label: 'Cafeterías / Brunch', emoji: '☕', color: '#ec4899' },
  { id: 'terraza', label: 'Rooftops y Vistas', emoji: '🌆', color: '#10b981' },
  { id: 'parque', label: 'Parques y Naturaleza', emoji: '🌳', color: '#22c55e' },
  { id: 'cultura', label: 'Museos y Cultura', emoji: '🏛️', color: '#06b6d4' },
  { id: 'monumento', label: 'Monumentos y Turismo', emoji: '🏰', color: '#eab308' },
  { id: 'ocio', label: 'Ocio y Actividades', emoji: '🎳', color: '#3b82f6' },
  { id: 'discoteca', label: 'Fiesta y Discotecas', emoji: '🪩', color: '#a855f7' },
  { id: 'deporte', label: 'Deportes y Estadios', emoji: '⚽', color: '#14b8a6' },
  { id: 'compras', label: 'Mercados y Gastronomía', emoji: '🛍️', color: '#f97316' },
];

export const FOTOS_POR_DEFECTO_CATEGORIA: Record<string, string[]> = {
  restaurante: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  ],
  tapas: [
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
  ],
  copas: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
  ],
  terraza: [
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  ],
  parque: [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
  ],
  cultura: [
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&auto=format&fit=crop&q=80',
  ],
  monumento: [
    'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=800&auto=format&fit=crop&q=80',
  ],
  ocio: [
    'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80',
  ],
  discoteca: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
  ],
  deporte: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
  ],
  compras: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  ],
};

export function obtenerDetallesCategoria(categoria: string) {
  const cat = CATEGORIAS_LUGARES.find(
    (c) =>
      c.id.toLowerCase() === (categoria || '').toLowerCase() ||
      c.label.toLowerCase() === (categoria || '').toLowerCase()
  );
  return (
    cat || {
      id: categoria || 'lugar',
      label: categoria || 'Lugar',
      emoji: '📍',
      color: '#7c5cfc',
    }
  );
}

export function formatearNivelPrecio(nivel: number = 2): string {
  if (nivel <= 0) return 'Gratis';
  const nivelSeguro = Math.max(1, Math.min(4, nivel));
  return '€'.repeat(nivelSeguro);
}

export const LUGARES_SEMILLA: (Omit<Lugar, 'id' | 'creado_en'> & {
  id: string;
  valoracion: number;
})[] = [
  {
    id: 'semilla-1',
    id_externo: 'mad-cibeles',
    nombre: 'La Terraza Cibeles Rooftop',
    categoria: 'terraza',
    nivel_precio: 3,
    coste_estimado_por_persona: 28,
    direccion: 'Plaza de Cibeles, 1, 28014 Madrid',
    latitud: 40.4192,
    longitud: -3.6931,
    telefono: '+34 915 29 82 10',
    sitio_web: 'https://palaciodecibeles.com',
    fotos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.8,
  },
  {
    id: 'semilla-2',
    id_externo: 'mad-grosso',
    nombre: 'Grosso Napoletano Pizza Artesanal',
    categoria: 'restaurante',
    nivel_precio: 2,
    coste_estimado_por_persona: 18,
    direccion: 'Calle de Hermosilla, 85, 28001 Madrid',
    latitud: 40.4268,
    longitud: -3.6784,
    telefono: '+34 911 08 09 10',
    sitio_web: 'https://grossonapoletano.com',
    fotos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.7,
  },
  {
    id: 'semilla-3',
    id_externo: 'mad-retiro',
    nombre: 'Parque de El Retiro & Palacio de Cristal',
    categoria: 'parque',
    nivel_precio: 0,
    coste_estimado_por_persona: 0,
    direccion: 'Plaza de la Independencia, 7, 28001 Madrid',
    latitud: 40.4153,
    longitud: -3.6845,
    telefono: null,
    sitio_web: 'https://www.esmadrid.com/informacion-turistica/parque-del-retiro',
    fotos: [
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.9,
  },
  {
    id: 'semilla-4',
    id_externo: 'mad-prado',
    nombre: 'Museo Nacional del Prado',
    categoria: 'cultura',
    nivel_precio: 2,
    coste_estimado_por_persona: 15,
    direccion: 'Calle de Ruiz de Alarcón, 23, 28014 Madrid',
    latitud: 40.4138,
    longitud: -3.6921,
    telefono: '+34 913 30 28 00',
    sitio_web: 'https://www.museodelprado.es',
    fotos: [
      'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.9,
  },
  {
    id: 'semilla-5',
    id_externo: 'mad-palacio-real',
    nombre: 'Palacio Real de Madrid y Jardines de Sabatini',
    categoria: 'monumento',
    nivel_precio: 2,
    coste_estimado_por_persona: 14,
    direccion: 'Calle de Bailén, s/n, 28071 Madrid',
    latitud: 40.4179,
    longitud: -3.7143,
    telefono: '+34 914 54 87 00',
    sitio_web: 'https://patrimonionacional.es',
    fotos: [
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.8,
  },
  {
    id: 'semilla-6',
    id_externo: 'mad-san-miguel',
    nombre: 'Mercado de San Miguel Gourmet',
    categoria: 'compras',
    nivel_precio: 2,
    coste_estimado_por_persona: 20,
    direccion: 'Plaza de San Miguel, s/n, 28005 Madrid',
    latitud: 40.4153,
    longitud: -3.7089,
    telefono: '+34 915 42 49 36',
    sitio_web: 'https://mercadodesanmiguel.es',
    fotos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.7,
  },
  {
    id: 'semilla-7',
    id_externo: 'mad-debod',
    nombre: 'Templo de Debod y Mirador Atardecer',
    categoria: 'monumento',
    nivel_precio: 0,
    coste_estimado_por_persona: 0,
    direccion: 'Calle de Ferraz, 1, 28008 Madrid',
    latitud: 40.424,
    longitud: -3.7178,
    telefono: null,
    sitio_web: null,
    fotos: [
      'https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.8,
  },
  {
    id: 'semilla-8',
    id_externo: 'mad-salmon',
    nombre: 'Salmon Guru Cocktail Speakeasy',
    categoria: 'copas',
    nivel_precio: 3,
    coste_estimado_por_persona: 22,
    direccion: 'Calle de Echegaray, 21, 28014 Madrid',
    latitud: 40.4149,
    longitud: -3.6997,
    telefono: '+34 910 00 61 85',
    sitio_web: 'https://salmonguru.es',
    fotos: [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.9,
  },
  {
    id: 'semilla-9',
    id_externo: 'mad-toma-cafe',
    nombre: 'Toma Café Specialty & Bakery',
    categoria: 'cafe',
    nivel_precio: 1,
    coste_estimado_por_persona: 6,
    direccion: 'Calle de la Palma, 49, 28004 Madrid',
    latitud: 40.4276,
    longitud: -3.7051,
    telefono: '+34 917 02 56 20',
    sitio_web: 'https://tomacafe.es',
    fotos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.8,
  },
  {
    id: 'semilla-10',
    id_externo: 'mad-bernabeu',
    nombre: 'Estadio Santiago Bernabéu Tour',
    categoria: 'deporte',
    nivel_precio: 3,
    coste_estimado_por_persona: 25,
    direccion: 'Avenida de Concha Espina, 1, 28036 Madrid',
    latitud: 40.4531,
    longitud: -3.6883,
    telefono: '+34 913 98 43 00',
    sitio_web: 'https://www.realmadrid.com/tour-bernabeu',
    fotos: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.8,
  },
  {
    id: 'semilla-11',
    id_externo: 'bcn-sagrada',
    nombre: 'Basílica de la Sagrada Família',
    categoria: 'monumento',
    nivel_precio: 2,
    coste_estimado_por_persona: 26,
    direccion: 'Carrer de Mallorca, 401, 08013 Barcelona',
    latitud: 41.4036,
    longitud: 2.1744,
    telefono: '+34 932 08 04 14',
    sitio_web: 'https://sagradafamilia.org',
    fotos: [
      'https://images.unsplash.com/photo-1583772186714-d8339c09930f?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.9,
  },
  {
    id: 'semilla-12',
    id_externo: 'sev-giralda',
    nombre: 'Catedral de Sevilla y La Giralda',
    categoria: 'monumento',
    nivel_precio: 2,
    coste_estimado_por_persona: 12,
    direccion: 'Avenida de la Constitución, s/n, 41004 Sevilla',
    latitud: 37.3862,
    longitud: -5.9926,
    telefono: '+34 902 09 96 92',
    sitio_web: 'https://catedraldesevilla.es',
    fotos: [
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=80',
    ],
    valoracion: 4.8,
  },
];

export interface ResultadoBusquedaOSM {
  place_id: number;
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  category?: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface OverpassPOI {
  id: string;
  nombre: string;
  categoria: string;
  latitud: number;
  longitud: number;
  direccion?: string | null;
  telefono?: string | null;
  sitio_web?: string | null;
  nivel_precio: number;
  coste_estimado_por_persona: number;
  fotos: string[];
  valoracion: number;
  osmId: number;
  osmType: string;
}

export function inferirCategoriaPorTexto(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes('wizink') || t.includes('arena') || t.includes('pabellon') || t.includes('pabellón') || t.includes('concierto') || t.includes('bowling') || t.includes('escape') || t.includes('cine') || t.includes('ocio') || t.includes('karting') || t.includes('kinepolis') || t.includes('parque warner') || t.includes('portaventura') || t.includes('aquopolis')) return 'ocio';
  if (t.includes('bernabeu') || t.includes('bernabéu') || t.includes('estadio') || t.includes('metropolitano') || t.includes('camp nou') || t.includes('san mames') || t.includes('san mamés') || t.includes('gym') || t.includes('sport') || t.includes('deporte') || t.includes('padel') || t.includes('futbol') || t.includes('fútbol')) return 'deporte';
  if (t.includes('parque') || t.includes('retiro') || t.includes('jardín') || t.includes('jardin') || t.includes('garden') || t.includes('park') || t.includes('casa de campo') || t.includes('playa')) return 'parque';
  if (t.includes('museo') || t.includes('prado') || t.includes('reina sofia') || t.includes('thyssen') || t.includes('guggenheim') || t.includes('museum') || t.includes('teatro') || t.includes('cultura') || t.includes('auditorio') || t.includes('opera') || t.includes('ópera')) return 'cultura';
  if (t.includes('sagrada') || t.includes('familia') || t.includes('palacio') || t.includes('monumento') || t.includes('catedral') || t.includes('iglesia') || t.includes('castillo') || t.includes('alhambra') || t.includes('giralda') || t.includes('mezquita') || t.includes('plaza mayor') || t.includes('puerta del sol') || t.includes('alcala') || t.includes('alcalá') || t.includes('cibeles') || t.includes('debod')) return 'monumento';
  if (t.includes('bar') || t.includes('tapas') || t.includes('taberna') || t.includes('bodega') || t.includes('mesón') || t.includes('meson') || t.includes('cerveceria') || t.includes('cervecería') || t.includes('pinchos') || t.includes('pintxos')) return 'tapas';
  if (t.includes('cafe') || t.includes('café') || t.includes('bakery') || t.includes('panaderia') || t.includes('brunch') || t.includes('pasteleria') || t.includes('coffee') || t.includes('starbucks')) return 'cafe';
  if (t.includes('copas') || t.includes('cocktail') || t.includes('coctel') || t.includes('pub') || t.includes('speakeasy') || t.includes('lounge') || t.includes('chupitos')) return 'copas';
  if (t.includes('rooftop') || t.includes('terraza') || t.includes('mirador') || t.includes('sky')) return 'terraza';
  if (t.includes('kapital') || t.includes('fabrik') || t.includes('club') || t.includes('disco') || t.includes('discoteca') || t.includes('fiesta') || t.includes('shoko') || t.includes('ochoymedio') || t.includes('razzmatazz') || t.includes('pacha')) return 'discoteca';
  if (t.includes('mercado') || t.includes('market') || t.includes('tienda') || t.includes('centro comercial') || t.includes('shopping') || t.includes('san miguel')) return 'compras';
  return 'restaurante';
}

export function inferirPrecioPorCategoria(cat: string): string {
  switch (cat) {
    case 'parque':
    case 'monumento':
      return '0';
    case 'cafe':
      return '6';
    case 'tapas':
    case 'compras':
      return '18';
    case 'restaurante':
      return '22';
    case 'copas':
    case 'discoteca':
    case 'deporte':
    case 'ocio':
      return '25';
    case 'terraza':
      return '28';
    case 'cultura':
      return '15';
    default:
      return '15';
  }
}

export async function buscarPOIsOverpass(
  sur: number,
  norte: number,
  oeste: number,
  este: number,
  categoria?: string
): Promise<OverpassPOI[]> {
  const centroLat = (norte + sur) / 2;
  const centroLon = (este + oeste) / 2;

  const queryMap: Record<string, string[]> = {
    todas: ['restaurante', 'parque', 'museo', 'bar', 'monumento'],
    restaurante: ['restaurante', 'pizzeria', 'hamburgueseria', 'asador'],
    tapas: ['bar de tapas', 'taberna', 'cerveceria'],
    copas: ['cocteleria', 'pub', 'bar de copas'],
    cafe: ['cafeteria', 'brunch', 'specialty coffee'],
    terraza: ['terraza', 'rooftop', 'mirador'],
    parque: ['parque', 'jardin', 'mirador'],
    cultura: ['museo', 'teatro', 'centro cultural', 'galeria'],
    monumento: ['monumento', 'palacio', 'catedral', 'castillo', 'plaza'],
    ocio: ['bolos', 'escape room', 'cine', 'recreativos'],
    discoteca: ['discoteca', 'club nocturno'],
    deporte: ['estadio', 'polideportivo', 'padel'],
    compras: ['mercado', 'centro comercial'],
  };

  const queries = queryMap[categoria || 'todas'] || queryMap['todas'];
  const lugaresMap = new Map<string, OverpassPOI>();

  try {
    const promesas = queries.slice(0, 3).map(async (term) => {
      const params = new URLSearchParams({
        q: term,
        lat: centroLat.toString(),
        lon: centroLon.toString(),
      });
      const res = await fetch(`/api/nominatim?${params.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    });

    const resultadosArrays = await Promise.all(promesas);
    const todosResultados = resultadosArrays.flat();

    todosResultados.forEach((item: ResultadoBusquedaOSM) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);

      if (lat && lon && item.name) {
        const catInferida = categoria && categoria !== 'todas' ? categoria : inferirCategoriaPorTexto(`${item.name} ${item.type || ''}`);
        const fotosCat = FOTOS_POR_DEFECTO_CATEGORIA[catInferida] || FOTOS_POR_DEFECTO_CATEGORIA.restaurante;
        const foto = fotosCat[Math.floor(Math.random() * fotosCat.length)];

        const id = `osm-${item.place_id || Math.abs(lat * lon)}`;
        if (!lugaresMap.has(id)) {
          lugaresMap.set(id, {
            id,
            nombre: item.name,
            categoria: catInferida,
            latitud: lat,
            longitud: lon,
            direccion: item.display_name,
            telefono: null,
            sitio_web: null,
            nivel_precio: catInferida === 'parque' || catInferida === 'monumento' ? 0 : 2,
            coste_estimado_por_persona: catInferida === 'parque' || catInferida === 'monumento' ? 0 : 18,
            fotos: [foto],
            valoracion: parseFloat((4.3 + Math.random() * 0.6).toFixed(1)),
            osmId: item.osm_id || 0,
            osmType: item.osm_type || 'node',
          });
        }
      }
    });
  } catch (err) {
    console.error('Error en búsqueda de lugares:', err);
  }

  LUGARES_SEMILLA.forEach((s) => {
    if (
      s.latitud >= sur - 0.05 &&
      s.latitud <= norte + 0.05 &&
      s.longitud >= oeste - 0.05 &&
      s.longitud <= este + 0.05 &&
      (categoria === 'todas' || !categoria || s.categoria.toLowerCase() === categoria.toLowerCase())
    ) {
      if (!lugaresMap.has(s.id)) {
        lugaresMap.set(s.id, {
          id: s.id,
          nombre: s.nombre,
          categoria: s.categoria,
          latitud: s.latitud,
          longitud: s.longitud,
          direccion: s.direccion,
          telefono: s.telefono,
          sitio_web: s.sitio_web,
          nivel_precio: s.nivel_precio,
          coste_estimado_por_persona: s.coste_estimado_por_persona,
          fotos: s.fotos || [],
          valoracion: s.valoracion,
          osmId: 0,
          osmType: 'node',
        });
      }
    }
  });

  return Array.from(lugaresMap.values());
}
