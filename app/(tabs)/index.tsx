import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Download, Power } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../../src/constants/Theme';
import { useAuth } from '../../src/context/AuthContext';
import { usePWA } from '../../src/context/PWAContext';
import { OrderService } from '../../src/services/OrderService';
import { Order } from '../../src/types/database';

export default function FeedScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { deferredPrompt, installPWA } = usePWA();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound>();
  const [isOnline, setIsOnline] = useState(true);

  async function playNotificationSound() {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/notification.mp3')
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (e) {
      console.log('Error playing sound', e);
    }
  }

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const loadOrders = async () => {
    try {
      const data = await OrderService.getActiveAuctions();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();

    const subscription = OrderService.subscribeToAuctions(
      (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        playNotificationSound();
      },
      (payload) => {
        if (payload.new.status_id !== 7) {
          setOrders(prev => prev.filter(o => o.id !== payload.new.id));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>FastEat</Text>
        </View>
        <View style={styles.statusToggleContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? COLORS.success : COLORS.destructive }]} />
          <Text style={styles.statusText}>{isOnline ? 'En línea' : 'Desconectado'}</Text>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#767577', true: COLORS.success }}
            thumbColor={'#f4f3f4'}
          />
          <TouchableOpacity onPress={() => signOut()} style={styles.logoutButton}>
            <Power size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* PWA Install Banner */}
        {Platform.OS === 'web' && deferredPrompt && (
          <TouchableOpacity style={styles.pwaBanner} onPress={installPWA}>
            <View style={styles.pwaBannerContent}>
              <View style={styles.pwaIconContainer}>
                <Download size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pwaTitle}>Instalar App FastEat</Text>
                <Text style={styles.pwaSubtitle}>Instala para una mejor experiencia</Text>
              </View>
              <View style={styles.pwaButton}>
                <Text style={styles.pwaButtonText}>INSTALAR</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Entregas Hoy</Text>
              <Text style={[styles.statValue, { color: 'white' }]}>0</Text>
              <Text style={[styles.statSubtitle, { color: 'rgba(255,255,255,0.6)' }]}>Completadas</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Text style={styles.statEmoji}>🚀</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7', borderWidth: 1 }]}>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: '#15803D' }]}>Ganancias Hoy</Text>
              <Text style={[styles.statValue, { color: '#166534' }]}>₡0</Text>
              <Text style={[styles.statSubtitle, { color: '#166534', opacity: 0.6 }]}>Hoy</Text>
            </View>
            <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.statEmoji}>💵</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.card }]}>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Este Mes</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statSubtitle}>₡0</Text>
            </View>
            <View style={styles.statIconContainer}>
              <Text style={styles.statEmoji}>📅</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🎯 Órdenes Disponibles para Tomar</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
            <Text style={styles.emptyTitle}>No hay órdenes disponibles en este momento</Text>
            <Text style={styles.emptySubtitle}>Las nuevas órdenes aparecerán aquí automáticamente.</Text>
            <View style={styles.onlineStatus}>
              <Text style={styles.onlineStatusText}>💡 Estás Online y listo para recibir pedidos</Text>
            </View>
          </View>
        ) : (
          orders.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.orderCard}
              onPress={() => (router as any).push(`/order/${item.id}`)}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.restaurantName}>{item.restaurants?.name}</Text>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>₡{item.total.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.addressText}>{item.delivery_address}</Text>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={async () => {
                  try {
                    await OrderService.acceptOrder(item.id, user?.id!);
                    (router as any).push('/active-order');
                  } catch (e) {
                    Alert.alert('Error', 'No se pudo aceptar la orden');
                  }
                }}
              >
                <Text style={styles.acceptButtonText}>🚴 TOMAR ORDEN</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    marginLeft: 8,
    padding: 4,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: COLORS.secondaryText,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 4,
    color: COLORS.secondaryText,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    ...SHADOWS.small,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  onlineStatus: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  onlineStatusText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pwaBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  pwaBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pwaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pwaTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pwaSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  pwaButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pwaButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
});
