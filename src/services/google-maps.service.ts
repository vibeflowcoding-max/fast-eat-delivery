import { getGoogleMapsDistance } from '@/actions/google-maps';

export interface RouteResult {
    distanceKm: number;
    durationMin: number;
    isBackendRoute: boolean;
    error?: string;
    label?: string;
}

export class GoogleMapsService {
    /**
     * Calculates distance and duration between two points using Google Maps Distance Matrix API via Server Action.
     * HA VERSINE FALLBACK DISABLED as per user request.
     */
    static async calculateRoute(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number
    ): Promise<RouteResult> {
        try {
            const origin = `${originLat},${originLng}`;
            const destination = `${destLat},${destLng}`;

            const data = await getGoogleMapsDistance(origin, destination);

            return {
                distanceKm: data.distanceKm,
                durationMin: data.durationMin,
                isBackendRoute: true,
                label: data.label
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
            console.error('❌ [GoogleMapsService] API Failure:', errorMessage);

            return {
                distanceKm: 0,
                durationMin: 0,
                isBackendRoute: false,
                error: errorMessage
            };
        }
    }
}
