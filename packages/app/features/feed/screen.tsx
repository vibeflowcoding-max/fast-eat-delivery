'use client';

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { StatsService } from '../../services/stats.service';
import { createClient } from '../../lib/supabase/client';
import { StatsCard } from '@delivery-app/ui';
import { AvailableOrdersList } from './AvailableOrdersList';

export function FeedScreen() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log('No user session found in FeedScreen, redirecting to /login');
                router.push('/login');
                return;
            }

            setUserId(user.id);
            loadStats(user.id);
            setIsLoading(false);
        };

        initializeUser();
    }, [router]);

    const loadStats = async (uid: string) => {
        try {
            const statsData = await StatsService.getDeliveryStats(uid);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    if (isLoading || !userId) {
        return (
            <View className="flex-1 items-center justify-center min-h-[500px]">
                <ActivityIndicator size="large" color="#0000ff" />
                <Text className="text-gray-600 mt-4">Cargando...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                <View className="space-y-6">
                    {/* Stats Header */}
                    {stats && (
                        <View className="flex-col md:flex-row gap-4">
                            <View className="flex-1 mb-4 md:mb-0">
                                <StatsCard
                                    title="Entregas Hoy"
                                    value={stats.todayDeliveries}
                                    subtitle="Completadas"
                                    icon={<Text className="text-2xl">🚀</Text>}
                                    variant="primary"
                                />
                            </View>
                            <View className="flex-1 mb-4 md:mb-0">
                                <StatsCard
                                    title="Ganancias Hoy"
                                    value={`₡${stats.todayEarnings.toLocaleString()}`}
                                    subtitle="Hoy"
                                    icon={<Text className="text-2xl">💵</Text>}
                                    variant="success"
                                />
                            </View>
                            <View className="flex-1">
                                <StatsCard
                                    title="Este Mes"
                                    value={stats.monthlyDeliveries}
                                    subtitle={`₡${stats.monthlyEarnings.toLocaleString()}`}
                                    icon={<Text className="text-2xl">📅</Text>}
                                />
                            </View>
                        </View>
                    )}

                    {/* Orders Section */}
                    <View className="mt-6">
                        <Text className="text-2xl font-bold font-heading text-brand-text mb-4">
                            🎯 Órdenes Disponibles para Tomar
                        </Text>
                        <AvailableOrdersList userId={userId} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
