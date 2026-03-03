'use server';

export async function getGoogleMapsDistance(origin: string, destination: string) {
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
        console.error('❌ [GoogleMapsAPI] MISSING API KEY');
        throw new Error('CONFIG_ERROR_NO_API_KEY');
    }

    try {
        // Mode driving and departure_time=now to get traffic if supported
        // traffic_model=best_guess is default, but we'll be explicit.
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&departure_time=now&traffic_model=best_guess&units=metric&key=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
            const element = data.rows[0].elements[0];

            // Use duration_in_traffic if available, otherwise just duration
            const durationVal = element.duration_in_traffic?.value || element.duration.value;
            const durationLabel = element.duration_in_traffic?.text || element.duration.text;
            const distanceKm = element.distance.value / 1000;
            const distanceLabel = element.distance.text;

            const originResolved = data.origin_addresses?.[0];
            const destinationResolved = data.destination_addresses?.[0];

            const result = {
                distanceKm,
                durationMin: Math.ceil(durationVal / 60),
                status: 'SUCCESS',
                label: `${distanceLabel}, ${durationLabel}`,
                resolved: {
                    origin: originResolved,
                    destination: destinationResolved
                }
            };


            return result;
        } else {
            const apiStatus = data.status;
            const elementStatus = data.rows?.[0]?.elements?.[0]?.status;
            console.error('❌ [GoogleMapsAPI] API ERROR:', {
                status: apiStatus,
                elementStatus,
                msg: data.error_message,
                first_row: data.rows?.[0]
            });
            throw new Error(`API_ERROR_${apiStatus}_${elementStatus || 'NO_ELEMENT'}`);
        }
    } catch (error) {
        console.error('❌ [GoogleMapsAPI] Exception:', error);
        throw error;
    }
}
