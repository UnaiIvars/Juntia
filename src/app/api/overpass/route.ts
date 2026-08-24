import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ elements: [] }, { status: 200 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout max

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Juntia-App/1.0 (contacto@juntia.app)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({ elements: [] }, { status: 200 });
  } catch {
    return NextResponse.json({ elements: [] }, { status: 200 });
  }
}
