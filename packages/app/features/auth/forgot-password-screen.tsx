'use client';

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { UserService } from '../../services/user.service';

export function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        if (!email) {
            setError('Por favor ingresa tu email');
            return;
        }

        try {
            setError('');
            setIsLoading(true);
            await UserService.sendPasswordResetEmail(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Error al enviar el correo de recuperación.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
                <View className="flex-1 justify-center max-w-md mx-auto w-full">
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-brand-text font-heading text-center">Recuperar Contraseña</Text>
                    </View>

                    <View className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        {success ? (
                            <View>
                                <View className="bg-green-50 p-6 rounded-2xl mb-6 border border-green-100 items-center">
                                    <Text className="text-4xl mb-4">📧</Text>
                                    <Text className="text-green-700 text-center font-bold">¡Correo enviado!</Text>
                                    <Text className="text-green-600 text-center text-sm mt-2">
                                        Hemos enviado instrucciones para restablecer tu contraseña a {email}.
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/login')}
                                    className="bg-brand-primary py-4 rounded-2xl items-center shadow-sm"
                                >
                                    <Text className="text-white font-bold text-lg">Volver al Inicio</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                {error ? (
                                    <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                        <Text className="text-red-600 text-sm">{error}</Text>
                                    </View>
                                ) : null}

                                <Text className="text-gray-500 mb-6 text-center">
                                    Ingresa tu correo electrónico y te enviaremos un enlace para recuperar el acceso a tu cuenta.
                                </Text>

                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Email</Text>
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="tu@email.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
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
                                            <Text className="text-white font-bold text-lg">Enviar Enlace</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        className="py-2 items-center"
                                    >
                                        <Text className="text-gray-500 font-medium">Cancelar</Text>
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
