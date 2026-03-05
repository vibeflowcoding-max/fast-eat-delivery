import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../../src/constants/Theme';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function signInWithEmail() {
        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) setError(error.message);
        } catch (e) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Bienvenido</Text>
                        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={(text) => { setEmail(text); setError(null); }}
                                value={email}
                                placeholder="tu@email.com"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#94A3B8"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={(text) => { setPassword(text); setError(null); }}
                                value={password}
                                secureTextEntry
                                placeholder="••••••••"
                                placeholderTextColor="#94A3B8"
                                editable={!loading}
                            />
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={signInWithEmail}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>O continúa con</Text>
                            <View style={styles.line} />
                        </View>

                        <TouchableOpacity style={styles.googleButton} disabled={loading}>
                            <Text style={styles.googleButtonText}>Google</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.signupButton}>
                    <Text style={styles.signupText}>
                        ¿No tienes cuenta? <Text style={styles.signupLink}>Regístrate</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        ...SHADOWS.medium,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    form: {
        width: '100%',
    },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '500',
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#94A3B8',
        fontSize: 12,
    },
    googleButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleButtonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    signupButton: {
        marginTop: 32,
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    signupLink: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
