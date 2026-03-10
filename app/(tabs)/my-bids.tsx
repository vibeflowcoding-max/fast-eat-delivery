import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../src/constants/Theme';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuctionService } from '../../src/services/AuctionService';

type Bid = {
    id: string;
    status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
    driver_offer: number | null;
    base_price: number;
    customer_counter_offer: number | null;
    final_price: number | null;
    order_id: string;
    driver_notes: string | null;
    created_at: string;

    expires_at: string | null;
    order: {
        id: string;
        order_number: number | null;
        delivery_address: string | null;
        status_id: number;
        total: number | null;
        restaurant: { name: string; address: string | null } | null;
        customer: { name: string; phone: string } | null;
    } | null;
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `Hace ${min}m`;
    return `Hace ${Math.floor(min / 60)}h`;
}

function StatusBadge({ status, counterOffer }: { status: Bid['status']; counterOffer?: number | null }) {
    const maps: Record<Bid['status'], { label: string; bg: string; text: string }> = {
        pending: { label: '⏳ Esperando...', bg: '#FEF9C3', text: '#92400E' },
        countered: { label: `🔄 Contraoferta${counterOffer ? ` ₡${counterOffer.toLocaleString()}` : ''}`, bg: '#FEF3C7', text: '#D97706' },
        accepted: { label: '✅ Aceptada', bg: '#D1FAE5', text: '#065F46' },
        rejected: { label: '❌ Rechazada', bg: '#FEE2E2', text: '#991B1B' },
        withdrawn: { label: '↩️ Retirada', bg: '#F3F4F6', text: '#6B7280' },
        expired: { label: '⌛ Expirada', bg: '#F3F4F6', text: '#6B7280' },
    };
    const c = maps[status] || maps.pending;
    return (
        <View style={[badgeS.wrap, { backgroundColor: c.bg }]}>
            <Text style={[badgeS.text, { color: c.text }]}>{c.label}</Text>
        </View>
    );
}
const badgeS = StyleSheet.create({
    wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
    text: { fontSize: 12, fontWeight: '700' },
});

export default function MyBidsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [withdrawing, setWithdrawing] = useState<string | null>(null);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [bidToWithdraw, setBidToWithdraw] = useState<Bid | null>(null);


    const load = useCallback(async () => {
        if (!user) return;
        try {
            const data = await AuctionService.getDriverActiveBids(user.id);
            setBids(data as Bid[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        load();
        // real-time subscription: listen for any changes to this driver's bids
        if (!user) return;
        const bidChannel = supabase
            .channel('my_bids_realtime')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'delivery_bids',
                filter: `driver_id=eq.${user.id}`,
            }, () => load())
            .subscribe();

        // Also listen to orders to remove bids if another driver takes the order
        const orderChannel = supabase
            .channel('my_bids_orders_realtime')
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'orders'
            }, (payload) => {
                const updatedOrder = payload.new;
                // If order is no longer active (7) or assigned to someone else (8 but not this driver)
                const isNoLongerAvailable =
                    (updatedOrder.status_id !== 7 && updatedOrder.status_id !== 8) ||
                    (updatedOrder.delivery_id !== null && updatedOrder.delivery_id !== user.id);

                if (isNoLongerAvailable) {
                    setBids(prev => prev.filter(b => b.order_id !== updatedOrder.id));
                }
            })
            .subscribe();

        return () => {
            bidChannel.unsubscribe();
            orderChannel.unsubscribe();
        };
    }, [user, load]);


    const handleWithdrawClick = (bid: Bid) => {
        setBidToWithdraw(bid);
        setConfirmModalVisible(true);
    };

    const performWithdraw = async () => {
        if (!user || !bidToWithdraw) return;
        setWithdrawing(bidToWithdraw.id);
        try {
            await AuctionService.withdrawBid(bidToWithdraw.id, user.id);
            setBids(prev => prev.filter(b => b.id !== bidToWithdraw.id));
            setConfirmModalVisible(false);
            setBidToWithdraw(null);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setWithdrawing(null);
        }
    };


    const myOffer = (bid: Bid) => bid.driver_offer || bid.base_price;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>💰 Mis Subastas</Text>
                <Text style={styles.headerSub}>{bids.length} oferta{bids.length !== 1 ? 's' : ''} activa{bids.length !== 1 ? 's' : ''}</Text>
            </View>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
                >
                    {bids.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyIcon}>🛵</Text>
                            <Text style={styles.emptyTitle}>Sin subastas activas</Text>
                            <Text style={styles.emptySub}>Cuando envíes una oferta de delivery aparecerá aquí en tiempo real.</Text>
                        </View>
                    ) : (
                        bids.map(bid => (
                            <TouchableOpacity
                                key={bid.id}
                                style={styles.bidCard}
                                onPress={() => (router as any).push(`/order-details?orderId=${bid.order?.id}`)}
                                activeOpacity={0.85}
                            >
                                {/* Header */}
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.restaurantName} numberOfLines={1}>
                                            {bid.order?.restaurant?.name || 'Restaurante'}
                                        </Text>
                                        <Text style={styles.orderNum}>
                                            Orden #{bid.order?.order_number || bid.order?.id?.slice(0, 8)}
                                            {' · '}{timeAgo(bid.created_at)}
                                        </Text>
                                    </View>
                                    <StatusBadge status={bid.status} counterOffer={bid.customer_counter_offer} />
                                </View>

                                <View style={styles.divider} />

                                {/* Price info */}
                                <View style={styles.priceRow}>
                                    <View style={styles.priceCol}>
                                        <Text style={styles.priceLabel}>Tu oferta</Text>
                                        <Text style={styles.priceValue}>₡{myOffer(bid).toLocaleString()}</Text>
                                    </View>
                                    {bid.customer_counter_offer && (
                                        <View style={[styles.priceCol, styles.counterCol]}>
                                            <Text style={[styles.priceLabel, { color: '#D97706' }]}>Contraoferta</Text>
                                            <Text style={[styles.priceValue, { color: '#D97706' }]}>₡{bid.customer_counter_offer.toLocaleString()}</Text>
                                        </View>
                                    )}
                                    <View style={styles.priceCol}>
                                        <Text style={styles.priceLabel}>Base</Text>
                                        <Text style={[styles.priceValue, { color: COLORS.secondaryText, fontSize: 14 }]}>₡{bid.base_price.toLocaleString()}</Text>
                                    </View>
                                </View>

                                {/* Delivery address */}
                                {bid.order?.delivery_address && (
                                    <Text style={styles.address} numberOfLines={1}>
                                        📍 {bid.order.delivery_address}
                                    </Text>
                                )}

                                {/* Note */}
                                {bid.driver_notes && (
                                    <Text style={styles.note} numberOfLines={2}>
                                        📝 {bid.driver_notes}
                                    </Text>
                                )}

                                {/* Actions */}
                                {(bid.status === 'pending' || bid.status === 'countered') && (
                                    <TouchableOpacity
                                        style={styles.withdrawBtn}
                                        onPress={() => handleWithdrawClick(bid)}
                                        disabled={withdrawing === bid.id}
                                    >
                                        {withdrawing === bid.id
                                            ? <ActivityIndicator size="small" color={COLORS.text} />
                                            : <Text style={styles.withdrawBtnText}>Retirar Oferta</Text>}
                                    </TouchableOpacity>
                                )}


                                {bid.status === 'countered' && bid.customer_counter_offer && (
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => (router as any).push(`/order-details?orderId=${bid.order?.id}`)}
                                    >
                                        <Text style={styles.acceptBtnText}>
                                            ✅ Ver contraoferta · ₡{bid.customer_counter_offer.toLocaleString()}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Custom Confirmation Modal */}
            <Modal
                visible={confirmModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => !withdrawing && setConfirmModalVisible(false)}
            >
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.content}>
                        <View style={modalStyles.iconContainer}>
                            <Text style={modalStyles.icon}>↩️</Text>
                        </View>
                        <Text style={modalStyles.title}>¿Retirar esta oferta?</Text>
                        <Text style={modalStyles.subtitle}>
                            Esta acción cancelará tu oferta actual para la orden #{bidToWithdraw?.order?.order_number || bidToWithdraw?.order?.id?.slice(0, 8)}.
                        </Text>

                        <View style={modalStyles.actions}>
                            <TouchableOpacity
                                style={[modalStyles.btn, modalStyles.cancelBtn]}
                                onPress={() => setConfirmModalVisible(false)}
                                disabled={!!withdrawing}
                            >
                                <Text style={modalStyles.cancelBtnText}>Volver</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[modalStyles.btn, modalStyles.confirmBtn]}
                                onPress={performWithdraw}
                                disabled={!!withdrawing}
                            >
                                {withdrawing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={modalStyles.confirmBtnText}>Sí, Retirar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    headerSub: { fontSize: 13, color: COLORS.secondaryText, marginTop: 2 },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    emptySub: { fontSize: 14, color: COLORS.secondaryText, textAlign: 'center', lineHeight: 22 },
    bidCard: {
        backgroundColor: 'white', borderRadius: 20, padding: 16,
        ...SHADOWS.medium, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', gap: 12,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    restaurantName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    orderNum: { fontSize: 12, color: COLORS.secondaryText, marginTop: 2 },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
    priceRow: { flexDirection: 'row', gap: 8 },
    priceCol: { flex: 1, alignItems: 'center' },
    counterCol: {
        borderRadius: 12, backgroundColor: '#FEF3C7', padding: 8, borderWidth: 1, borderColor: '#FCD34D',
    },
    priceLabel: { fontSize: 10, color: COLORS.secondaryText, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    priceValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    address: { fontSize: 12, color: COLORS.secondaryText },
    note: { fontSize: 12, color: '#D97706', fontStyle: 'italic' },
    withdrawBtn: {
        paddingVertical: 12, alignItems: 'center', borderRadius: 12,
        borderWidth: 1.5, borderColor: '#D97706', backgroundColor: '#FFFBEB',
    },
    withdrawBtnText: { fontSize: 14, fontWeight: '700', color: '#92400E' },
    acceptBtn: { paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.success },
    acceptBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: { fontSize: 32 },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.secondaryText,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F3F4F6',
    },
    cancelBtnText: {
        color: COLORS.text,
        fontWeight: 'bold',
    },
    confirmBtn: {
        backgroundColor: '#D97706',
    },
    confirmBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

