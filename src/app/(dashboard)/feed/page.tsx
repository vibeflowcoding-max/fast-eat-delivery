import { cookies } from 'next/headers';
import { getFeed } from '@/actions/order.actions';
import { OrderCard } from '@/components/dashboard/order-card';
import { StatsCard } from '@/components/delivery/StatsCard';
import { redirect } from 'next/navigation';
import { UserService } from '@/services/user.service';
import { StatsService } from '@/services/stats.service';

export default async function FeedPage() {
    const driverId = (await cookies()).get('driverId')?.value;
    if (!driverId) redirect('/login');

    const result = await getFeed(driverId);

    if (!result.success) {
        return (
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
                <h2 className="font-bold text-lg">Acceso Denegado</h2>
                <p>{result.error}</p>
                <p className="text-sm mt-2">Por favor verifica tu estado de suscripción.</p>
            </div>
        );
    }

    const orders = result.data;

    // Get user stats for header
    let stats = null;
    try {
        const currentUser = await UserService.getCurrentUser();
        if (currentUser) {
            stats = await StatsService.getDeliveryStats(currentUser.id);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
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
                <h1 className="text-2xl font-bold font-heading mb-4 text-brand-text">
                    Órdenes Disponibles
                </h1>
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[16px] border border-brand-accent">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-heading font-bold text-brand-text mb-2">
                            No hay órdenes disponibles
                        </h3>
                        <p className="text-brand-text opacity-60">
                            Las nuevas órdenes listas para entrega aparecerán aquí automáticamente.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map(order => (
                            <OrderCard key={order.id} order={order} type="FEED" driverId={driverId} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
