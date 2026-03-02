'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toggleOnline } from '@/actions/driver.actions';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DriverStatusContextType {
    isOnline: boolean;
    isPending: boolean;
    handleToggle: () => void;
}

const DriverStatusContext = createContext<DriverStatusContextType | null>(null);

export function DriverStatusProvider({
    children,
    userId,
    initialIsOnline,
}: {
    children: ReactNode;
    userId: string;
    initialIsOnline: boolean;
}) {
    const [isOnline, setIsOnline] = useState(initialIsOnline);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    // Keep in sync with real-time DB changes (e.g., from another tab or admin)
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`driver-status-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    if (typeof payload.new.is_online === 'boolean') {
                        setIsOnline(payload.new.is_online);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [userId]);

    const handleToggle = useCallback(async () => {
        if (isPending) return;
        setIsPending(true);
        // Optimistic update
        setIsOnline((prev) => !prev);
        try {
            await toggleOnline(userId);
            router.refresh();
        } catch (error) {
            // Revert on failure
            setIsOnline((prev) => !prev);
            console.error('Failed to toggle status:', error);
        } finally {
            setIsPending(false);
        }
    }, [userId, isPending, router]);

    return (
        <DriverStatusContext.Provider value={{ isOnline, isPending, handleToggle }}>
            {children}
        </DriverStatusContext.Provider>
    );
}

export function useDriverStatus(): DriverStatusContextType {
    const context = useContext(DriverStatusContext);
    // Safe fallback when used outside DriverStatusProvider (e.g. profile page, notification handler)
    if (!context) {
        return {
            isOnline: true,
            isPending: false,
            handleToggle: () => { },
        };
    }
    return context;
}
