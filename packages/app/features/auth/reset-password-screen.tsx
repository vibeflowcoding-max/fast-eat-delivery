'use client';

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { UserService } from '../../services/user.service';

export function ResetPasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        if (!password || password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            setError('');
            setIsLoading(true);
            await UserService.updateUserPassword(password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Error al restablecer la contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
                <View className="flex-1 justify-center max-w-md mx-auto w-full">
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-brand-text font-heading text-center">Nueva Contraseña</Text>
                    </View>

                    <View className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        {success ? (
                            <View>
                                <View className="bg-green-50 p-6 rounded-2xl mb-6 border border-green-100 items-center">
                                    <Text className="text-4xl mb-4">✅</Text>
                                    <Text className="text-green-700 text-center font-bold">¡Contraseña actualizada!</Text>
                                    <Text className="text-green-600 text-center text-sm mt-2">
                                        Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/login')}
                                    className="bg-brand-primary py-4 rounded-2xl items-center shadow-sm"
                                >
                                    <Text className="text-white font-bold text-lg">Ir al Inicio</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                {error ? (
                                    <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                        <Text className="text-red-600 text-sm">{error}</Text>
                                    </View>
                                ) : null}

                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Nueva Contraseña</Text>
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="••••••••"
                                            secureTextEntry
                                            className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-brand-text"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Confirmar Contraseña</Text>
                                        <TextInput
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="••••••••"
                                            secureTextEntry
                                            className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-brand-text"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleReset}
                                        disabled={isLoading}
                                        className={`bg-brand-primary py-4 rounded-2xl items-center shadow-sm mt-4 ${isLoading ? 'opacity-70' : ''}`}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text className="text-white font-bold text-lg">Actualizar Contraseña</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
