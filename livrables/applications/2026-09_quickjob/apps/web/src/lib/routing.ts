/**
 * Itinéraire réel (réseau routier) via le serveur de démo public OSRM —
 * gratuit, sans clé API. C'est une instance de démo partagée, pas prévue
 * pour un fort trafic de production ; largement suffisant au stade actuel.
 */
export interface RouteResult {
  /** Points du tracé en [latitude, longitude], prêts pour Leaflet. */
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }>;
}

export async function fetchRoute(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): Promise<RouteResult | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const body = (await response.json()) as OsrmResponse;
    const route = body.routes?.[0];
    if (body.code !== 'Ok' || !route) return null;

    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch {
    return null;
  }
}
