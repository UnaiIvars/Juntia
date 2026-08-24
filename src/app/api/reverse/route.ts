import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat y lon requeridos' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=es`,
      {
        headers: { 'User-Agent': 'Juntia-App/1.0 (contacto@juntia.app)' },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      
      const nombre =
        data.name ||
        addr.amenity ||
        addr.shop ||
        addr.tourism ||
        addr.leisure ||
        addr.building ||
        addr.road ||
        data.display_name.split(',')[0];

      return NextResponse.json({
        nombre: nombre || 'Lugar seleccionado',
        direccion: data.display_name || 'España',
        tipo: data.type || 'lugar',
        categoria: data.category || 'amenity',
        ciudad: addr.city || addr.town || addr.village || addr.municipality || 'España',
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      });
    }
  } catch (err) {
    console.error('Error en reverse geocode:', err);
  }

  return NextResponse.json({
    nombre: 'Ubicación seleccionada',
    direccion: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
    tipo: 'lugar',
    categoria: 'amenity',
    ciudad: 'España',
    lat: parseFloat(lat),
    lon: parseFloat(lon),
  });
}
