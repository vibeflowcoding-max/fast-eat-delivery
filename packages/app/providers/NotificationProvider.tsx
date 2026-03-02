'use client';

import React, { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { OrderService } from '../services/order.service';
import { useRouter } from 'solito/navigation';
import { Toaster, showToast } from './Toaster';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        const setupAudio = async () => {
            try {
                // Only init sound on native
                if (typeof window !== 'undefined' && (window as any).navigator?.userAgent?.includes('Node')) return;

                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                });

                const { sound } = await Audio.Sound.createAsync(
                    require('../assets/sounds/new-order.wav'),
                    { shouldPlay: false }
                );
                soundRef.current = sound;
            } catch (error) {
                console.warn('Notification sound could not be initialized:', error);
            }
        };

        setupAudio();

        const channel = OrderService.subscribeToReadyOrders((payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                // If it's effectively entering Auction (status 7) and delivery is enabled.
                if (payload.new.status_id === 7 && payload.new.delivery_enabled === true) {
                    playSound();
                    showToast(
                        '¡Nueva Orden en Subasta!',
                        'Hay una nueva orden esperando un repartidor.',
                        () => router.push(`/dashboard/orders/${payload.new.id}`)
                    );
                }
            }
        });

        return () => {
            channel.unsubscribe();
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const playSound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.replayAsync();
            }
        } catch (error) {
            console.error('Failed to play beep', error);
        }
    };

    return (
        <>
            {children}
            <Toaster />
        </>
    );
}
