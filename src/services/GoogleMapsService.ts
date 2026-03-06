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
     *  - On native dev → calls Google Maps Distance Matrix API directly (using PUBLIC key).
     *  - On native prod → calls our local Expo API Route proxy (using PRIVATE key on server).
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

            // ── Strategy: Development (Native) calls directly, Production (All) or Web call proxy ──
            const isProd = !__DEV__;
            const useProxy = Platform.OS === 'web' || isProd;

            if (useProxy) {
                // In production native, we need the full URL. In web, relative is fine.
                const baseUrl = process.env.EXPO_PUBLIC_BASE_URL || '';
                const proxyUrl = Platform.OS === 'web' ? '/maps' : `${baseUrl}/maps`;

                if (Platform.OS !== 'web' && !baseUrl) {
                    console.warn('[GoogleMaps] Missing EXPO_PUBLIC_BASE_URL in production. Falling back to direct call if possible.');
                    if (GOOGLE_MAPS_API_KEY) return this.callDirect(origin, destination, originLat, originLng, destLat, destLng);
                    return fallback(originLat, originLng, destLat, destLng, 'MISSING_PROD_URL');
                }

                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ origin, destination }),
                });
                if (!response.ok) {
                    return fallback(originLat, originLng, destLat, destLng, `PROXY_${response.status}`);
                }
                data = await response.json();
                return this.parseResponse(data, originLat, originLng, destLat, destLng);
            } else {
                return this.callDirect(origin, destination, originLat, originLng, destLat, destLng);
            }
        } catch (e) {
            console.error('[GoogleMaps] Error:', e);
            return fallback(originLat, originLng, destLat, destLng, 'FETCH_ERROR');
        }
    }

    private static async callDirect(
        origin: string,
        destination: string,
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number
    ): Promise<RouteResult> {
        if (!GOOGLE_MAPS_API_KEY) {
            return fallback(originLat, originLng, destLat, destLng, 'NO_API_KEY');
        }
        const url =
            `https://maps.googleapis.com/maps/api/distancematrix/json` +
            `?origins=${origin}&destinations=${destination}` +
            `&mode=driving&departure_time=now&traffic_model=best_guess&units=metric` +
            `&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        return this.parseResponse(data, originLat, originLng, destLat, destLng);
    }

    private static parseResponse(data: any, originLat: number, originLng: number, destLat: number, destLng: number): RouteResult {
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
    }
}
