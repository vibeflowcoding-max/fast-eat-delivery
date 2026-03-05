import { useRouter } from 'expo-router';
import { MapPin, Navigation, Store } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../src/constants/Theme';
import { OrderService } from '../src/services/OrderService';
import { Order } from '../src/types/database';

export default function ActiveOrderScreen() {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadOrder = async () => {
        try {
            const data = await OrderService.getCurrentActiveOrder();
            if (!data) {
                router.back();
                return;
            }
            setOrder(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, []);

    const openMaps = (address: string) => {
        const url = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(address)}`,
            android: `geo:0,0?q=${encodeURIComponent(address)}`,
        });
        if (url) Linking.openURL(url);
    };

    const openWaze = (address: string) => {
        const url = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
        Linking.openURL(url);
    };

    const handleNextStage = async () => {
        if (!order) return;
        try {
            setActionLoading(true);
            if (order.status_id === 8) {
                await OrderService.updateStatus(order.id, 11); // Set to DELIVERING
                await loadOrder();
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo actualizar el estado');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!order) return;
        try {
            setActionLoading(true);
            await OrderService.finalizeDelivery(order.id, code);
            Alert.alert('¡Éxito!', 'Entrega finalizada correctamente', [
                { text: 'OK', onPress: () => (router as any).replace('/(tabs)/history') }
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Código incorrecto');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <View style={[styles.container, styles.centered]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );

    if (!order) return null;

    const isInTransit = order.status_id === 11;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {isInTransit ? '🚴 EN CAMINO' : '👨‍🍳 EN PREPARACIÓN'}
                        </Text>
                    </View>
                    <Text style={styles.orderTitle}>{order.restaurants?.name}</Text>
                    <Text style={styles.orderNumber}>Orden #{order.order_number}</Text>
                </View>

                {/* Restaurant Section */}
                <View style={[styles.card, styles.pickupCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                            <Store size={20} color="#9A3412" />
                            <Text style={styles.cardTitle}>Recoger en:</Text>
                        </View>
                        <View style={styles.etaBadge}>
                            <Text style={styles.etaEmoji}>🚗</Text>
                            <Text style={styles.etaText}>Aprox: 10 min</Text>
                        </View>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.mainInfo}>{order.restaurants?.name}</Text>
                        <Text style={styles.subInfo}>{order.restaurants?.address}</Text>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.outlineButton} onPress={() => openMaps(order.restaurants?.address || '')}>
                                <MapPin size={18} color={COLORS.primary} />
                                <Text style={styles.outlineButtonText}>Ubicación 📍</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Customer Section */}
                <View style={[styles.card, styles.deliveryCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                            <Navigation size={20} color="#1E3A8A" />
                            <Text style={[styles.cardTitle, { color: '#1E3A8A' }]}>Entregar a:</Text>
                        </View>
                        <View style={[styles.etaBadge, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
                            <Text style={styles.etaEmoji}>🚗</Text>
                            <Text style={[styles.etaText, { color: '#1E3A8A' }]}>Aprox: 15 min</Text>
                        </View>
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.customerRow}>
                            <View style={styles.avatarMini}>
                                <Text style={styles.avatarMiniText}>👤</Text>
                            </View>
                            <View>
                                <Text style={styles.customerLabel}>Cliente</Text>
                                <Text style={styles.mainInfo}>Cliente Fast Eat</Text>
                            </View>
                        </View>

                        <View style={styles.addressBox}>
                            <Text style={styles.customerLabel}>Destino</Text>
                            <Text style={styles.subInfo}>{order.delivery_address}</Text>

                            <View style={styles.navButtons}>
                                <TouchableOpacity style={styles.navBtn} onPress={() => openMaps(order.delivery_address)}>
                                    <Text style={styles.navBtnEmoji}>🗺️</Text>
                                    <Text style={styles.navBtnText}>Maps</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navBtn} onPress={() => openWaze(order.delivery_address)}>
                                    <Text style={styles.navBtnEmoji}>🚙</Text>
                                    <Text style={styles.navBtnText}>Waze</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsCard}>
                    <Text style={styles.sectionLabel}>Resumen del pedido</Text>
                    {order.order_number && (
                        <View style={styles.itemRow}>
                            <Text style={styles.itemText}>1x Combo de la casa</Text>
                        </View>
                    )}
                </View>

                {/* Confirmation Code */}
                {isInTransit && (
                    <View style={styles.validationCard}>
                        <View style={styles.validationHeader}>
                            <Text style={styles.validationLabel}>CONFIRMACIÓN DE ENTREGA</Text>
                            <Text style={styles.validationDesc}>Solicita el código al cliente para finalizar el pedido.</Text>
                        </View>
                        <TextInput
                            style={styles.codeInput}
                            value={code}
                            onChangeText={setCode}
                            placeholder="000000"
                            placeholderTextColor="#94A3B8"
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.mainActionButton, (isInTransit && code.length < 6) && styles.buttonDisabled]}
                    onPress={isInTransit ? handleFinalize : handleNextStage}
                    disabled={actionLoading || (isInTransit && code.length < 6)}
                >
                    {actionLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.mainActionButtonText}>
                            {isInTransit ? '✅ FINALIZAR ENTREGA' : '🚴 YA RECOGÍ EL PEDIDO'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#92400E',
    },
    orderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    orderNumber: {
        fontSize: 14,
        color: COLORS.secondaryText,
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    pickupCard: {
        backgroundColor: '#FFF7ED',
        borderColor: '#FFEDD5',
    },
    deliveryCard: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9A3412',
    },
    etaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    etaEmoji: {
        fontSize: 12,
    },
    etaText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#166534',
    },
    cardBody: {
        gap: 8,
    },
    mainInfo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subInfo: {
        fontSize: 14,
        color: COLORS.secondaryText,
        lineHeight: 20,
    },
    buttonRow: {
        marginTop: 12,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'white',
        paddingVertical: 10,
        borderRadius: 12,
    },
    outlineButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    avatarMini: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarMiniText: {
        fontSize: 20,
    },
    customerLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3B82F6',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    addressBox: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        borderRadius: 16,
    },
    navButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    navBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        paddingVertical: 10,
        borderRadius: 12,
        ...SHADOWS.small,
    },
    navBtnEmoji: {
        fontSize: 16,
    },
    navBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    itemsCard: {
        padding: 12,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.secondaryText,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    itemRow: {
        paddingVertical: 4,
    },
    itemText: {
        fontSize: 14,
        color: COLORS.text,
    },
    validationCard: {
        backgroundColor: 'rgba(106, 114, 130, 0.05)',
        borderWidth: 2,
        borderColor: COLORS.primary + '20',
        borderRadius: 24,
        padding: 20,
        marginVertical: 16,
    },
    validationHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    validationLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 1,
    },
    validationDesc: {
        fontSize: 13,
        color: COLORS.secondaryText,
        textAlign: 'center',
        marginTop: 4,
    },
    codeInput: {
        backgroundColor: 'white',
        height: 64,
        borderRadius: 16,
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 10,
        borderWidth: 2,
        borderColor: COLORS.primary + '10',
    },
    mainActionButton: {
        backgroundColor: COLORS.success,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 40,
        ...SHADOWS.medium,
    },
    mainActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
        backgroundColor: COLORS.secondaryText,
    },
});
