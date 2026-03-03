import { GoogleMapsService, RouteResult } from '@/services/google-maps.service';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

export function estimateETA(distanceKm: number, averageSpeedKmh: number = 30): number {
    // Returns ETA in minutes
    return Math.ceil((distanceKm / averageSpeedKmh) * 60);
}

/**
 * Formats duration in minutes into a human-readable string (e.g., 5h 39m or 45m).
 */
export function formatDuration(minutes: number | null): string {
    if (minutes === null || minutes <= 0) return '--';

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
}

/**
 * Unified method to get distance and duration.
 * Attempts to use Google Maps first, then Haversine.
 */
export async function getDistanceAndDuration(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): Promise<RouteResult> {
    return GoogleMapsService.calculateRoute(lat1, lng1, lat2, lng2);
}
/**
 * Check if the distance between two points is greater than a threshold in meters.
 * Distance is in KM, so we multiply by 1000.
 */
export function isSignificantMove(
    lat1: number | null | undefined,
    lng1: number | null | undefined,
    lat2: number | null | undefined,
    lng2: number | null | undefined,
    thresholdMeters: number = 100
): boolean {
    if (!lat1 || !lng1 || !lat2 || !lng2) return true;
    const distanceKm = calculateDistanceKm(lat1, lng1, lat2, lng2);
    return (distanceKm * 1000) > thresholdMeters;
}
