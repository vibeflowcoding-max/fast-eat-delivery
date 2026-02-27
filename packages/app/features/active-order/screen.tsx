'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user.service';
import type { OrderWithDetails } from '../../schemas/order.schema';
import { StatsCard } from '@delivery-app/ui';

export function ActiveOrderScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadActiveOrders = async () => {
        try {
            const user = await UserService.getCurrentUser();
            if (!user) {
                router.replace('/login');
                return;
            }
            const data = await OrderService.getActiveOrders(user.id);
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar órdenes activas');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadActiveOrders();

        // Small polling or real-time sub could go here
        // For now, let's keep it simple with manual refresh
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadActiveOrders();
    };

    const openMap = (lat: number, lng: number, app: 'waze' | 'maps') => {
        if (app === 'waze') {
            Linking.openURL(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-brand-background">
                <ActivityIndicator size="large" color="#6A7282" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View className="p-6">
                    <Text className="text-2xl font-bold font-heading text-brand-text mb-6">
                        Entregas en Proceso
                    </Text>

                    {orders.length === 0 ? (
                        <View className="bg-white rounded-[24px] p-8 items-center border border-gray-100 shadow-sm">
                            <Text className="text-5xl mb-4">💤</Text>
                            <Text className="text-xl font-bold text-brand-text mb-2 text-center">
                                No tienes órdenes activas
                            </Text>
                            <Text className="text-gray-500 text-center mb-6">
                                Ve al Feed para encontrar nuevas oportunidades de entrega.
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/dashboard/feed')}
                                className="bg-brand-primary px-8 py-3 rounded-full"
                            >
                                <Text className="text-white font-bold text-lg">Buscar Órdenes</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {orders.map((order) => (
                                <TouchableOpacity
                                    key={order.id}
                                    onPress={() => router.push(`/dashboard/orders/${order.id}`)}
                                    className="bg-white rounded-[16px] p-5 border border-gray-200 shadow-sm"
                                >
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="font-bold text-lg text-brand-text">{order.restaurant?.name}</Text>
                                        <View className={`px-2 py-1 rounded-full ${order.status_id === 5 ? 'bg-orange-100' : 'bg-green-100'}`}>
                                            <Text className={`text-xs font-bold ${order.status_id === 5 ? 'text-orange-700' : 'text-green-700'}`}>
                                                {order.status_id === 5 ? 'EN CAMINO' : 'ASIGNADA'}
                                            </Text>
                                        </View>
                                    </View>

                                    {(order.restaurant?.latitude && order.restaurant?.longitude) ? (
                                        <View className="flex-row gap-2 mb-3 mt-1">
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.preventDefault();
                                                    openMap(order.restaurant.latitude!, order.restaurant.longitude!, 'waze')
                                                }}
                                                className="bg-[#05C8F2] px-2 py-1 rounded-md"
                                            >
                                                <Text className="text-white text-[10px] font-bold">📍 Waze (Restaurante)</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.preventDefault();
                                                    openMap(order.restaurant.latitude!, order.restaurant.longitude!, 'maps')
                                                }}
                                                className="bg-[#4285F4] px-2 py-1 rounded-md"
                                            >
                                                <Text className="text-white text-[10px] font-bold">📍 Maps (Restaurante)</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : <View className="mb-3" />}

                                    <Text className="text-sm text-gray-600 mb-1">📍 {order.customer?.address}</Text>
                                    <Text className="text-sm font-medium text-brand-primary">👤 {order.customer?.name}</Text>

                                    {(order.customer_latitude && order.customer_longitude) ? (
                                        <View className="flex-row gap-2 mt-3 mb-1">
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.preventDefault();
                                                    openMap(order.customer_latitude!, order.customer_longitude!, 'waze')
                                                }}
                                                className="bg-[#05C8F2] px-3 py-2 rounded-lg flex-row items-center justify-center flex-1"
                                            >
                                                <Text className="text-white text-xs font-bold text-center">Waze (Cliente)</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.preventDefault();
                                                    openMap(order.customer_latitude!, order.customer_longitude!, 'maps')
                                                }}
                                                className="bg-[#4285F4] px-3 py-2 rounded-lg flex-row items-center justify-center flex-1"
                                            >
                                                <Text className="text-white text-xs font-bold text-center">Maps (Cliente)</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : null}

                                    <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center">
                                        <Text className="text-brand-text font-bold text-lg">₡{order.total.toLocaleString()}</Text>
                                        <Text className="text-brand-primary font-bold">Ver Detalles →</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
