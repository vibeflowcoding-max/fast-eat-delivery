import { Platform } from 'react-native';

export interface RouteResult {
    distanceKm: number;
    durationMin: number;
    isBackendRoute: boolean;
    error?: string;
    label?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Haversine formula — straight-line distance between two lat/lng points (km).
 * Used as a reliable fallback when the API call fails or key is missing.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fallback(lat1: number, lng1: number, lat2: number, lng2: number, errorCode?: string): RouteResult {
    const distanceKm = parseFloat(haversineKm(lat1, lng1, lat2, lng2).toFixed(1));
    return {
        distanceKm,
        durationMin: Math.ceil((distanceKm / 30) * 60),
        isBackendRoute: false,
        error: errorCode,
        label: `~${distanceKm} km (estimado)`,
    };
}

export class GoogleMapsService {
    /**
     * Calculates distance and duration between two points.
     *
     * Strategy:
     *  - On web → calls our local Expo API Route (`/maps`) which proxies to Google server-side (no CORS).
     *  - On native → calls Google Maps Distance Matrix API directly.
     *  - If anything fails → falls back to Haversine estimate silently.
     */
    static async calculateRoute(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number
    ): Promise<RouteResult> {
        const origin = `${originLat},${originLng}`;
        const destination = `${destLat},${destLng}`;

        try {
            let data: any;

            if (Platform.OS === 'web') {
                // ── Web: call our Expo API route proxy (server-side, no CORS) ──
                const response = await fetch('/maps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ origin, destination }),
                });
                if (!response.ok) {
                    return fallback(originLat, originLng, destLat, destLng, `PROXY_${response.status}`);
                }
                data = await response.json();
            } else {
                // ── Native: call Google Maps API directly ──
                if (!GOOGLE_MAPS_API_KEY) {
                    return fallback(originLat, originLng, destLat, destLng, 'NO_API_KEY');
                }
                const url =
                    `https://maps.googleapis.com/maps/api/distancematrix/json` +
                    `?origins=${origin}&destinations=${destination}` +
                    `&mode=driving&departure_time=now&traffic_model=best_guess&units=metric` +
                    `&key=${GOOGLE_MAPS_API_KEY}`;
                const response = await fetch(url);
                data = await response.json();
            }

            // ── Parse response ──
            if (data?.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
                const element = data.rows[0].elements[0];
                const durationVal = element.duration_in_traffic?.value || element.duration.value;
                const durationLabel = element.duration_in_traffic?.text || element.duration.text;
                const distanceKm = element.distance.value / 1000;
                return {
                    distanceKm,
                    durationMin: Math.ceil(durationVal / 60),
                    isBackendRoute: true,
                    label: `${element.distance.text}, ${durationLabel}`,
                };
            }

            // API returned but no valid route
            return fallback(originLat, originLng, destLat, destLng, `API_${data?.status ?? 'UNKNOWN'}`);
        } catch {
            return fallback(originLat, originLng, destLat, destLng, 'FETCH_ERROR');
        }
    }
}
