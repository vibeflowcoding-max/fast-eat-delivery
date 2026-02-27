'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { UserService } from '../../services/user.service';
import { StatsService, type DeliveryStats } from '../../services/stats.service';
import { StatsCard } from '@delivery-app/ui';

export function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<DeliveryStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    const loadData = async () => {
        try {
            const currentUser = await UserService.getCurrentUser();
            if (!currentUser) {
                router.replace('/login');
                return;
            }

            const profile = await UserService.getUserProfile(currentUser.id);
            setUser(profile);
            setFullName(profile?.full_name || '');
            setPhone(profile?.phone || '');

            const s = await StatsService.getDeliveryStats(currentUser.id);
            setStats(s);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSignOut = async () => {
        try {
            await UserService.signOut();
            import('react-native').then(({ Platform }) => {
                if (Platform.OS !== 'web') {
                    // On native, we must clear the entire routing stack to prevent back-navigation to the dashboard.
                    const { router: expoRouter } = require('expo-router');
                    expoRouter.dismissAll();
                    expoRouter.replace('/login');
                } else {
                    router.replace('/login');
                }
            });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleUpdate = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            await UserService.updateUserProfile(user.user_id, {
                full_name: fullName,
                phone,
            });
            setIsEditing(false);
            await loadData();
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !user) {
        return (
            <View className="flex-1 items-center justify-center bg-brand-background">
                <ActivityIndicator size="large" color="#6A7282" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
            <ScrollView className="flex-1">
                <View className="p-6">
                    <Text className="text-2xl font-bold font-heading text-brand-text mb-6">
                        Mi Perfil
                    </Text>

                    <View className="bg-white rounded-[24px] p-6 mb-6 border border-gray-100 shadow-sm items-center">
                        <View className="w-20 h-20 bg-brand-accent rounded-full items-center justify-center mb-4">
                            <Text className="text-3xl">👤</Text>
                        </View>

                        {!isEditing ? (
                            <>
                                <Text className="text-xl font-bold text-brand-text">{user?.full_name || 'Sin Nombre'}</Text>
                                <Text className="text-gray-500 mb-4">{user?.email}</Text>
                                <TouchableOpacity
                                    onPress={() => setIsEditing(true)}
                                    className="border border-brand-primary px-6 py-2 rounded-full"
                                >
                                    <Text className="text-brand-primary font-bold">Editar Perfil</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View className="w-full space-y-4">
                                <TextInput
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Nombre Completo"
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                                />
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Teléfono"
                                    keyboardType="phone-pad"
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                                />
                                <View className="flex-row space-x-2">
                                    <TouchableOpacity onPress={handleUpdate} className="flex-1 bg-brand-primary p-4 rounded-xl items-center">
                                        <Text className="text-white font-bold">Guardar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsEditing(false)} className="flex-1 border border-gray-300 p-4 rounded-xl items-center">
                                        <Text className="text-gray-600 font-bold">Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {stats && (
                        <View className="grid grid-cols-2 gap-4 mb-8">
                            <View className="bg-white p-4 rounded-2xl border border-gray-100 grow">
                                <Text className="text-gray-500 text-xs mb-1">Entregas Hoy</Text>
                                <Text className="text-2xl font-bold text-brand-text">{stats.todayDeliveries}</Text>
                            </View>
                            <View className="bg-white p-4 rounded-2xl border border-gray-100 grow">
                                <Text className="text-gray-500 text-xs mb-1">Efectivo Hoy</Text>
                                <Text className="text-2xl font-bold text-brand-text">₡{stats.todayEarnings.toLocaleString()}</Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center justify-center"
                    >
                        <Text className="text-red-600 font-bold">Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
