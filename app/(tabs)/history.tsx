import { Calendar, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '../../src/constants/Theme';
import { supabase } from '../../src/lib/supabase';
import { Order } from '../../src/types/database';

type FilterType = 'all' | 'today' | 'week' | 'month';

export default function HistoryScreen() {
    const [history, setHistory] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');

    const loadHistory = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('orders')
                .select('*, restaurants(*)')
                .eq('status_id', 12) // DELIVERED
                .order('delivered_at', { ascending: false });

            if (filter === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('delivered_at', today.toISOString());
            }

            const { data, error } = await query;
            if (data) setHistory(data as Order[]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const totalEarnings = history.reduce((acc, curr) => acc + (curr.delivery_final_price || 0), 0);

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Historial de Entregas</Text>
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                    {(['all', 'today', 'week'] as FilterType[]).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f === 'all' ? 'Todas' : f === 'today' ? 'Hoy' : 'Semana'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total de Entregas</Text>
                        <Text style={styles.summaryValue}>{history.length}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Ganancias Totales</Text>
                        <Text style={styles.summaryValue}>₡{totalEarnings.toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: Order }) => (
        <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderInfo}>
                <Text style={styles.restaurantName}>{item.restaurants?.name || 'Restaurante'}</Text>
                <Text style={styles.addressText} numberOfLines={1}>{item.delivery_address}</Text>
                <View style={styles.dateRow}>
                    <Calendar size={12} color={COLORS.secondaryText} />
                    <Text style={styles.dateText}>
                        {new Date(item.delivered_at || item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <View style={styles.orderRight}>
                <Text style={styles.priceText}>₡{item.delivery_final_price?.toLocaleString() || '2.500'}</Text>
                <ChevronRight size={16} color={COLORS.border} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
                        <Text style={styles.emptyTitle}>No hay entregas</Text>
                        <Text style={styles.emptySubtitle}>
                            {filter === 'all' ? 'Aún no has completado ninguna entrega' : 'No hay entregas en este período'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        paddingBottom: 20,
    },
    header: {
        padding: 20,
    },
    titleContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    filterWrapper: {
        marginBottom: 20,
    },
    filterContainer: {
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    filterTextActive: {
        color: 'white',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        ...SHADOWS.small,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        gap: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.secondaryText,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    orderCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    orderInfo: {
        flex: 1,
        gap: 4,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    addressText: {
        fontSize: 13,
        color: COLORS.secondaryText,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    dateText: {
        fontSize: 11,
        color: COLORS.secondaryText,
    },
    orderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.secondaryText,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
