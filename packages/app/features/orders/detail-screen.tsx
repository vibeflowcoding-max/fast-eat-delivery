'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user.service';
import type { OrderWithDetails } from '../../schemas/order.schema';
import { Badge } from '@delivery-app/ui';
import { useGeolocation } from '../../hooks/use-geolocation';
import { calculateDistanceKm, estimateETA } from '../../lib/utils/distance';
import { BiddingPanel } from './bidding-panel';

interface OrderDetailScreenProps {
    id: string;
}

export function OrderDetailScreen({ id }: OrderDetailScreenProps) {
    const router = useRouter();
    const { location } = useGeolocation();
    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setIsLoading(true);
            const user = await UserService.getCurrentUser();
            setUserId(user?.id || null);
            const data = await OrderService.getOrderById(id);
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar los detalles de la orden');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptOrder = async () => {
        try {
            setIsAccepting(true);
            const user = await UserService.getCurrentUser();
            if (!user) {
                setError('Debes iniciar sesión para aceptar órdenes');
                return;
            }
            await OrderService.acceptOrder(id, user.id);
            // Optionally redirect to active orders list or map
            router.push('/dashboard/feed');
        } catch (err: any) {
            setError(err.message || 'Error al aceptar la orden');
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#FF3A30" />
                <Text className="text-gray-600 mt-4">Cargando detalles...</Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View className="flex-1 p-6 items-center justify-center">
                <Text className="text-red-600 mb-4">{error || 'Orden no encontrada'}</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-brand-primary px-6 py-3 rounded-lg">
                    <Text className="text-white font-bold">Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const distToRest = location && order.restaurant?.latitude && order.restaurant?.longitude
        ? calculateDistanceKm(location.lat, location.lng, order.restaurant.latitude, order.restaurant.longitude)
        : null;
    const etaRest = distToRest ? estimateETA(distToRest) : null;

    const isAvailable = order.status_id === 7 && !order.delivery_id;

    const openMap = (lat: number, lng: number, app: 'waze' | 'maps') => {
        if (app === 'waze') {
            Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
            <ScrollView className="flex-1">
                <View className="p-4 md:p-8 max-w-3xl mx-auto w-full">
                    <View className="mb-4">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-brand-primary font-bold">← Volver al Feed</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header Map/Info Placeholder */}
                        <View className="bg-[#F3F4F6] justify-end p-4 pt-8 border-b border-gray-100">
                            <Text className="font-heading text-2xl font-bold text-brand-text">
                                {order.restaurant?.name || 'Restaurante'}
                            </Text>
                            <Text className="text-gray-600 text-sm mb-3">
                                {order.restaurant?.address || 'Dirección no disponible'}
                            </Text>

                            {(order.restaurant?.latitude && order.restaurant?.longitude) ? (
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => openMap(order.restaurant.latitude!, order.restaurant.longitude!, 'waze')}
                                        className="bg-[#05C8F2] px-4 py-2 rounded-lg flex-row items-center flex-1 justify-center"
                                    >
                                        <Text className="text-white font-bold text-sm">📍 Waze (Restaurante)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => openMap(order.restaurant.latitude!, order.restaurant.longitude!, 'maps')}
                                        className="bg-[#4285F4] px-4 py-2 rounded-lg flex-row items-center flex-1 justify-center"
                                    >
                                        <Text className="text-white font-bold text-sm">📍 Maps (Restaurante)</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                        </View>

                        {/* Order Meta */}
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <View>
                                <Text className="text-sm text-gray-500 mb-1">Orden #{order.order_number || order.id.slice(0, 8)}</Text>
                                <Text className="text-xs text-gray-400">
                                    {new Date(order.created_at || '').toLocaleString('es-CR')}
                                </Text>
                            </View>
                            <Badge variant="default" className={isAvailable ? "bg-blue-100 border border-blue-200" : "bg-green-100 border border-green-200"}>
                                <Text className={isAvailable ? "text-blue-800 font-bold" : "text-green-800 font-bold"}>
                                    {isAvailable ? '💰 En Subasta' : '✅ Asignada'}
                                </Text>
                            </Badge>
                        </View>

                        {/* Customer Info */}
                        <View className="p-6 border-b border-gray-100">
                            <Text className="text-lg font-bold mb-4 font-heading text-brand-text">Detalles de Entrega</Text>

                            <View className="bg-brand-background rounded-lg p-4 space-y-3">
                                <View>
                                    <Text className="text-xs text-brand-primary uppercase font-bold tracking-wider mb-1">Cliente</Text>
                                    <Text className="font-medium text-brand-text">{order.customer?.name}</Text>
                                    <Text className="text-sm text-gray-600">{order.customer?.phone}</Text>
                                </View>
                                <View className="h-[1px] bg-gray-200 my-2" />
                                <View>
                                    <Text className="text-xs text-brand-primary uppercase font-bold tracking-wider mb-1">Destino</Text>
                                    <Text className="text-brand-text leading-tight">{order.customer?.address}</Text>

                                    {(order.customer_latitude && order.customer_longitude) ? (
                                        <View className="flex-row gap-3 mt-4">
                                            <TouchableOpacity
                                                onPress={() => openMap(order.customer_latitude!, order.customer_longitude!, 'waze')}
                                                className="bg-[#05C8F2] px-4 py-2 rounded-lg flex-row items-center flex-1 justify-center"
                                            >
                                                <Text className="text-white font-bold text-sm">📍 Waze (Cliente)</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => openMap(order.customer_latitude!, order.customer_longitude!, 'maps')}
                                                className="bg-[#4285F4] px-4 py-2 rounded-lg flex-row items-center flex-1 justify-center"
                                            >
                                                <Text className="text-white font-bold text-sm">📍 Maps (Cliente)</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        {/* Actions */}
                        <View className="p-6 bg-gray-50">
                            {isAvailable && userId ? (
                                <View className="space-y-6">
                                    {etaRest && (
                                        <View className="bg-green-100 p-3 rounded-lg border border-green-200 flex-row items-center justify-center mb-2">
                                            <Text className="text-green-800 text-sm font-semibold">
                                                🚗 A aprox. {etaRest} min de tu ubicación actual
                                            </Text>
                                        </View>
                                    )}

                                    <BiddingPanel
                                        orderId={order.id}
                                        driverId={userId}
                                        basePrice={order.delivery_base_price || 2500}
                                        distance={order.delivery_distance_km || distToRest}
                                        onBidAccepted={() => {
                                            Alert.alert('¡Excelente!', 'Has tomado la orden con éxito.');
                                            router.push('/dashboard/active-order');
                                        }}
                                    />
                                </View>
                            ) : isAvailable && !userId ? (
                                <View className="w-full">
                                    <TouchableOpacity
                                        onPress={() => router.push('/login')}
                                        className="bg-brand-primary py-4 rounded-xl items-center shadow-sm"
                                    >
                                        <Text className="text-white font-bold text-lg">Inicia Sesión para Ofertar</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="items-center p-4 bg-gray-100 rounded-lg">
                                    <Text className="text-gray-600 font-medium">Esta orden ya fue tomada o no está disponible.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
