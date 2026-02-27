'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { StatsService } from '../../services/stats.service';
import { UserService } from '../../services/user.service';

export function HistoryScreen() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

    const loadDeliveries = async () => {
        try {
            const user = await UserService.getCurrentUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            let startDate: Date | undefined;
            if (filter === 'today') {
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
            } else if (filter === 'week') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
            }

            const history = await StatsService.getDeliveryHistory(user.id, { startDate });
            setDeliveries(history || []);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDeliveries();
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDeliveries();
    };

    if (isLoading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-brand-background">
                <ActivityIndicator size="large" color="#6A7282" />
            </View>
        );
    }

    const totalEarnings = deliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0);

    return (
        <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View className="p-6">
                    <Text className="text-2xl font-bold font-heading text-brand-text mb-4">
                        Historial
                    </Text>

                    <View className="flex-row space-x-2 mb-6">
                        {(['all', 'today', 'week'] as const).map((f) => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full border ${filter === f ? 'bg-brand-primary border-brand-primary' : 'bg-white border-gray-200'
                                    }`}
                            >
                                <Text className={`capitalize font-medium ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                                    {f === 'all' ? 'Todo' : f === 'today' ? 'Hoy' : 'Semana'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View className="bg-white rounded-[20px] p-6 mb-8 border border-gray-100 shadow-sm">
                        <View className="flex-row justify-between mb-4">
                            <View>
                                <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Entregas</Text>
                                <Text className="text-2xl font-bold text-brand-text">{deliveries.length}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">Ganancias</Text>
                                <Text className="text-2xl font-bold text-brand-text">₡{totalEarnings.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>

                    {deliveries.length === 0 ? (
                        <View className="py-12 items-center">
                            <Text className="text-4xl mb-2">📜</Text>
                            <Text className="text-gray-500">No hay entregas registradas</Text>
                        </View>
                    ) : (
                        <View className="space-y-3">
                            {deliveries.map((delivery) => (
                                <View key={delivery.id} className="bg-white p-4 rounded-xl border border-gray-100">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="font-bold text-brand-text">{delivery.restaurant?.name || 'Restaurante'}</Text>
                                        <Text className="font-bold text-brand-primary">₡{delivery.delivery_fee?.toLocaleString()}</Text>
                                    </View>
                                    <Text className="text-xs text-gray-500 mb-2">
                                        {new Date(delivery.created_at).toLocaleDateString()}
                                    </Text>
                                    <Text className="text-sm text-gray-600" numberOfLines={1}>📍 {delivery.customer?.address}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
