'use client';
import { useState, useEffect } from 'react';

export function useGeolocation() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setError('Geolocalización no está soportada por tu navegador');
            setIsLoading(false);
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setIsLoading(false);
            },
            {
                enableHighAccuracy: false,
                maximumAge: 30000,
                timeout: 27000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { location, error, isLoading };
}
