'use client';

import { useEffect, useCallback, useState } from 'react';
import { OrderService } from '@/services/order.service';

export function useOrderNotifications() {
  const [isEnabled, setIsEnabled] = useState(true);

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

  const playNotificationSound = useCallback(() => {
    if (!isEnabled) return;
    try {
      // Create a fresh instance for each play to allow overlapping sounds if needed
      // and ensuring it starts from the beginning
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Acción de audio bloqueada o fallida:', err);
          // On mobile, sometimes it needs a more direct user gesture
        });
      }
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }, [isEnabled]);

  const showSystemNotification = useCallback((orderNumber: string, restaurantName: string) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support system notifications');
      return;
    }

    if (Notification.permission === 'granted' && isEnabled) {
      new Notification('¡Nueva Orden Disponible! 🎯', {
        body: `Orden #${orderNumber} de ${restaurantName}`,
        icon: '/favicon.ico',
      });
      playNotificationSound();
    }
  }, [playNotificationSound, isEnabled]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

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
    permissionStatus: typeof window !== 'undefined' ? Notification.permission : 'default'
  };
}
