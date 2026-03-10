import { useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Download, Power } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderCard } from '../../src/components/OrderCard';
import { COLORS, SHADOWS } from '../../src/constants/Theme';
import { useAuth } from '../../src/context/AuthContext';
import { usePWA } from '../../src/context/PWAContext';
import { supabase } from '../../src/lib/supabase';
import { GoogleMapsService, RouteResult } from '../../src/services/GoogleMapsService';
import { OrderService } from '../../src/services/OrderService';
import { Order } from '../../src/types/database';

const REFRESH_THROTTLE_MS = 30_000; // 30 seconds between background refreshes
const SIGNIFICANT_MOVE_METERS = 100;

function distanceBetween(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
  const R = 6371000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FeedScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { deferredPrompt, installPWA } = usePWA();
  const player = useAudioPlayer(require('../../assets/sounds/notification.mp3'));

  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeData, setRouteData] = useState<Record<string, RouteResult | null>>({});
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState({

    todayCount: 0,
    todayEarnings: 0,
    monthCount: 0,
    monthEarnings: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);


  const lastRefreshTime = useRef<number>(0);
  const lastRouteLocation = useRef<{ lat: number; lng: number } | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // ── Sound ───────────────────────────────────────────────────────────────
  const playSound = () => {
    try {
      player.seekTo(0);
      player.play();
    } catch (_) { /* noop */ }
  };

  // ── Browser Notifications ───────────────────────────────────────────────
  const showWebNotification = (title: string, body: string) => {
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
        });
      } catch (e) {
        console.warn('Error showing notification:', e);
      }
    }
  };

  // ── Geolocation ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    (async () => {
      // Request simple browser notifications permission if on web
      if (Platform.OS === 'web' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !isMounted) {
          if (status !== 'granted') console.warn('[Location] Permission denied');
          return;
        }

        // Try last known first (works reliably on emulators)
        let pos = await Location.getLastKnownPositionAsync({});
        if (!pos && isMounted) {
          pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
        }
        if (pos && isMounted) {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }

        if (isMounted) {
          const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
            (p) => {
              if (isMounted) {
                setLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
              }
            }
          );

          if (!isMounted) {
            sub.remove();
          } else {
            subscriptionRef.current = sub;
          }
        }
      } catch (e) {
        if (isMounted) {
          console.log('[Location] Not available:', (e as Error).message);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  // ── Route calculation when location or orders change ────────────────────
  useEffect(() => {
    if (!location || orders.length === 0) return;

    const moved = distanceBetween(
      lastRouteLocation.current?.lat,
      lastRouteLocation.current?.lng,
      location.lat,
      location.lng
    ) > SIGNIFICANT_MOVE_METERS;

    if (moved || !lastRouteLocation.current) {
      lastRouteLocation.current = location;
      updateRoutes(location, orders);
    }
  }, [location, orders.length]);

  const updateRoutes = async (
    driverLoc: { lat: number; lng: number },
    orderList: Order[]
  ) => {
    for (const order of orderList) {
      const restaurant = (order as any).restaurants || (order as any).restaurant;
      const lat = restaurant?.latitude;
      const lng = restaurant?.longitude;
      if (lat && lng) {
        const result = await GoogleMapsService.calculateRoute(
          driverLoc.lat,
          driverLoc.lng,
          lat,
          lng
        );
        setRouteData(prev => ({ ...prev, [order.id]: result }));
      }
    }
  };

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      setStatsLoading(true);
      const data = await OrderService.getDriverStats(user.id);
      setStats(data);
    } catch (e) {
      console.error('[FeedScreen] Error loading stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  const loadActiveOrder = useCallback(async () => {
    if (!user) return;
    try {
      const data = await OrderService.getCurrentActiveOrder(user.id);
      setActiveOrder(data);
    } catch (e) {
      console.error('[FeedScreen] Error loading active order:', e);
    }
  }, [user]);


  // ── Order loading ────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (showLoader = false) => {
    try {
      if (!user) return;
      if (showLoader) setRefreshing(true);
      lastRefreshTime.current = Date.now();
      const data = await OrderService.getActiveAuctions(user.id);
      setOrders(data);


      // Refresh stats and active order
      loadStats();
      loadActiveOrder();

      // After we have orders, compute routes if we already have location
      if (location) updateRoutes(location, data);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [location, loadStats, loadActiveOrder, user]);




  // ── Realtime subscription + polling ─────────────────────────────────────
  useEffect(() => {
    if (!isOnline) {
      setOrders([]);
      return;
    }

    loadOrders(true);

    const subscription = OrderService.subscribeToAuctions(
      async (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        playSound();

        // Fix: Calculate distance immediately for the new order
        if (location) {
          const restaurant = (newOrder as any).restaurants || (newOrder as any).restaurant;
          const lat = restaurant?.latitude;
          const lng = restaurant?.longitude;
          if (lat && lng) {
            const result = await GoogleMapsService.calculateRoute(
              location.lat,
              location.lng,
              lat,
              lng
            );
            setRouteData(prev => ({ ...prev, [newOrder.id]: result }));
          }
        }

        if (Platform.OS === 'web') {

          showWebNotification(
            '🚚 Nueva Orden Disponible',
            `Restaurante: ${(newOrder as any).branch?.name || (newOrder as any).restaurants?.name || 'Local'}\nTotal: ₡${newOrder.total?.toLocaleString()}`
          );
        }
      },
      (payload) => {
        // Remove order if status is no longer 7 or if it was assigned to a driver
        if (payload.new.status_id !== 7 || payload.new.delivery_id !== null) {
          setOrders(prev => prev.filter(o => o.id !== payload.new.id));
        }
      }
    );

    // Listen to our own bids so we can remove/re-add orders from the Feed immediately
    const bidSubscription = supabase
      .channel('feed_bids_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'delivery_bids',
        filter: `driver_id=eq.${user?.id}`,
      }, () => {
        // When a bid changes (created, withdrawn), reload the filtered feed
        loadOrders(false);
      })
      .subscribe();


    const interval = setInterval(() => {
      const sinceLast = Date.now() - lastRefreshTime.current;
      if (sinceLast >= REFRESH_THROTTLE_MS) loadOrders(false);
    }, REFRESH_THROTTLE_MS);

    return () => {
      subscription.unsubscribe();
      bidSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [isOnline, user, loadOrders]);


  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders(false);
    setRefreshing(false);
  };

  const handleAccept = async (orderId: string) => {
    try {
      await OrderService.acceptOrder(orderId, user?.id!);
      (router as any).push('/active-order');
    } catch {
      Alert.alert('Error', 'No se pudo aceptar la orden');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../public/icon-192.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>FastEat</Text>
        </View>
        <View style={styles.statusToggle}>
          <View style={[styles.dot, { backgroundColor: isOnline ? COLORS.success : COLORS.destructive }]} />
          <Text style={styles.statusText}>{isOnline ? 'En línea' : 'Desconectado'}</Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#767577', true: COLORS.success }}
            thumbColor="#fff"
          />
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Power size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* PWA Banner */}
        {Platform.OS === 'web' && deferredPrompt && (
          <TouchableOpacity style={styles.pwaBanner} onPress={installPWA}>
            <View style={styles.pwaBannerContent}>
              <View style={styles.pwaIcon}><Download size={20} color="white" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pwaTitle}>Instalar App FastEat</Text>
                <Text style={styles.pwaSubtitle}>Instala para una mejor experiencia</Text>
              </View>
              <View style={styles.pwaBtn}><Text style={styles.pwaBtnText}>INSTALAR</Text></View>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Entregas Hoy</Text>
              <Text style={[styles.statValue, { color: 'white' }]}>{stats.todayCount}</Text>
              <Text style={[styles.statSub, { color: 'rgba(255,255,255,0.6)' }]}>Completadas</Text>
            </View>
            <Text style={styles.statEmoji}>🚀</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7', borderWidth: 1 }]}>
            <View>
              <Text style={[styles.statLabel, { color: '#15803D' }]}>Ganancias Hoy</Text>
              <Text style={[styles.statValue, { color: '#166534' }]}>₡{stats.todayEarnings.toLocaleString()}</Text>
              <Text style={[styles.statSub, { color: '#166534', opacity: 0.6 }]}>Hoy</Text>
            </View>
            <Text style={styles.statEmoji}>💵</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.card }]}>
            <View>
              <Text style={styles.statLabel}>Este Mes</Text>
              <Text style={styles.statValue}>{stats.monthCount}</Text>
              <Text style={styles.statSub}>₡{stats.monthEarnings.toLocaleString()}</Text>
            </View>
            <Text style={styles.statEmoji}>📅</Text>
          </View>
        </View>


        {/* Section Title */}


        <Text style={styles.sectionTitle}>🎯 Órdenes Disponibles para Tomar</Text>

        {/* Orders list or empty state */}
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
            <Text style={styles.emptyTitle}>No hay órdenes disponibles en este momento</Text>
            <Text style={styles.emptySub}>Las nuevas órdenes aparecerán aquí automáticamente.</Text>
            {isOnline && (
              <View style={styles.onlinePill}>
                <Text style={styles.onlinePillText}>💡 Estás Online y listo para recibir pedidos</Text>
              </View>
            )}
          </View>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order as any}
              routeToRestaurant={routeData[order.id]}
              onDetails={() => (router as any).push(`/order-details?orderId=${order.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statusToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  logoutBtn: { marginLeft: 4, padding: 4 },
  content: { padding: 20 },
  pwaBanner: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 16, marginBottom: 20, ...SHADOWS.small },
  pwaBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pwaIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  pwaTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  pwaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  pwaBtn: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pwaBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  statsGrid: { flexDirection: 'column', gap: 12, marginBottom: 24 },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', color: COLORS.secondaryText },
  statValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  statSub: { fontSize: 12, marginTop: 4, color: COLORS.secondaryText },
  statEmoji: { fontSize: 28 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: 'white', borderRadius: 20, ...SHADOWS.small },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', paddingHorizontal: 40, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.secondaryText, textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 },
  onlinePill: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  onlinePillText: { fontSize: 12, color: COLORS.secondaryText, fontWeight: '500' },
  activeOrderBanner: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  activeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeOrderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOrderTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  activeOrderSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  activeOrderBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeOrderBadgeText: {
    color: '#1E3A8A',
    fontSize: 10,
    fontWeight: '900',
  },
});
