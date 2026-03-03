'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatsService } from '@/services/stats.service';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/delivery/StatsCard';
import { AvailableOrdersList } from '@/components/dashboard/available-orders-list';

export default function FeedPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Header */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard
                        title="Entregas Hoy"
                        value={stats.todayDeliveries}
                        subtitle="Completadas"
                        icon={<span className="text-2xl">🚀</span>}
                        variant="primary"
                    />
                    <StatsCard
                        title="Ganancias Hoy"
                        value={`₡${stats.todayEarnings.toLocaleString()}`}
                        subtitle="Hoy"
                        icon={<span className="text-2xl">💵</span>}
                        variant="success"
                    />
                    <StatsCard
                        title="Este Mes"
                        value={stats.monthlyDeliveries}
                        subtitle={`₡${stats.monthlyEarnings.toLocaleString()}`}
                        icon={<span className="text-2xl">📅</span>}
                    />
                </div>
            )}

            {/* Orders Section */}
            <div>
                <h1 className="text-2xl font-bold font-heading text-brand-text mb-4">
                    🎯 Órdenes Disponibles para Tomar
                </h1>
                <AvailableOrdersList userId={userId} />
            </div>
        </div>
    );
}
