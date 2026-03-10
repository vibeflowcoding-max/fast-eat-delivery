import { useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Navigation, Store } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../src/constants/Theme';
import { useAuth } from '../src/context/AuthContext';
import { AuctionService } from '../src/services/AuctionService';
import { GoogleMapsService, RouteResult } from '../src/services/GoogleMapsService';
import { OrderService } from '../src/services/OrderService';
import { Order } from '../src/types/database';

type BidMode = 'base' | 'offer';

type BidData = {
    id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn' | 'expired';
    driver_offer: number | null;
    base_price: number;
    final_price: number | null;
    customer_counter_offer: number | null;
    driver_notes: string | null;
};

type OrderWithExtras = Order & {
    restaurants?: { name?: string; address?: string; latitude?: number; longitude?: number } | null;
    customer?: { id?: string; name?: string; phone?: string } | null;
    items?: Array<{ id: string; name: string; quantity: number; special_instructions?: string | null }>;
    source?: string | null;
};


function getCustomerName(order: OrderWithExtras): string | null {
    return order.customer?.name || null;
}

export default function OrderDetailsScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [order, setOrder] = useState<OrderWithExtras | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
    const [bidMode, setBidMode] = useState<BidMode>('base');
    const [offerAmount, setOfferAmount] = useState('');
    const [reason, setReason] = useState('');
    const [offerError, setOfferError] = useState('');
    const [activeBid, setActiveBid] = useState<BidData | null>(null);

    const player = useAudioPlayer(require('../assets/sounds/notification.mp3'));

    const [routeToRestaurant, setRouteToRestaurant] = useState<RouteResult | null>(null);
    const [routeToCustomer, setRouteToCustomer] = useState<RouteResult | null>(null);

    // ── User Notifications (Web & Mobile) ──────────────────────────────────
    const notifyUser = async (title: string, body: string) => {
        // Sound for both platforms
        try {
            player.seekTo(0);
            player.play();
        } catch (_) { /* noop */ }

        if (Platform.OS === 'web') {
            if ('Notification' in window && Notification.permission === 'granted') {
                const n = new Notification(title, { body, icon: '/icon-192.png' });
                n.onclick = () => window.focus();
            }
        } else {
            await Notifications.scheduleNotificationAsync({
                content: { title, body, sound: true },
                trigger: null, // immediate
            });
        }
    };

    // Navigation Modal State
    const [navModalVisible, setNavModalVisible] = useState(false);
    const [navTarget, setNavTarget] = useState<{ lat?: number | null, lng?: number | null, address?: string | null, title: string } | null>(null);

    const bidSubscription = useRef<any>(null);
    const lastBidStatus = useRef<string | null>(null);

    useEffect(() => {
        loadOrder();
        return () => {
            bidSubscription.current?.unsubscribe();
        };
    }, [orderId]);

    const loadOrder = async () => {
        if (!orderId) return;
        try {
            setLoading(true);
            const data = await OrderService.getOrderById(orderId);
            setOrder(data as OrderWithExtras);
            if (data) {
                computeRoutes(data as OrderWithExtras);
                // Check if driver already has an active bid
                if (user) await checkExistingBid(orderId, user.id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const checkExistingBid = async (oId: string, driverId: string) => {
        const { data } = await (await import('../src/lib/supabase')).supabase
            .from('delivery_bids')
            .select('*')
            .eq('order_id', oId)
            .eq('driver_id', driverId)
            .in('status', ['pending', 'countered', 'accepted'])
            .maybeSingle();

        if (data) {
            setActiveBid(data as BidData);
            subscribeToMyBid(data.id);
        }
    };

    const subscribeToMyBid = (bidId: string) => {
        bidSubscription.current?.unsubscribe();
        bidSubscription.current = AuctionService.subscribeToBid(bidId, (payload) => {
            const updated = payload.new as BidData;
            const previousStatus = lastBidStatus.current;
            lastBidStatus.current = updated.status;
            setActiveBid(updated);

            if (updated.status === 'accepted' && previousStatus !== 'accepted') {
                notifyUser(
                    '✅ Oferta Aceptada',
                    `El cliente aceptó tu oferta por ₡${(updated.final_price || updated.driver_offer || updated.base_price).toLocaleString()}`
                );
                // Bid was accepted! Redirect to active order
                setTimeout(() => (router as any).replace('/active-order'), 1500);
            } else if (updated.status === 'countered' && previousStatus !== 'countered') {
                notifyUser(
                    '🔄 Nueva Contraoferta',
                    `El cliente te ofrece ₡${(updated.customer_counter_offer || 0).toLocaleString()}`
                );
            }
        });
    };

    const computeRoutes = async (ord: OrderWithExtras) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Try last known position first (works reliably on emulators)
            let pos = await Location.getLastKnownPositionAsync({});
            if (!pos) {
                pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Lowest,
                });
            }
            if (!pos) return;

            const dLat = pos.coords.latitude, dLng = pos.coords.longitude;
            const rest = ord.restaurants;
            if (rest?.latitude && rest?.longitude) {
                const r1 = await GoogleMapsService.calculateRoute(dLat, dLng, rest.latitude, rest.longitude);
                setRouteToRestaurant(r1);
                const cLat = (ord as any).customer_latitude, cLng = (ord as any).customer_longitude;
                if (cLat && cLng) {
                    const r2 = await GoogleMapsService.calculateRoute(rest.latitude, rest.longitude, cLat, cLng);
                    setRouteToCustomer(r2);
                }
            }
        } catch (e) {
            // Location unavailable on emulator — app still works without distance info
            console.log('[OrderDetails] location not available:', (e as Error).message);
        }
    };


    const openGoogleMaps = () => {
        if (!navTarget) return;
        const target = navTarget.lat && navTarget.lng
            ? `${navTarget.lat},${navTarget.lng}`
            : encodeURIComponent(navTarget.address || '');
        Linking.openURL(`https://maps.google.com/?q=${target}`);
        setNavModalVisible(false);
    };

    const openWaze = () => {
        if (!navTarget) return;
        const url = navTarget.lat && navTarget.lng
            ? `https://waze.com/ul?ll=${navTarget.lat},${navTarget.lng}&navigate=yes`
            : `https://waze.com/ul?q=${encodeURIComponent(navTarget.address || '')}&navigate=yes`;
        Linking.openURL(url);
        setNavModalVisible(false);
    };

    const openNativeMaps = () => {
        if (!navTarget) return;
        const query = encodeURIComponent(navTarget.address || '');
        const url = Platform.select({
            ios: `maps:0,0?q=${query}`,
            android: `geo:0,0?q=${query}`,
        });
        if (url) Linking.openURL(url);
        setNavModalVisible(false);
    };

    const handleOpenNav = (lat?: number | null, lng?: number | null, address?: string | null, title?: string) => {
        setNavTarget({ lat, lng, address, title: title || 'Destino' });
        setNavModalVisible(true);
    };

    const basePrice = order
        ? ((order as any).delivery_base_price || AuctionService.calculateBasePrice(routeToCustomer?.distanceKm || (order as any).delivery_distance_km || 3.5))
        : 0;

    const handleSubmitBid = async () => {
        if (!order || !user) return;
        let driverOffer: number | null = null;
        if (bidMode === 'offer') {
            const parsed = parseInt(offerAmount, 10);
            if (isNaN(parsed) || parsed < basePrice) {
                setOfferError(`La oferta debe ser al menos ₡${basePrice.toLocaleString()}`);
                return;
            }
            driverOffer = parsed;
        }
        try {
            setSubmitting(true);
            const bid = await AuctionService.createBid({
                order_id: order.id, driver_id: user.id,
                driver_offer: driverOffer,
                distance_km: routeToCustomer?.distanceKm ?? null,
                estimated_time_minutes: routeToCustomer?.durationMin ?? null,
                driver_notes: reason.trim() || null,
            });
            setActiveBid(bid as BidData);
            subscribeToMyBid(bid.id);
            if (bidMode === 'base') {
                setTimeout(() => (router as any).replace('/active-order'), 1000);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo enviar la oferta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!activeBid || !user) return;

        const performWithdraw = async () => {
            try {
                setWithdrawing(true);
                await AuctionService.withdrawBid(activeBid.id, user.id);
                setActiveBid(null);
                bidSubscription.current?.unsubscribe();
            } catch (e: any) {
                Alert.alert('Error', e.message);
            } finally {
                setWithdrawing(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('¿Seguro que deseas retirar tu oferta?')) {
                performWithdraw();
            }
        } else {
            Alert.alert('Retirar Oferta', '¿Seguro que deseas retirar tu oferta?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Retirar', style: 'destructive', onPress: performWithdraw }
            ]);
        }
    };

    if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    if (!order) return (
        <View style={s.centered}>
            <Text style={s.errorText}>No se encontró la orden.</Text>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : (router as any).replace('/(tabs)')}><Text style={s.backLink}>← Volver</Text></TouchableOpacity>
        </View>
    );

    const restaurant = order.restaurants;
    const customerName = getCustomerName(order);
    const customerPhone = order.customer?.phone;

    // ────────────── Auction section renderer ──────────────
    const renderAuctionSection = () => {
        // Bid accepted
        if (activeBid?.status === 'accepted') {
            return (
                <View style={s.bidCard}>
                    <View style={s.bidCardHeaderAccepted}>
                        <Text style={s.bidCardHeaderIcon}>✅</Text>
                        <Text style={[s.bidCardTitle, { color: '#16A34A' }]}>Oferta Aceptada</Text>
                    </View>
                    <Text style={s.bidAcceptedText}>¡El cliente aceptó tu oferta! Redirigiendo...</Text>
                    <ActivityIndicator color={COLORS.success} style={{ marginTop: 12 }} />
                </View>
            );
        }

        // Bid rejected
        if (activeBid?.status === 'rejected') {
            return (
                <View style={[s.bidCard, s.bidCardRejected]}>
                    <View style={s.bidCardHeaderRow}>
                        <Text style={s.bidCardHeaderIcon}>❌</Text>
                        <Text style={[s.bidCardTitle, { color: '#DC2626' }]}>Oferta Rechazada</Text>
                    </View>
                    <Text style={[s.bidWaitingText, { color: '#DC2626' }]}>El cliente rechazó tu oferta.</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => setActiveBid(null)}>
                        <Text style={s.retryBtnText}>Hacer nueva oferta</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Customer sent a counter-offer
        if (activeBid?.status === 'countered' && activeBid.customer_counter_offer) {
            return (
                <View style={[s.bidCard, s.bidCardCounter]}>
                    <View style={s.bidCardHeaderRow}>
                        <Text style={s.bidCardHeaderIcon}>🔄</Text>
                        <Text style={[s.bidCardTitle, { color: '#D97706' }]}>Contraoferta del Cliente</Text>
                    </View>
                    <View style={s.bidInfoBox}>
                        <View style={s.bidInfoRow}><Text style={s.bidInfoLabel}>Tu oferta:</Text><Text style={s.bidInfoValue}>₡{(activeBid.driver_offer || activeBid.base_price).toLocaleString()}</Text></View>
                        <View style={[s.bidInfoRow, s.bidInfoDivider]}><Text style={s.bidInfoLabel}>Contraoferta:</Text><Text style={[s.bidInfoValue, { color: '#D97706', fontSize: 18 }]}>₡{activeBid.customer_counter_offer.toLocaleString()}</Text></View>
                    </View>
                    <View style={s.counterActions}>
                        <TouchableOpacity style={s.acceptCounterBtn} onPress={handleSubmitBid}>
                            <Text style={s.acceptCounterBtnText}>✅ Aceptar ₡{activeBid.customer_counter_offer.toLocaleString()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.withdrawBtn} onPress={handleWithdraw} disabled={withdrawing}>
                            {withdrawing ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={s.withdrawBtnText}>Retirar Oferta</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Bid pending → "Oferta Enviada" card (matches screenshot)
        if (activeBid?.status === 'pending') {
            const myOffer = activeBid.driver_offer || activeBid.base_price;
            return (
                <View style={s.bidCard}>
                    <View style={s.bidCardHeaderRow}>
                        <Text style={s.bidCardHeaderIcon}>⏳</Text>
                        <Text style={s.bidCardTitle}>Oferta Enviada</Text>
                    </View>
                    <View style={s.bidInfoBox}>
                        <View style={s.bidInfoRow}>
                            <Text style={s.bidInfoLabel}>Tu oferta:</Text>
                            <Text style={[s.bidInfoValue, { color: '#D97706', fontSize: 20 }]}>₡{myOffer.toLocaleString()}</Text>
                        </View>
                        {activeBid.driver_notes && (
                            <>
                                <View style={s.bidInfoDividerLine} />
                                <View style={s.bidInfoColGroup}>
                                    <Text style={s.bidInfoLabel}>Nota:</Text>
                                    <Text style={s.bidInfoValueNote}>{activeBid.driver_notes}</Text>
                                </View>
                            </>
                        )}
                    </View>
                    <Text style={s.bidWaitingText}>Esperando respuesta del cliente...</Text>
                    <TouchableOpacity style={s.withdrawBtn} onPress={handleWithdraw} disabled={withdrawing}>
                        {withdrawing
                            ? <ActivityIndicator color={COLORS.text} size="small" />
                            : <Text style={s.withdrawBtnText}>Retirar Oferta</Text>}
                    </TouchableOpacity>
                </View>
            );
        }

        // No bid yet → show auction bidding form
        if (order.status_id === 7) {
            const isVirtualMenu = order.source === 'virtualMenu';

            // Virtual menu orders: single accept button, no negotiation
            if (isVirtualMenu) {
                return (
                    <View style={s.auctionCard}>
                        <Text style={s.auctionTitle}>🛵 Orden de Virtual Menu</Text>
                        <Text style={s.auctionSubtitle}>
                            Orden #{(order as any).order_number || order.id.slice(0, 8)} • {restaurant?.name || 'Restaurante'}
                        </Text>
                        <View style={s.auctionMetrics}>
                            <View style={s.metricRow}>
                                <Text style={s.metricLabel}>Precio Base:</Text>
                                <Text style={s.metricValuePrimary}>₡{basePrice.toLocaleString()}</Text>
                            </View>
                            <View style={s.metricRow}>
                                <Text style={s.metricLabel}>Distancia:</Text>
                                <Text style={s.metricValue}>{routeToCustomer?.distanceKm ? `${routeToCustomer.distanceKm.toFixed(1)} km` : '---'}</Text>
                            </View>
                            <View style={s.metricRow}>
                                <Text style={s.metricLabel}>Entregar en:</Text>
                                <Text style={s.metricValue} numberOfLines={2}>{order.delivery_address || '---'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[s.submitBidBtn, submitting && s.submitBidBtnDisabled]}
                            onPress={handleSubmitBid}
                            disabled={submitting}
                        >
                            {submitting
                                ? <ActivityIndicator color="white" />
                                : <Text style={s.submitBidBtnText}>✅ ACEPTAR ORDEN · ₡{basePrice.toLocaleString()}</Text>}
                        </TouchableOpacity>
                        <Text style={s.auctionHint}>La orden te será asignada inmediatamente al aceptar.</Text>
                    </View>
                );
            }

            // Normal auction flow: two bidding mode buttons
            return (
                <View style={s.auctionCard}>
                    <Text style={s.auctionTitle}>💰 Oferta de Delivery</Text>
                    <Text style={s.auctionSubtitle}>
                        Orden #{(order as any).order_number || order.id.slice(0, 8)} • {restaurant?.name || 'Restaurante'}
                    </Text>
                    <View style={s.auctionMetrics}>
                        <View style={s.metricRow}>
                            <Text style={s.metricLabel}>Precio Base:</Text>
                            <Text style={s.metricValuePrimary}>₡{basePrice.toLocaleString()}</Text>
                        </View>
                        <View style={s.metricRow}>
                            <Text style={s.metricLabel}>Distancia:</Text>
                            <Text style={s.metricValue}>{routeToCustomer?.distanceKm ? `${routeToCustomer.distanceKm.toFixed(1)} km` : '---'}</Text>
                        </View>
                        <View style={s.metricRow}>
                            <Text style={s.metricLabel}>Entregar en:</Text>
                            <Text style={s.metricValue} numberOfLines={2}>{order.delivery_address || '---'}</Text>
                        </View>
                    </View>
                    <Text style={s.auctionQuestion}>¿Qué deseas hacer?</Text>
                    <View style={s.bidModeRow}>
                        <TouchableOpacity style={[s.bidModeCard, bidMode === 'base' && s.bidModeCardActive]} onPress={() => setBidMode('base')}>
                            <Text style={s.bidModeIcon}>✅</Text>
                            <Text style={[s.bidModeTitle, bidMode === 'base' && s.bidModeActiveText]}>Aceptar Base</Text>
                            <Text style={s.bidModeSub}>Match inmediato</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.bidModeCard, bidMode === 'offer' && s.bidModeCardOffer]} onPress={() => setBidMode('offer')}>
                            <Text style={s.bidModeIcon}>💰</Text>
                            <Text style={[s.bidModeTitle, bidMode === 'offer' && s.bidModeOfferText]}>Proponer Precio</Text>
                            <Text style={s.bidModeSub}>Negociar</Text>
                        </TouchableOpacity>
                    </View>
                    {bidMode === 'offer' && (
                        <View style={s.offerFields}>
                            <View>
                                <Text style={s.fieldLabel}>Mi propuesta de precio (₡)</Text>
                                <TextInput
                                    style={[s.offerInput, offerError ? s.offerInputError : null]}
                                    value={offerAmount}
                                    onChangeText={(t) => { setOfferAmount(t.replace(/[^0-9]/g, '')); setOfferError(''); }}
                                    keyboardType="number-pad"
                                    placeholder={`Mínimo ₡${basePrice.toLocaleString()}`}
                                    placeholderTextColor="#9CA3AF"
                                />
                                {offerError ? <Text style={s.errorMsg}>{offerError}</Text> : null}
                            </View>
                            <View>
                                <Text style={s.fieldLabel}>Razón (Opcional)</Text>
                                <TextInput
                                    style={s.reasonInput}
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder="Ej: Zona lejana, tráfico pesado..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline numberOfLines={3}
                                />
                            </View>
                        </View>
                    )}
                    <TouchableOpacity style={[s.submitBidBtn, submitting && s.submitBidBtnDisabled]} onPress={handleSubmitBid} disabled={submitting}>
                        {submitting
                            ? <ActivityIndicator color="white" />
                            : <Text style={s.submitBidBtnText}>🛵 TOMAR ORDEN{bidMode === 'base' ? ` · ₡${basePrice.toLocaleString()}` : ''}</Text>}
                    </TouchableOpacity>
                    <Text style={s.auctionHint}>
                        {bidMode === 'base'
                            ? 'Al aceptar el precio base, la orden te será asignada inmediatamente.'
                            : 'El cliente revisará tu propuesta y podrá aceptarla o negociar.'}
                    </Text>
                </View>
            );
        }
        return null;
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : (router as any).replace('/(tabs)')} style={s.backBtn}>
                    <Text style={s.backBtnText}>← Atrás</Text>
                </TouchableOpacity>
                <Text style={s.headerTitle}>
                    Orden {(order as any)?.order_number ? `#${(order as any).order_number}` : ''}
                </Text>

                <View style={{ width: 60 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={s.content}>

                    {/* 1. RESTAURANTE */}
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Store size={18} color={COLORS.primary} />
                            <Text style={s.sectionTitle}>Restaurante</Text>
                        </View>
                        <Text style={s.restaurantName}>
                            {restaurant?.name || 'Restaurante'}
                        </Text>
                        {restaurant?.address && !restaurant.address.toLowerCase().startsWith('lat') && (
                            <Text style={s.subText}>{restaurant.address}</Text>
                        )}
                        {routeToRestaurant && routeToRestaurant.distanceKm > 0 && (
                            <View style={s.routeBadge}>
                                <Text style={s.routeLabel}>Dist. a ti → restaurante</Text>
                                <Text style={s.routeValue}>{routeToRestaurant.distanceKm.toFixed(1)} km · ~{routeToRestaurant.durationMin} min</Text>
                            </View>
                        )}
                        <View style={s.navRow}>
                            <TouchableOpacity style={s.navBtnGray} onPress={() => handleOpenNav(restaurant?.latitude, restaurant?.longitude, restaurant?.address, restaurant?.name || 'Restaurante')}>
                                <Navigation size={18} color={COLORS.text} />
                                <Text style={s.navBtnGrayText}>Navegar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 2. CLIENTE / DESTINO */}
                    <View style={[s.section, s.customerSection]}>
                        <View style={s.sectionHeader}>
                            <Navigation size={18} color="#1D4ED8" />
                            <Text style={[s.sectionTitle, { color: '#1D4ED8' }]}>
                                Entregar a {customerName || ''}
                            </Text>
                        </View>
                        {customerName && (
                            <View style={s.customerNameRow}>
                                <View style={s.avatar}><Text style={{ fontSize: 20 }}>👤</Text></View>
                                <View>
                                    <Text style={s.customerLabel}>CLIENTE</Text>
                                    <Text style={s.customerNameText}>{customerName}</Text>
                                </View>
                            </View>
                        )}
                        {order.delivery_address && (
                            <View style={s.deliveryAddressBox}>
                                <View style={s.addressRow}>
                                    <MapPin size={14} color={COLORS.secondaryText} />
                                    <Text style={s.subText}>{order.delivery_address}</Text>
                                </View>
                                {routeToCustomer && routeToCustomer.distanceKm > 0 && (
                                    <View style={[s.routeBadge, { backgroundColor: '#DBEAFE', marginTop: 8 }]}>
                                        <Text style={s.routeLabel}>Rest. → cliente</Text>
                                        <Text style={[s.routeValue, { color: '#1D4ED8' }]}>{routeToCustomer.distanceKm.toFixed(1)} km · ~{routeToCustomer.durationMin} min</Text>
                                    </View>
                                )}
                                <View style={[s.navRow, { marginTop: 12 }]}>
                                    <TouchableOpacity style={s.navBtnGray} onPress={() => handleOpenNav((order as any).customer_latitude, (order as any).customer_longitude, order.delivery_address, 'Destino del Cliente')}>
                                        <Navigation size={18} color={COLORS.text} />
                                        <Text style={s.navBtnGrayText}>Navegar al Cliente</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        {customerPhone && (
                            <TouchableOpacity style={s.phoneRow} onPress={() => Linking.openURL(`tel:${customerPhone}`)}>
                                <Text style={s.phoneText}>📞 Llamar: {customerPhone}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 3. OFERTA / BID STATE */}
                    {renderAuctionSection()}

                    {/* 4. DETALLES DEL PEDIDO */}
                    {order.items && order.items.length > 0 && (
                        <View style={s.section}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={s.sectionTitle}>🧾 Detalles del Pedido</Text>
                                {(order as any)?.order_number && (
                                    <Text style={{ fontSize: 13, color: COLORS.secondaryText, fontWeight: '600' }}>#{(order as any).order_number}</Text>
                                )}
                            </View>

                            {order.items.map((item, i) => (
                                <View key={item.id || i} style={s.itemRow}>
                                    <View style={s.itemQtyBadge}><Text style={s.itemQtyText}>{item.quantity}</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.itemName}>{item.name}</Text>
                                        {item.special_instructions && <Text style={s.itemNote}>📝 {item.special_instructions}</Text>}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Navigation Modal */}
            <Modal
                visible={navModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setNavModalVisible(false)}
            >
                <TouchableOpacity
                    style={s.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setNavModalVisible(false)}
                >
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>Navegar a {navTarget?.title || 'Destino'}</Text>
                        <Text style={s.modalSubtitle} numberOfLines={2}>
                            {navTarget?.address || 'Selecciona tu aplicación favorita'}
                        </Text>

                        <TouchableOpacity style={s.navOption} onPress={openGoogleMaps}>
                            <View style={s.navOptionIcon}>
                                <Text style={{ fontSize: 22 }}>🗺️</Text>
                            </View>
                            <View style={s.navOptionText}>
                                <Text style={s.navOptionTitle}>Google Maps</Text>
                                <Text style={s.navOptionSubtitle}>Ver ruta y tráfico</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={s.navOption} onPress={openWaze}>
                            <View style={s.navOptionIcon}>
                                <Text style={{ fontSize: 22 }}>🚗</Text>
                            </View>
                            <View style={s.navOptionText}>
                                <Text style={s.navOptionTitle}>Waze</Text>
                                <Text style={s.navOptionSubtitle}>Optimizado para ahorrar tiempo</Text>
                            </View>
                        </TouchableOpacity>

                        {Platform.OS !== 'web' && (
                            <TouchableOpacity style={s.navOption} onPress={openNativeMaps}>
                                <View style={s.navOptionIcon}>
                                    <Text style={{ fontSize: 22 }}>📱</Text>
                                </View>
                                <View style={s.navOptionText}>
                                    <Text style={s.navOptionTitle}>Mapas del Sistema</Text>
                                    <Text style={s.navOptionSubtitle}>Abrir en app nativa</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={s.cancelNavBtn}
                            onPress={() => setNavModalVisible(false)}
                        >
                            <Text style={s.cancelNavBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const GOLD = '#D97706';
const GOLD_BG = '#FFFBEB';
const GOLD_BORDER = '#FCD34D';

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    errorText: { fontSize: 16, color: COLORS.secondaryText },
    backLink: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backBtn: { padding: 4 },
    backBtnText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    section: { backgroundColor: 'white', borderRadius: 20, padding: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', gap: 8 },
    customerSection: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    restaurantName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    subText: { fontSize: 13, color: COLORS.secondaryText, lineHeight: 20, flex: 1 },
    routeBadge: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12 },
    routeLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.secondaryText, textTransform: 'uppercase', letterSpacing: 0.5 },
    routeValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
    navRow: { flexDirection: 'row', gap: 10 },
    navBtnGray: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        ...SHADOWS.small,
    },
    navBtnGrayText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: 'bold',
    },
    navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...SHADOWS.small },
    navBtnEmoji: { fontSize: 16 },
    navBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    customerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
    customerLabel: { fontSize: 9, fontWeight: 'bold', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    customerNameText: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    deliveryAddressBox: { gap: 4 },
    phoneRow: { flexDirection: 'row', alignItems: 'center' },
    phoneText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

    // ── Auction Form ──
    auctionCard: { borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: '#FFFBF5', padding: 16, gap: 12 },
    auctionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
    auctionSubtitle: { fontSize: 12, color: COLORS.secondaryText, textAlign: 'center' },
    auctionMetrics: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', gap: 10 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    metricLabel: { fontSize: 13, color: COLORS.secondaryText },
    metricValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: '55%', textAlign: 'right' },
    metricValuePrimary: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
    auctionQuestion: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    bidModeRow: { flexDirection: 'row', gap: 10 },
    bidModeCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: 'white', gap: 4 },
    bidModeCardActive: { borderColor: COLORS.success, backgroundColor: '#F0FDF4' },
    bidModeCardOffer: { borderColor: COLORS.primary, backgroundColor: '#FFF8F0' },
    bidModeIcon: { fontSize: 22 },
    bidModeTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    bidModeActiveText: { color: COLORS.success },
    bidModeOfferText: { color: COLORS.primary },
    bidModeSub: { fontSize: 10, color: COLORS.secondaryText, textAlign: 'center' },
    offerFields: { gap: 14 },
    fieldLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.secondaryText, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    offerInput: { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    offerInputError: { borderColor: '#EF4444' },
    reasonInput: { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: COLORS.text, minHeight: 80, textAlignVertical: 'top' },
    errorMsg: { fontSize: 12, color: '#EF4444', marginTop: 4 },
    submitBidBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', ...SHADOWS.small },
    submitBidBtnDisabled: { opacity: 0.6 },
    submitBidBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    auctionHint: { fontSize: 11, color: COLORS.secondaryText, textAlign: 'center' },

    // ── Bid Status Card (matches screenshot) ──
    bidCard: { borderRadius: 16, borderWidth: 1.5, borderColor: GOLD_BORDER, backgroundColor: GOLD_BG, padding: 16, gap: 12 },
    bidCardRejected: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
    bidCardCounter: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
    bidCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bidCardHeaderAccepted: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bidCardHeaderIcon: { fontSize: 22 },
    bidCardTitle: { fontSize: 18, fontWeight: 'bold', color: GOLD },
    bidInfoBox: { backgroundColor: 'white', borderRadius: 12, padding: 14, gap: 10, ...SHADOWS.small },
    bidInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bidInfoColGroup: { gap: 4 },
    bidInfoDivider: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 10 },
    bidInfoDividerLine: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
    bidInfoLabel: { fontSize: 14, color: COLORS.secondaryText },
    bidInfoValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
    bidInfoValueNote: { fontSize: 14, color: COLORS.text, fontStyle: 'italic' },
    bidWaitingText: { fontSize: 14, color: GOLD, fontWeight: '600', textAlign: 'center' },
    bidAcceptedText: { fontSize: 15, color: '#16A34A', fontWeight: '600', textAlign: 'center' },
    withdrawBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: GOLD, backgroundColor: 'white' },
    withdrawBtnText: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
    retryBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.primary },
    retryBtnText: { fontSize: 15, fontWeight: 'bold', color: 'white' },
    counterActions: { gap: 10 },
    acceptCounterBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.success },
    acceptCounterBtnText: { fontSize: 15, fontWeight: 'bold', color: 'white' },

    // Items
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
    itemQtyBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.primary}15`, justifyContent: 'center', alignItems: 'center' },
    itemQtyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
    itemName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
    itemNote: { fontSize: 12, color: '#D97706', marginTop: 4, fontStyle: 'italic' },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.secondaryText,
        marginBottom: 20,
    },
    navOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 10,
        backgroundColor: 'white',
        ...SHADOWS.small,
    },
    navOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navOptionText: {
        flex: 1,
    },
    navOptionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    navOptionSubtitle: {
        fontSize: 12,
        color: COLORS.secondaryText,
        marginTop: 2,
    },
    cancelNavBtn: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 6,
    },
    cancelNavBtnText: {
        fontSize: 15,
        color: COLORS.secondaryText,
        fontWeight: '600',
    },
});
