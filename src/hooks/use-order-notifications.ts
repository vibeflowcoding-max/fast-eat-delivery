'use client';

import { useEffect, useCallback, useState } from 'react';
import { OrderService } from '@/services/order.service';
import type { OrderWithDetails } from '@/schemas/order.schema';

export function useOrderNotifications() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isAudioContextUnlocked, setIsAudioContextUnlocked] = useState(false);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<OrderWithDetails | null>(null);
  const [availableCount, setAvailableCount] = useState(0);

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

  const showSystemNotification = useCallback(async (order: any) => {
    if (!isEnabled) return;

    // 1. Badge Update (if supported)
    if ('setAppBadge' in navigator) {
      try {
        const count = availableCount + 1;
        setAvailableCount(count);
        (navigator as any).setAppBadge(count);
      } catch (e) {
        console.warn('Badging API not supported or failed');
      }
    }

    // 2. Play Sound
    playNotificationSound();

    // 3. Show System Notification
    if ('serviceWorker' in navigator && permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      (registration as any).showNotification('¡Nueva Orden Disponible! 🎯', {
        body: `Orden #${order.order_number} de ${order.restaurant?.name || 'un nuevo restaurante'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-order',
        renotify: true,
        data: { url: `/dashboard/orders/${order.id}` }
      });
    } else if ('Notification' in window && permission === 'granted') {
      new Notification('¡Nueva Orden Disponible! 🎯', {
        body: `Orden #${order.order_number} de ${order.restaurant?.name || 'un nuevo restaurante'}`,
        icon: '/favicon.ico',
      });
    }

    // 4. Set Alert for In-App Modal
    setNewOrderAlert(order);
  }, [playNotificationSound, isEnabled, permission, availableCount]);

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
    showSystemNotification({
      order_number: 'TEST-123',
      restaurant: { name: 'Restaurante de Prueba' },
      delivery_address: 'Calle Ficticia 123',
      total: 5000,
      items: [{}, {}],
      id: 'test-id'
    } as any);
  }, [showSystemNotification]);

  useEffect(() => {
    // Subscribe to new orders
    const channel = OrderService.subscribeToReadyOrders((payload) => {
      if (!isEnabled) return;

      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new;
        if (newOrder.status_id === 7) {
          // Fetch full details for the alert modal
          OrderService.getOrderById(newOrder.id).then(fullOrder => {
            if (fullOrder) {
              showSystemNotification(fullOrder);
            }
          });
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
    newOrderAlert,
    setNewOrderAlert,
    clearBadge: () => {
      setAvailableCount(0);
      if ('clearAppBadge' in navigator) {
        (navigator as any).clearAppBadge();
      }
    }
  };
}
