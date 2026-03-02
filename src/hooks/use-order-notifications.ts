'use client';

import { useEffect, useCallback, useState } from 'react';
import { OrderService } from '@/services/order.service';

export function useOrderNotifications() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isAudioContextUnlocked, setIsAudioContextUnlocked] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('notifications_enabled');
    if (saved !== null) {
      setIsEnabled(saved === 'true');
    }
  }, []);

  const toggleNotifications = useCallback((value: boolean) => {
    setIsEnabled(value);
    localStorage.setItem('notifications_enabled', String(value));
  }, []);

  const playNotificationSound = useCallback(async () => {
    if (!isEnabled) return;
    try {
      // Create a fresh instance for each play to allow overlapping sounds if needed
      // and ensuring it starts from the beginning
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
        setIsAudioContextUnlocked(true);
      }
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
      setIsAudioContextUnlocked(false);
      // On mobile, sometimes it needs a more direct user gesture
    }
  }, [isEnabled]);

  const showSystemNotification = useCallback((orderNumber: string, restaurantName: string) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support system notifications');
      return;
    }

    if (permission === 'granted' && isEnabled) {
      new Notification('¡Nueva Orden Disponible! 🎯', {
        body: `Orden #${orderNumber} de ${restaurantName}`,
        icon: '/favicon.ico',
      });
      playNotificationSound();
    }
  }, [playNotificationSound, isEnabled, permission]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);
    return newPermission === 'granted';
  }, []);

  const testSound = useCallback(async () => {
    setIsTestingSound(true);
    await playNotificationSound();
    setTimeout(() => setIsTestingSound(false), 2000);
  }, [playNotificationSound]);

  const testNotification = useCallback(() => {
    showSystemNotification('TEST-123', 'Restaurante de Prueba');
  }, [showSystemNotification]);

  useEffect(() => {
    // Subscribe to new orders
    const channel = OrderService.subscribeToReadyOrders((payload) => {
      if (!isEnabled) return;

      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new;
        if (newOrder.status_id === 7) {
          showSystemNotification(newOrder.order_number, 'un nuevo restaurante');
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [showSystemNotification, isEnabled]);

  return {
    showSystemNotification,
    requestPermission,
    testNotification,
    isEnabled,
    toggleNotifications,
    permissionStatus: typeof window !== 'undefined' ? Notification.permission : 'default',
    permission,
    isAudioContextUnlocked,
    isTestingSound,
    testSound,
  };
}
