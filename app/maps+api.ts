
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function POST(request: Request): Promise<Response> {
    try {
        const { origin, destination } = await request.json();

        if (!origin || !destination) {
            return Response.json(
                { error: 'Origin and destination are required' },
                { status: 400 }
            );
        }

        if (!GOOGLE_MAPS_API_KEY) {
            return Response.json(
                { error: 'Google Maps API key is not configured on the server' },
                { status: 500 }
            );
        }

        const url =
            `https://maps.googleapis.com/maps/api/distancematrix/json` +
            `?origins=${origin}&destinations=${destination}` +
            `&mode=driving&departure_time=now&traffic_model=best_guess&units=metric` +
            `&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        return Response.json(data);
    } catch (error: any) {
        console.error('Error in maps proxy:', error);
        return Response.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
