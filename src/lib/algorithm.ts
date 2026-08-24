import { Lugar, Preferencias, Disponibilidad } from '@/types/database';

export interface EntradaMiembro {
  miembroId: string;
  preferencias?: Preferencias;
  disponibilidades?: Disponibilidad[];
}

export function calcularCompatibilidad(
  lugar: Lugar,
  miembros: EntradaMiembro[],
  fechaObjetivo?: string
): number {
  if (!miembros || miembros.length === 0) return 100;

  let puntuacionDisponibilidad = 100;
  if (fechaObjetivo) {
    let miembrosDisponibles = 0;
    miembros.forEach((m) => {
      const match = m.disponibilidades?.find(
        (d) => d.fecha === fechaObjetivo && d.esta_disponible
      );
      if (match) miembrosDisponibles++;
    });
    puntuacionDisponibilidad = (miembrosDisponibles / miembros.length) * 100;
  }

  let sumaPuntuacionPresupuesto = 0;
  miembros.forEach((m) => {
    const presupuestoMax = m.preferencias?.presupuesto_maximo || 30;
    const coste = lugar.coste_estimado_por_persona || 20;
    if (coste <= presupuestoMax) {
      sumaPuntuacionPresupuesto += 100;
    } else {
      const exceso = (coste - presupuestoMax) / presupuestoMax;
      const score = Math.max(0, 100 - exceso * 100);
      sumaPuntuacionPresupuesto += score;
    }
  });
  const puntuacionPresupuesto = sumaPuntuacionPresupuesto / miembros.length;

  let sumaPuntuacionPreferencias = 0;
  miembros.forEach((m) => {
    const categorias = m.preferencias?.categorias_preferidas || [];
    if (categorias.length === 0) {
      sumaPuntuacionPreferencias += 80; // Abierto a opciones
    } else {
      const coincide = categorias.some(
        (c) =>
          c.toLowerCase().includes(lugar.categoria.toLowerCase()) ||
          lugar.categoria.toLowerCase().includes(c.toLowerCase())
      );
      sumaPuntuacionPreferencias += coincide ? 100 : 30;
    }
  });
  const puntuacionPreferencias = sumaPuntuacionPreferencias / miembros.length;

  let sumaPuntuacionDistancia = 0;
  miembros.forEach((m) => {
    const maxDist = m.preferencias?.distancia_maxima_km || 15;
    if (m.preferencias?.latitud_usuario && m.preferencias?.longitud_usuario) {
      const dist = calcularDistanciaHaversine(
        m.preferencias.latitud_usuario,
        m.preferencias.longitud_usuario,
        lugar.latitud,
        lugar.longitud
      );
      if (dist <= maxDist) {
        sumaPuntuacionDistancia += 100;
      } else {
        const exceso = (dist - maxDist) / maxDist;
        sumaPuntuacionDistancia += Math.max(0, 100 - exceso * 100);
      }
    } else {
      sumaPuntuacionDistancia += 90; // Default favorable si no proporciona coordenadas
    }
  });
  const puntuacionDistancia = sumaPuntuacionDistancia / miembros.length;

  const total =
    0.4 * puntuacionDisponibilidad +
    0.25 * puntuacionPresupuesto +
    0.2 * puntuacionPreferencias +
    0.15 * puntuacionDistancia;

  return Math.round(total);
}

function calcularDistanciaHaversine(
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
  return R * c;
}
