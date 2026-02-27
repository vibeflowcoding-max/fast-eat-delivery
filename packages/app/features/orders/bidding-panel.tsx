import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { AuctionService, type DeliveryBid } from '../../services/auction.service';

interface BiddingPanelProps {
    orderId: string;
    driverId: string;
    basePrice: number;
    distance: number | null | undefined;
    onBidAccepted?: () => void;
}

export function BiddingPanel({
    orderId,
    driverId,
    basePrice,
    distance,
    onBidAccepted,
}: BiddingPanelProps) {
    const [existingBid, setExistingBid] = useState<DeliveryBid | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [bidType, setBidType] = useState<'accept' | 'counter'>('accept');
    const [counterOffer, setCounterOffer] = useState('');
    const [driverNotes, setDriverNotes] = useState('');

    const loadExistingBid = async () => {
        try {
            const bids = await AuctionService.getDriverBids(driverId);
            const myBid = bids.find((b) => b.order_id === orderId);
            setExistingBid(myBid || null);
        } catch (err) {
            console.error('Error loading bid:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadExistingBid();

        const channel = AuctionService.subscribeToBids(orderId, (payload) => {
            if (payload.new && payload.new.driver_id === driverId) {
                setExistingBid(payload.new as DeliveryBid);
                if (payload.new.status === 'accepted' && onBidAccepted) {
                    onBidAccepted();
                }
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, [orderId, driverId]);

    const handleSubmitBid = async () => {
        try {
            setIsSubmitting(true);
            setError('');

            const driverOffer = bidType === 'accept' ? null : parseFloat(counterOffer);

            if (bidType === 'counter') {
                if (!counterOffer || isNaN(driverOffer!) || driverOffer! < basePrice) {
                    setError(`La oferta debe ser mayor o igual a ₡${basePrice.toLocaleString()}`);
                    return;
                }
            }

            // Try to start auction if not started
            try {
                await AuctionService.startAuction(orderId, distance || 3.5);
            } catch (auctionError) {
                // Ignore if already started
            }

            await AuctionService.createBid({
                order_id: orderId,
                driver_id: driverId,
                driver_offer: driverOffer,
                distance_km: distance || undefined,
                driver_notes: driverNotes || undefined,
            });

            if (bidType === 'accept' && onBidAccepted) {
                onBidAccepted();
            }

            await loadExistingBid();
        } catch (err: any) {
            setError(err.message || 'Error al crear oferta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAcceptCounterOffer = async () => {
        if (!existingBid) return;
        try {
            setIsSubmitting(true);
            await AuctionService.acceptCounterOffer(existingBid.id);
            if (onBidAccepted) onBidAccepted();
        } catch (err: any) {
            setError(err.message || 'Error al aceptar contra-oferta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawBid = async () => {
        if (!existingBid) return;
        try {
            setIsSubmitting(true);
            await AuctionService.withdrawBid(existingBid.id, driverId);
            setExistingBid(null);
        } catch (err: any) {
            setError(err.message || 'Error al retirar oferta');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View className="bg-white rounded-2xl p-6 border border-gray-100 items-center justify-center">
                <ActivityIndicator color="#6A7282" />
            </View>
        );
    }

    // Bid Accepted
    if (existingBid?.status === 'accepted') {
        return (
            <View className="bg-green-50 rounded-2xl border-2 border-green-500 p-6 items-center">
                <Text className="text-3xl mb-2">🎉</Text>
                <Text className="text-xl font-bold text-green-700 mb-1">¡Orden Asignada!</Text>
                <Text className="text-green-600 font-medium text-center">
                    Precio acordado: <Text className="font-bold text-lg">₡{existingBid.final_price?.toLocaleString()}</Text>
                </Text>
            </View>
        );
    }

    // Counter-offer received
    if (existingBid?.status === 'countered' && existingBid.customer_counter_offer) {
        return (
            <View className="bg-blue-50 rounded-2xl border-2 border-blue-500 p-6">
                <Text className="text-xl font-bold text-blue-700 mb-4 text-center">💬 Contra-oferta recibida</Text>

                <View className="bg-white rounded-xl p-4 mb-4">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-500">Tu oferta:</Text>
                        <Text className="font-bold">₡{existingBid.driver_offer?.toLocaleString()}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-gray-500">Cliente ofrece:</Text>
                        <Text className="font-bold text-blue-600 text-lg">₡{existingBid.customer_counter_offer.toLocaleString()}</Text>
                    </View>
                </View>

                <View className="flex-row gap-x-2">
                    <View className="flex-1">
                        <TouchableOpacity
                            onPress={handleWithdrawBid}
                            className="bg-white border border-gray-300 p-3 rounded-xl items-center"
                        >
                            <Text className="text-gray-600 font-bold">Rechazar</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                        <TouchableOpacity
                            onPress={handleAcceptCounterOffer}
                            className="bg-blue-600 p-3 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold">Aceptar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // Pending bid
    if (existingBid?.status === 'pending') {
        return (
            <View className="bg-amber-50 rounded-2xl border-2 border-amber-500 p-6">
                <Text className="text-xl font-bold text-amber-700 mb-2 text-center">⏳ Oferta Enviada</Text>
                <View className="bg-white rounded-xl p-4 mb-4 items-center">
                    <Text className="text-gray-500 text-sm mb-1">Tu propuesta:</Text>
                    <Text className="text-2xl font-bold text-amber-600">₡{existingBid.driver_offer?.toLocaleString()}</Text>
                </View>
                <Text className="text-amber-600 text-sm text-center mb-4">Esperando respuesta del cliente...</Text>
                <TouchableOpacity onPress={handleWithdrawBid} className="border border-amber-300 p-3 rounded-xl items-center">
                    <Text className="text-amber-700 font-bold">Retirar Oferta</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Form
    return (
        <View className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <Text className="text-xl font-bold text-brand-text mb-4 text-center">💰 Proponer Delivery</Text>

            <View className="flex-row bg-gray-50 p-1 rounded-xl mb-6">
                <TouchableOpacity
                    onPress={() => setBidType('accept')}
                    className={`flex-1 py-3 rounded-lg items-center ${bidType === 'accept' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold ${bidType === 'accept' ? 'text-brand-primary' : 'text-gray-400'}`}>Aceptar Base</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setBidType('counter')}
                    className={`flex-1 py-3 rounded-lg items-center ${bidType === 'counter' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold ${bidType === 'counter' ? 'text-brand-primary' : 'text-gray-400'}`}>Negociar</Text>
                </TouchableOpacity>
            </View>

            <View className="bg-brand-background rounded-xl p-4 mb-6 items-center">
                <Text className="text-gray-500 text-sm mb-1">Precio Base</Text>
                <Text className="text-3xl font-bold text-brand-text">₡{basePrice.toLocaleString()}</Text>
            </View>

            {bidType === 'counter' && (
                <View className="mb-6 space-y-4">
                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2">Tu Contra-oferta (₡)</Text>
                        <TextInput
                            value={counterOffer}
                            onChangeText={setCounterOffer}
                            placeholder={basePrice.toString()}
                            keyboardType="numeric"
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xl font-bold text-brand-text"
                        />
                    </View>
                    <View>
                        <Text className="text-sm font-bold text-gray-700 mb-2">Nota (Opcional)</Text>
                        <TextInput
                            value={driverNotes}
                            onChangeText={setDriverNotes}
                            placeholder="Ej: Mucho tráfico o lluvia"
                            multiline
                            numberOfLines={2}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                        />
                    </View>
                </View>
            )}

            {error ? <Text className="text-red-500 text-sm mb-4 text-center">{error}</Text> : null}

            <TouchableOpacity
                onPress={handleSubmitBid}
                disabled={isSubmitting}
                className="bg-brand-primary py-4 rounded-xl items-center shadow-sm"
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-white font-bold text-lg">
                        {bidType === 'accept' ? '🚀 Tomar por Base' : `📤 Enviar Oferta`}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
