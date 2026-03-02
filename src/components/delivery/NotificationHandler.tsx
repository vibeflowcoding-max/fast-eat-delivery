'use client';

import { useEffect } from 'react';
import { useOrderNotifications } from '@/hooks/use-order-notifications';

export function NotificationHandler() {
    const { requestPermission, isEnabled } = useOrderNotifications();

    useEffect(() => {
        // Proactively request permission on startup if not already granted/denied
        const handleInitialPermission = async () => {
            if ('Notification' in window && Notification.permission === 'default') {
                try {
                    // Delay slightly to not overwhelm the user immediately
                    setTimeout(async () => {
                        await requestPermission();
                    }, 2000);
                } catch (error) {
                    console.error('Error requesting initial notification permission:', error);
                }
            }
        };

        handleInitialPermission();
    }, [requestPermission]);

    // This component doesn't render anything visible
    return null;
}
