import { ChevronRight, Navigation, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../constants/Theme';
import { AuctionService } from '../services/AuctionService';
import { RouteResult } from '../services/GoogleMapsService';
import { Order } from '../types/database';

interface OrderCardProps {
    order: Order & {
        customer?: { name?: string; full_name?: string; first_name?: string; last_name?: string; latitude?: number; longitude?: number } | null;
    };
    routeToRestaurant?: RouteResult | null;
    onDetails: () => void;
}

function distanceBetween(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(dateStr: string): string {
    if (!dateStr) return '---';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h ${minutes % 60}m`;
    return `Hace ${Math.floor(hours / 24)} días`;
}

function getCustomerName(order: OrderCardProps['order']): string {
    if (order.customer?.name) return order.customer.name;
    if (order.customer?.full_name) return order.customer.full_name;
    if (order.customer?.first_name) {
        return [order.customer.first_name, order.customer.last_name].filter(Boolean).join(' ');
    }
    return 'Cliente';
}

export function OrderCard({ order, routeToRestaurant, onDetails }: OrderCardProps) {
    const [navModalVisible, setNavModalVisible] = useState(false);

    const restaurant = (order as any).restaurants || (order as any).restaurant;
    const restaurantAddress = restaurant?.address || '';
    const restaurantLat = restaurant?.latitude;
    const restaurantLng = restaurant?.longitude;

    // Coordinate detection for delivery distance
    const cLat = (order as any).customer_latitude || order.customer?.latitude;
    const cLng = (order as any).customer_longitude || order.customer?.longitude;

    // Calculate distance between restaurant and customer
    const deliveryDistKm = distanceBetween(restaurantLat, restaurantLng, cLat, cLng);

    // [FIX] Price calculation fallback matching order-details.tsx
    // Priority: DB Field -> DB Distance calculation -> Estimated distance calculation -> Default
    const basePrice = (order as any).delivery_base_price ||
        AuctionService.calculateBasePrice(
            deliveryDistKm ||
            (order as any).delivery_distance_km ||
            3.5
        );

    const openGoogleMaps = () => {
        const target = restaurantLat && restaurantLng
            ? `${restaurantLat},${restaurantLng}`
            : encodeURIComponent(restaurantAddress);
        const url = `https://maps.google.com/?q=${target}`;
        Linking.openURL(url);
        setNavModalVisible(false);
    };

    const openWaze = () => {
        const url = restaurantLat && restaurantLng
            ? `https://waze.com/ul?ll=${restaurantLat},${restaurantLng}&navigate=yes`
            : `https://waze.com/ul?q=${encodeURIComponent(restaurantAddress)}&navigate=yes`;
        Linking.openURL(url);
        setNavModalVisible(false);
    };

    const openNativeMaps = () => {
        const query = encodeURIComponent(restaurantAddress);
        const url = Platform.select({
            ios: `maps:0,0?q=${query}`,
            android: `geo:0,0?q=${query}`,
        });
        if (url) Linking.openURL(url);
        setNavModalVisible(false);
    };

    return (
        <>
            <View style={styles.card}>
                {/* Header: Restaurant + Badges */}
                <View style={styles.header}>
                    <View style={styles.restaurantInfo}>
                        <View style={styles.restaurantNameRow}>
                            <Store size={16} color={COLORS.primary} />
                            <Text style={styles.restaurantName} numberOfLines={1}>
                                {restaurant?.name || 'Restaurante'}
                            </Text>
                        </View>
                        <Text style={styles.restaurantAddress} numberOfLines={1}>
                            {restaurantAddress && !restaurantAddress.toLowerCase().startsWith('lat')
                                ? restaurantAddress
                                : ''}
                        </Text>
                    </View>
                    <View style={styles.badges}>
                        {order.status_id === 7 && (
                            <View style={styles.auctionBadge}>
                                <Text style={styles.auctionBadgeText}>💰 EN SUBASTA</Text>
                            </View>
                        )}
                        <View style={styles.basePriceBadge}>
                            <Text style={styles.basePriceText}>
                                BASE: ₡{basePrice.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Route Info + Navigate Button */}
                <View style={styles.routeRow}>
                    <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Dist. al Rest.</Text>
                        {routeToRestaurant ? (
                            <>
                                <Text style={styles.routeDistance}>
                                    {routeToRestaurant.distanceKm > 0
                                        ? `${routeToRestaurant.distanceKm.toFixed(1)} km`
                                        : '---'}
                                </Text>
                                {routeToRestaurant.durationMin > 0 && (
                                    <Text style={styles.routeEta}>
                                        ~{routeToRestaurant.durationMin} min ETA
                                    </Text>
                                )}
                            </>
                        ) : (
                            <Text style={styles.routeDistance}>---</Text>
                        )}
                    </View>

                    {/* Restaurant to Customer Distance */}
                    <View style={[styles.routeInfo, { borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)', paddingLeft: 12 }]}>
                        <Text style={styles.routeLabel}>Dist. Entrega</Text>
                        <Text style={styles.routeDistance}>
                            {deliveryDistKm > 0 ? `${deliveryDistKm.toFixed(1)} km` : '---'}
                        </Text>
                        <Text style={styles.routeEta}>Rest. → Cliente</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => setNavModalVisible(true)}
                    >
                        <Navigation size={16} color={COLORS.text} />
                        <Text style={styles.navigateButtonText}>Navegar</Text>
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Customer + Time Row */}
                <View style={styles.customerRow}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerLabel}>CLIENTE</Text>
                        <Text style={styles.customerName}>{getCustomerName(order)}</Text>
                    </View>
                    <View style={styles.timeInfo}>
                        <Text style={styles.timeText}>{timeAgo(order.created_at)}</Text>
                        <TouchableOpacity onPress={onDetails} style={styles.detailsArrow}>
                            <Text style={styles.detailsArrowText}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Details Button */}
                <TouchableOpacity style={styles.detailsButton} onPress={onDetails}>
                    <Text style={styles.detailsButtonText}>Ver detalles</Text>
                    <ChevronRight size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Navigation Modal */}
            <Modal
                visible={navModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setNavModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setNavModalVisible(false)}
                >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Navegar al Restaurante</Text>
                        <Text style={styles.modalSubtitle} numberOfLines={2}>
                            {restaurantAddress || restaurant?.name || 'Destino'}
                        </Text>

                        <TouchableOpacity style={styles.navOption} onPress={openGoogleMaps}>
                            <View style={styles.navOptionIcon}>
                                <Text style={{ fontSize: 22 }}>🗺️</Text>
                            </View>
                            <View style={styles.navOptionText}>
                                <Text style={styles.navOptionTitle}>Google Maps</Text>
                                <Text style={styles.navOptionSubtitle}>Ver ruta y tráfico</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.navOption} onPress={openWaze}>
                            <View style={styles.navOptionIcon}>
                                <Text style={{ fontSize: 22 }}>🚗</Text>
                            </View>
                            <View style={styles.navOptionText}>
                                <Text style={styles.navOptionTitle}>Waze</Text>
                                <Text style={styles.navOptionSubtitle}>Optimizado para ahorrar tiempo</Text>
                            </View>
                        </TouchableOpacity>

                        {Platform.OS !== 'web' && (
                            <TouchableOpacity style={styles.navOption} onPress={openNativeMaps}>
                                <View style={styles.navOptionIcon}>
                                    <Text style={{ fontSize: 22 }}>📱</Text>
                                </View>
                                <View style={styles.navOptionText}>
                                    <Text style={styles.navOptionTitle}>Mapas del Sistema</Text>
                                    <Text style={styles.navOptionSubtitle}>Abrir en app nativa</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.cancelNavBtn}
                            onPress={() => setNavModalVisible(false)}
                        >
                            <Text style={styles.cancelNavBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    restaurantInfo: {
        flex: 1,
        marginRight: 8,
    },
    restaurantNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
    },
    restaurantAddress: {
        fontSize: 11,
        color: COLORS.secondaryText,
    },
    badges: {
        alignItems: 'flex-end',
        gap: 6,
    },
    auctionBadge: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    auctionBadgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1D4ED8',
        letterSpacing: 0.5,
    },
    basePriceBadge: {
        backgroundColor: `${COLORS.primary}10`,
        borderColor: `${COLORS.primary}30`,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    basePriceText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginVertical: 12,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    routeInfo: {
        flex: 1,
    },
    routeLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: COLORS.secondaryText,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    routeDistance: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        lineHeight: 28,
    },
    routeEta: {
        fontSize: 10,
        color: COLORS.secondaryText,
        marginTop: 2,
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        flex: 1,
    },
    navigateButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    customerInfo: {
        flex: 1,
    },
    customerLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: COLORS.secondaryText,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    customerName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.secondaryText,
    },
    detailsArrow: {
        padding: 4,
    },
    detailsArrowText: {
        fontSize: 20,
        color: COLORS.secondaryText,
        lineHeight: 22,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 14,
    },
    detailsButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 0.5,
    },
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
