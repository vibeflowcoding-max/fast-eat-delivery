'use client';

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { UserService } from '../../services/user.service';
import { SignInSchema } from '../../schemas/user.schema';

export function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleLogin = async () => {
        try {
            setError('');
            setFieldErrors({});

            // Validate
            const result = SignInSchema.safeParse({ email, password });
            if (!result.success) {
                const errors: Record<string, string> = {};
                result.error.issues.forEach((issue) => {
                    const field = issue.path[0] as string;
                    errors[field] = issue.message;
                });
                setFieldErrors(errors);
                return;
            }

            setIsLoading(true);
            await UserService.signIn(email, password);

            // On successful login, redirect to dashboard
            router.replace('/dashboard/feed');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión. Por favor verifica tus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
                <View className="flex-1 justify-center max-w-md mx-auto w-full">
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-brand-primary rounded-3xl items-center justify-center mb-4 shadow-sm">
                            <Text className="text-4xl">🚀</Text>
                        </View>
                        <Text className="text-3xl font-bold text-brand-text font-heading">Fast Eat</Text>
                        <Text className="text-gray-500 mt-1">Socio Repartidor</Text>
                    </View>

                    <View className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <Text className="text-xl font-bold text-brand-text mb-6">Iniciar Sesión</Text>

                        {error ? (
                            <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                <Text className="text-red-600 text-sm">{error}</Text>
                            </View>
                        ) : null}

                        <View className="space-y-4">
                            <View>
                                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Email</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="tu@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className={`bg-gray-50 p-4 rounded-2xl border ${fieldErrors.email ? 'border-red-500' : 'border-gray-200'} text-brand-text`}
                                />
                                {fieldErrors.email && <Text className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</Text>}
                            </View>

                            <View>
                                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Contraseña</Text>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    secureTextEntry
                                    className={`bg-gray-50 p-4 rounded-2xl border ${fieldErrors.password ? 'border-red-500' : 'border-gray-200'} text-brand-text`}
                                />
                                {fieldErrors.password && <Text className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</Text>}
                            </View>

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={isLoading}
                                className={`bg-brand-primary py-4 rounded-2xl items-center shadow-sm mt-4 ${isLoading ? 'opacity-70' : ''}`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Ingresar</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="mt-8 pt-6 border-t border-gray-50 items-center">
                            <Text className="text-gray-500 text-sm">¿No tienes cuenta?</Text>
                            <TouchableOpacity className="mt-2" onPress={() => { }}>
                                <Text className="text-brand-primary font-bold">Contáctanos para registrarte</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
