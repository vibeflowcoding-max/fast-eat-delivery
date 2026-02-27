'use client';

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'solito/navigation';
import { UserService } from '../../services/user.service';
import { SignUpSchema } from '../../schemas/user.schema';

export function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSignUp = async () => {
        try {
            setError('');
            setFieldErrors({});

            const formData = { email, password, full_name: fullName, phone };
            const result = SignUpSchema.safeParse(formData);

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
            await UserService.signUp(formData);
            router.replace('/dashboard/feed');
        } catch (err: any) {
            setError(err.message || 'Error al crear la cuenta. Por favor verifica tus datos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-background">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
                <View className="flex-1 justify-center max-w-md mx-auto w-full py-10">
                    <View className="items-center mb-8">
                        <Text className="text-3xl font-bold text-brand-text font-heading text-center">Registrar Cuenta</Text>
                        <Text className="text-gray-500 mt-2 text-center">Únete como socio repartidor</Text>
                    </View>

                    <View className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        {error ? (
                            <View className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                <Text className="text-red-600 text-sm">{error}</Text>
                            </View>
                        ) : null}

                        <View className="space-y-4">
                            <View>
                                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Nombre Completo</Text>
                                <TextInput
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Juan Pérez"
                                    className={`bg-gray-50 p-4 rounded-2xl border ${fieldErrors.full_name ? 'border-red-500' : 'border-gray-200'} text-brand-text`}
                                />
                                {fieldErrors.full_name && <Text className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.full_name}</Text>}
                            </View>

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
                                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Teléfono (Opcional)</Text>
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+506 1234 5678"
                                    keyboardType="phone-pad"
                                    className={`bg-gray-50 p-4 rounded-2xl border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-200'} text-brand-text`}
                                />
                                {fieldErrors.phone && <Text className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.phone}</Text>}
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
                                onPress={handleSignUp}
                                disabled={isLoading}
                                className={`bg-brand-primary py-4 rounded-2xl items-center shadow-sm mt-4 ${isLoading ? 'opacity-70' : ''}`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Registrarse</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View className="mt-8 pt-6 border-t border-gray-50 items-center">
                            <Text className="text-gray-500 text-sm">¿Ya tienes cuenta?</Text>
                            <TouchableOpacity className="mt-2" onPress={() => router.push('/login')}>
                                <Text className="text-brand-primary font-bold">Inicia Sesión</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
