import { useAudioPlayer } from 'expo-audio';
import { Bell, Download, PlayCircle, Power, ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../../src/constants/Theme';
import { useAuth } from '../../src/context/AuthContext';
import { usePWA } from '../../src/context/PWAContext';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { deferredPrompt, installPWA } = usePWA();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const player = useAudioPlayer(require('../../assets/sounds/notification.mp3'));

    function playTestSound() {
        try {
            player.seekTo(0);
            player.play();
        } catch (e) {
            console.log('Error playing test sound', e);
        }
    }

    const stats = {
        totalDeliveries: 0,
        monthlyDeliveries: 0,
        todayDeliveries: 0,
        monthlyEarnings: 0,
        todayEarnings: 0
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* User Info */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Repartidor'}</Text>
                            <Text style={styles.userEmail}>{user?.email}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Repartidor Activo</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <Text style={styles.sectionTitle}>Estadísticas</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>📦</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>📅</Text>
                            <Text style={[styles.statLabel, { color: '#15803D' }]}>Mes</Text>
                        </View>
                        <Text style={[styles.statValue, { color: '#166534' }]}>{stats.monthlyDeliveries}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                        <View style={styles.statHeader}>
                            <Text style={styles.statEmoji}>🚀</Text>
                            <Text style={[styles.statLabel, { color: '#1D4ED8' }]}>Hoy</Text>
                        </View>
                        <Text style={[styles.statValue, { color: '#1E40AF' }]}>{stats.todayDeliveries}</Text>
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.settingsCard}>
                    <View style={styles.settingsHeader}>
                        <View style={styles.iconCircle}>
                            <Bell size={18} color={COLORS.primary} />
                        </View>
                        <Text style={styles.settingsTitle}>Notificaciones</Text>
                    </View>
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingLabel}>Alertas de Nuevas Órdenes</Text>
                            <Text style={styles.settingDesc}>Recibe avisos cuando haya pedidos.</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#CBD5E1', true: COLORS.success }}
                        />
                    </View>
                    <TouchableOpacity style={styles.testSoundButton} onPress={playTestSound}>
                        <PlayCircle size={18} color={COLORS.primary} />
                        <Text style={styles.testSoundText}>Probar Sonido</Text>
                    </TouchableOpacity>
                </View>

                {/* PWA Install Button (Web Only) */}
                {Platform.OS === 'web' && deferredPrompt && (
                    <View style={styles.settingsCard}>
                        <View style={styles.settingsHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '10' }]}>
                                <Download size={18} color={COLORS.success} />
                            </View>
                            <Text style={styles.settingsTitle}>Instalar Aplicación</Text>
                        </View>
                        <Text style={styles.settingDesc}>Instala FastEat en tu pantalla de inicio para un acceso rápido y mejor experiencia.</Text>
                        <TouchableOpacity style={[styles.testSoundButton, { borderColor: COLORS.success + '20', marginTop: 12 }]} onPress={installPWA}>
                            <Download size={18} color={COLORS.success} />
                            <Text style={[styles.testSoundText, { color: COLORS.success }]}>Instalar Ahora</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsCard}>
                    <TouchableOpacity style={styles.actionRow} onPress={() => { }}>
                        <ShieldCheck size={20} color={COLORS.text} />
                        <Text style={styles.actionText}>Seguridad</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={signOut}>
                        <Power size={20} color={COLORS.destructive} />
                        <Text style={[styles.actionText, { color: COLORS.destructive }]}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.small,
        marginBottom: 24,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary + '20',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    userInfo: {
        flex: 1,
        gap: 2,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.secondaryText,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#166534',
    },
    editButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        ...SHADOWS.small,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    statEmoji: {
        fontSize: 14,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.secondaryText,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    settingsCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.small,
        marginBottom: 24,
    },
    settingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    settingDesc: {
        fontSize: 12,
        color: COLORS.secondaryText,
    },
    testSoundButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
        borderRadius: 12,
    },
    testSoundText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    actionsCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 4,
        ...SHADOWS.small,
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
});
