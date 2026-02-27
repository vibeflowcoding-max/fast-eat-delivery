'use client';

import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Link } from 'solito/link';
import { OrderService } from '../../services/order.service';
import { Badge } from '@delivery-app/ui';
import type { OrderWithDetails } from '../../schemas/order.schema';
import { useGeolocation } from '../../hooks/use-geolocation';
import { calculateDistanceKm, estimateETA } from '../../lib/utils/distance';

interface AvailableOrdersListProps {
    userId: string;
}

export function AvailableOrdersList({ userId }: AvailableOrdersListProps) {
    const openMap = (lat: number, lng: number, app: 'waze' | 'maps') => {
        if (app === 'waze') {
            Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        }
    };
    const { location } = useGeolocation();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        loadOrders();

        // Subscribe to real-time updates
        const channel = OrderService.subscribeToReadyOrders((payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const status = payload.new.status_id;
                // Only Auction Active (7)
                if (status === 7) {
                    loadOrders();
                } else {
                    setOrders((prev) => prev.filter((o) => o.id !== payload.new.id));
                }
            } else if (payload.eventType === 'DELETE') {
                setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const data = await OrderService.getReadyDeliveryOrders();
            setOrders(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar órdenes');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && orders.length === 0) {
        return (
            <View className="items-center py-12">
                <ActivityIndicator size="large" color="#FF3A30" className="mb-4" />
                <Text className="text-gray-600">Cargando órdenes...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="p-4 rounded-lg bg-red-100 border border-red-300">
                <Text className="text-red-600">{error}</Text>
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View className="items-center py-12 bg-white rounded-[16px] border border-brand-accent px-4">
                <Text className="text-6xl mb-4">📦</Text>
                <Text className="text-xl font-heading font-bold text-center text-brand-text mb-2">
                    No hay órdenes disponibles en este momento
                </Text>
                <Text className="text-brand-text opacity-60 mb-4 text-center">
                    Las nuevas órdenes aparecerán aquí automáticamente.
                </Text>
                <Text className="text-sm text-brand-text opacity-50 text-center">
                    💡 Tip: Asegúrate de estar "Online" para recibir notificaciones
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-col md:flex-row md:flex-wrap gap-4">
            {orders.map((order) => {
                const distToRest = location && order.restaurant?.latitude && order.restaurant?.longitude
                    ? calculateDistanceKm(location.lat, location.lng, order.restaurant.latitude, order.restaurant.longitude)
                    : null;
                const etaRest = distToRest ? estimateETA(distToRest) : null;

                const distToCust = order.restaurant?.latitude && order.restaurant?.longitude && order.customer_latitude && order.customer_longitude
                    ? calculateDistanceKm(order.restaurant.latitude, order.restaurant.longitude, order.customer_latitude, order.customer_longitude)
                    : null;
                const etaCust = distToCust ? estimateETA(distToCust) : null;

                return (
                    <Link
                        key={order.id}
                        href={`/dashboard/orders/${order.id}`}
                    >
                        <View className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm w-full md:w-[350px]">
                            {/* Header */}
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-1 pr-2">
                                    <Text className="font-heading text-lg font-bold text-brand-text leading-tight">
                                        {order.restaurant?.name || 'Restaurante'}
                                    </Text>
                                    <Text className="text-sm text-gray-600 mt-1 mb-2">
                                        {order.restaurant?.address || 'Dirección no disponible'}
                                    </Text>

                                    {(order.restaurant?.latitude && order.restaurant?.longitude) ? (
                                        <View className="flex-row gap-2 mt-1">
                                            <Pressable
                                                onPress={(e) => {
                                                    e.preventDefault();
                                                    openMap(order.restaurant.latitude!, order.restaurant.longitude!, 'waze')
                                                }}
                                                className="bg-[#05C8F2] px-2 py-1 rounded-md"
                                            >
                                                <Text className="text-white text-[10px] font-bold">📍 Waze</Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={(e) => {
                                                    e.preventDefault();
                                                    openMap(order.restaurant.latitude!, order.restaurant.longitude!, 'maps')
                                                }}
                                                className="bg-[#4285F4] px-2 py-1 rounded-md"
                                            >
                                                <Text className="text-white text-[10px] font-bold">📍 Maps</Text>
                                            </Pressable>
                                        </View>
                                    ) : null}
                                </View>
                                <View className="items-end gap-2">
                                    {order.status_id === 3 && (
                                        <Badge variant="secondary" className="bg-yellow-100 border-yellow-300">
                                            <Text className="text-yellow-800 text-xs font-bold">⏱️ Preparando</Text>
                                        </Badge>
                                    )}
                                    {order.status_id === 4 && (
                                        <Badge variant="secondary" className="bg-green-100 border-green-300">
                                            <Text className="text-green-800 text-xs font-bold">✅ Lista</Text>
                                        </Badge>
                                    )}
                                    {order.status_id === 7 && (
                                        <Badge variant="secondary" className="bg-blue-100 border-blue-300">
                                            <Text className="text-blue-800 text-xs font-bold">💰 En Subasta</Text>
                                        </Badge>
                                    )}
                                </View>
                            </View>

                            {/* Customer Info */}
                            <View className="space-y-2 mb-4">
                                <Text className="text-sm">
                                    <Text className="font-semibold">Cliente: </Text>
                                    {order.customer.name}
                                </Text>
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-sm">
                                            <Text className="font-semibold">Destino: </Text>
                                            {order.customer.address || 'Dirección no disponible'}
                                        </Text>
                                    </View>
                                    <View className="bg-brand-background px-3 py-2 rounded-xl border border-brand-accent">
                                        <Text className="text-xs text-brand-primary font-bold uppercase mb-0.5">Base</Text>
                                        <Text className="text-lg font-bold text-brand-text">₡{order.delivery_base_price?.toLocaleString() || '---'}</Text>
                                    </View>
                                </View>

                                {(order.customer_latitude && order.customer_longitude) ? (
                                    <View className="flex-row gap-2 mt-2">
                                        <Pressable
                                            onPress={(e) => {
                                                e.preventDefault();
                                                openMap(order.customer_latitude!, order.customer_longitude!, 'waze')
                                            }}
                                            className="bg-[#05C8F2] px-3 py-2 rounded-lg flex-row items-center justify-center flex-1"
                                        >
                                            <Text className="text-white text-xs font-bold text-center">Waze (Cliente)</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={(e) => {
                                                e.preventDefault();
                                                openMap(order.customer_latitude!, order.customer_longitude!, 'maps')
                                            }}
                                            className="bg-[#4285F4] px-3 py-2 rounded-lg flex-row items-center justify-center flex-1"
                                        >
                                            <Text className="text-white text-xs font-bold text-center">Maps (Cliente)</Text>
                                        </Pressable>
                                    </View>
                                ) : null}
                            </View>

                            {/* Order Time & ETA */}
                            <View className="gap-2">
                                {etaCust && (
                                    <View className="flex-row items-center gap-1 mt-2">
                                        <Text className="text-xs">⏱️ </Text>
                                        <Text className="text-xs font-bold text-blue-600">Aprox. al Cliente: {etaCust} min</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between items-end mt-2">
                                    <Text className="text-xs text-gray-500">
                                        {isMounted ? new Date(order.created_at || '').toLocaleTimeString('es-CR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }) : '--:--'}
                                    </Text>
                                    {etaRest && (
                                        <View className="bg-green-50 px-2 py-1 rounded border border-green-100 flex-row items-center gap-1">
                                            <Text className="text-[10px]">🚗 </Text>
                                            <Text className="text-[11px] font-bold text-green-700">Aprox. al Restaurante: {etaRest} min</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Ver detalles */}
                            <View className="mt-4 flex-row items-center gap-1">
                                <Text className="text-brand-primary text-sm font-semibold">Ver detalles</Text>
                                <Text className="text-brand-primary text-sm">→</Text>
                            </View>
                        </View>
                    </Link>
                )
            })}
        </View>
    );
}
