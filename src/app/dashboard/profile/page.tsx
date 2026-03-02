'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@/services/user.service';
import { signOutAction } from '@/actions/auth.actions';
import { StatsService, type DeliveryStats } from '@/services/stats.service';
import { StatsCard } from '@/components/delivery/StatsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut } from 'lucide-react';
import type { UserProfile } from '@/schemas/user.schema';
import { BottomNav } from '@/components/delivery/BottomNav';
import { Sidebar } from '@/components/delivery/Sidebar';
import { LottieAnimation } from '@/components/ui/lottie-animation';
import { useOrderNotifications } from '@/hooks/use-order-notifications';
import { Bell, BellOff, ShieldCheck, PlayCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<DeliveryStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
    });

    const {
        isEnabled: notificationsEnabled,
        toggleNotifications,
        requestPermission,
        testNotification,
        permissionStatus,
        testSound,
        isTestingSound,
        isAudioContextUnlocked
    } = useOrderNotifications();

    const [notifLoading, setNotifLoading] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setIsLoading(true);
            const currentUser = await UserService.getCurrentUser();

            if (!currentUser) {
                router.push('/login');
                return;
            }

            const profile = await UserService.getUserProfile(currentUser.id);
            if (profile) {
                setUser(profile);
                setFormData({
                    full_name: profile.full_name || '',
                    phone: profile.phone || '',
                });
            }

            const deliveryStats = await StatsService.getDeliveryStats(currentUser.id);
            setStats(deliveryStats);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOutAction();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const updatedProfile = await UserService.updateUserProfile(user.user_id, {
                full_name: formData.full_name,
                phone: formData.phone,
            });

            setUser(updatedProfile);
            setFormData({
                full_name: updatedProfile.full_name || '',
                phone: updatedProfile.phone || '',
            });
            setIsEditing(false);
            // Optionally add a toast here if available
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar el perfil. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Get initials for avatar
    const initials = user.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Profile Card */}
            <div className="bg-white rounded-[16px] p-6 mb-6 border border-brand-accent">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-brand-primary/10 overflow-hidden flex items-center justify-center relative border-2 border-brand-primary/20">
                        <LottieAnimation
                            url="https://lottie.host/62f6b88b-18a7-47b1-b4ec-86f343a41e97/uS82yK85eP.json"
                            className="w-20 h-20"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="sr-only">{initials}</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        {!isEditing ? (
                            <>
                                <h2 className="text-2xl font-heading font-bold text-brand-text mb-1">
                                    {user.full_name || 'Sin nombre'}
                                </h2>
                                <p className="text-brand-text opacity-60 mb-2">{user.email}</p>
                                {user.phone && (
                                    <p className="text-brand-text opacity-60 mb-2">
                                        📱 {user.phone}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        Repartidor Activo
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Editar Perfil
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">
                                        Nombre Completo
                                    </label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, full_name: e.target.value })
                                        }
                                        placeholder="Tu nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">
                                        Teléfono
                                    </label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        placeholder="+506 1234 5678"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSaveProfile}>Guardar</Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="mb-6">
                    <h3 className="text-xl font-heading font-bold text-brand-text mb-4">
                        Estadísticas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatsCard
                            title="Total de Entregas"
                            value={stats.totalDeliveries}
                            subtitle="Desde que empezaste"
                            icon={<span className="text-2xl">📦</span>}
                        />
                        <StatsCard
                            title="Entregas del Mes"
                            value={stats.monthlyDeliveries}
                            subtitle="Este mes"
                            icon={<span className="text-2xl">📅</span>}
                            variant="success"
                        />
                        <StatsCard
                            title="Entregas Hoy"
                            value={stats.todayDeliveries}
                            subtitle="Hoy"
                            icon={<span className="text-2xl">🚀</span>}
                            variant="primary"
                        />
                        <StatsCard
                            title="Ganancias del Mes"
                            value={`₡${stats.monthlyEarnings.toLocaleString()}`}
                            subtitle="Este mes"
                            icon={<span className="text-2xl">💰</span>}
                        />
                        <StatsCard
                            title="Ganancias Hoy"
                            value={`₡${stats.todayEarnings.toLocaleString()}`}
                            subtitle="Hoy"
                            icon={<span className="text-2xl">💵</span>}
                        />
                    </div>
                </div>
            )}

            {/* PWA Installation Card */}
            <div className="bg-brand-primary/5 rounded-[16px] p-6 mb-6 border border-brand-primary/20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                        <span className="text-xl">📱</span>
                    </div>
                    <h3 className="text-xl font-heading font-bold text-brand-text">
                        Instalar Aplicación
                    </h3>
                </div>
                <p className="text-sm text-brand-text opacity-80 mb-6">
                    Para una mejor experiencia, instala la aplicación en tu pantalla de inicio.
                    Recibirás notificaciones en tiempo real y acceso más rápido.
                </p>
                <Button
                    className="w-full font-bold h-12 rounded-xl shadow-lg shadow-brand-primary/20"
                    onClick={() => {
                        // Trigger the custom event for PWA install
                        window.dispatchEvent(new Event('trigger-pwa-install'));
                    }}
                >
                    Instalar Aplicación Ahora
                </Button>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-[16px] p-6 mb-6 border border-brand-accent">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-primary/10 rounded-lg">
                        <Bell className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h3 className="text-xl font-heading font-bold text-brand-text">
                        Configuración de Notificaciones
                    </h3>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="space-y-1">
                            <p className="font-bold text-brand-text">Alertas de Nuevas Órdenes</p>
                            <p className="text-sm text-brand-text opacity-60">
                                Recibe una notificación y sonido cuando haya pedidos disponibles.
                            </p>
                        </div>
                        <Switch
                            checked={notificationsEnabled}
                            onCheckedChange={toggleNotifications}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-12 border-2 border-brand-primary/10 hover:border-brand-primary/30 gap-2 font-semibold"
                            onClick={async () => {
                                setNotifLoading(true);
                                const granted = await requestPermission();
                                setNotifLoading(false);
                                if (granted) {
                                    alert('¡Notificaciones activadas con éxito!');
                                } else {
                                    alert('Por favor, activa las notificaciones en la configuración de tu navegador.');
                                }
                            }}
                            disabled={notifLoading || permissionStatus === 'granted'}
                        >
                            {permissionStatus === 'granted' ? (
                                <>
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                    <span>Permiso Concedido</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="w-5 h-5" />
                                    <span>Permitir en este Navegador</span>
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            className={cn(
                                "h-12 border-2 gap-2 font-semibold transition-all",
                                isTestingSound && "bg-brand-primary/10 border-brand-primary/30"
                            )}
                            onClick={testSound}
                            disabled={!notificationsEnabled || permissionStatus !== 'granted' || isTestingSound}
                        >
                            {isTestingSound ? (
                                <>
                                    <div className="animate-ping w-2 h-2 bg-brand-primary rounded-full" />
                                    <span>Reproduciendo...</span>
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="w-5 h-5" />
                                    <span>Probar Sonido</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {!isAudioContextUnlocked && notificationsEnabled && permissionStatus === 'granted' && (
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-3">
                            <span className="text-xl">💡</span>
                            <p className="text-sm text-yellow-700 font-medium">
                                Consejo: Algunos navegadores bloquean el sonido hasta que interactúes con la página.
                                Haz clic en cualquier parte o pulsa "Probar Sonido" para habilitarlo.
                            </p>
                        </div>
                    )}

                    {permissionStatus === 'denied' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-600 font-medium">
                                ⚠️ Las notificaciones están bloqueadas en tu navegador.
                                Debes habilitarlas manualmente en la configuración del sitio para recibir alertas.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-[16px] p-6 border border-brand-accent">
                <h3 className="text-xl font-heading font-bold text-brand-text mb-4">
                    Acciones
                </h3>
                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => router.push('/dashboard/history')}
                    >
                        📊 Ver Historial de Entregas
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
