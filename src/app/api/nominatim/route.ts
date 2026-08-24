import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const query = q.trim();
  const resultadosMap = new Map<string, any>();

  try {
    const wikiSearchUrl = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      query
    )}&limit=5&format=json`;

    const wikiRes = await fetch(wikiSearchUrl, {
      headers: { 'User-Agent': 'Juntia-App/1.0' },
      signal: AbortSignal.timeout(3000),
    });

    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const titulos: string[] = wikiData[1] || [];

      if (titulos.length > 0) {
        const titulosQuery = titulos.slice(0, 4).join('|');
        const detailRes = await fetch(
          `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
            titulosQuery
          )}&prop=coordinates|pageimages|extracts&exintro=1&explaintext=1&pithumbsize=800&redirects=1&format=json`,
          {
            headers: { 'User-Agent': 'Juntia-App/1.0' },
            signal: AbortSignal.timeout(3000),
          }
        );

        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const paginas = Object.values(detailData.query?.pages || {});

          paginas.forEach((p: any) => {
            if (p.coordinates && p.coordinates.length > 0) {
              const coords = p.coordinates[0];
              const pLat = coords.lat;
              const pLon = coords.lon;
              const title = p.title;

              const id = `wiki-${p.pageid || title}`;
              if (!resultadosMap.has(id)) {
                resultadosMap.set(id, {
                  place_id: p.pageid || Math.floor(Math.random() * 1000000),
                  osm_id: p.pageid || 0,
                  osm_type: 'way',
                  lat: pLat.toString(),
                  lon: pLon.toString(),
                  name: title,
                  display_name: `${title}, España`,
                  type: 'monument',
                  class: 'tourism',
                  thumbnail: p.thumbnail?.source || null,
                  extract: p.extract || null,
                  address: {
                    city: 'España',
                    state: 'España',
                    country: 'España',
                  },
                });
              }
            }
          });
        }
      }
    }
  } catch {
  }

  try {
    const photonParams = new URLSearchParams({
      q: query,
      limit: '10',
      lang: 'es',
    });

    if (lat && lon) {
      photonParams.append('lat', lat);
      photonParams.append('lon', lon);
    }

    const photonRes = await fetch(`https://photon.komoot.io/api/?${photonParams}`, {
      headers: { 'User-Agent': 'Juntia-App/1.0' },
      signal: AbortSignal.timeout(3500),
    });

    if (photonRes.ok) {
      const photonData = await photonRes.json();
      const features: any[] = photonData.features || [];

      features.forEach((f, idx) => {
        const props = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const calleConNumero = [props.street, props.housenumber].filter(Boolean).join(' ');
        const name = props.name || calleConNumero || props.district || props.city;

        if (name && coords[0] !== 0) {
          const ciudad = props.city || props.town || props.village || props.district || props.county || props.state || '';
          const partesDir = [
            props.name && props.name !== calleConNumero ? props.name : null,
            calleConNumero || props.street || name,
            props.postcode,
            ciudad,
            props.state !== ciudad ? props.state : null,
            'España',
          ].filter(Boolean);

          const id = `photon-${props.osm_id || idx}-${name}-${ciudad}`;
          if (!resultadosMap.has(id)) {
            resultadosMap.set(id, {
              place_id: props.osm_id || 8000000 + idx,
              osm_id: props.osm_id || idx,
              osm_type: props.osm_type || 'node',
              lat: coords[1].toString(),
              lon: coords[0].toString(),
              name: calleConNumero || name,
              display_name: partesDir.join(', '),
              type: props.osm_value || props.type || 'place',
              class: props.osm_key || 'highway',
              address: {
                road: props.street || name,
                city: ciudad || 'España',
                state: props.state || 'España',
                postcode: props.postcode,
                country: 'España',
              },
            });
          }
        }
      });
    }
  } catch {
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '6',
      'accept-language': 'es',
      countrycodes: 'es',
    });

    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'Juntia-App/1.0 (contacto@juntia.app)' },
      signal: AbortSignal.timeout(3500),
    });

    if (nomRes.ok) {
      const data = await nomRes.json();
      if (Array.isArray(data)) {
        data.forEach((item) => {
          const id = `nom-${item.place_id}`;
          if (!resultadosMap.has(id) && item.name) {
            resultadosMap.set(id, item);
          }
        });
      }
    }
  } catch {
  }

  const resultados = Array.from(resultadosMap.values());
  return NextResponse.json(resultados);
}
