/**
 * BiddingPanel Component
 * 
 * Displays the auction interface for drivers on the order detail page.
 * Allows drivers to:
 * - View the base delivery price
 * - Accept the base price (instant match)
 * - Make a counter-offer with optional notes
 * - View their existing bid status
 * - Accept/reject customer counter-offers
 * 
 * @module components/delivery/BiddingPanel
 */

'use client';

import { useState, useEffect } from 'react';
import { AuctionService, type DeliveryBid } from '@/services/auction.service';
import { Button } from '@/components/ui/button';

interface BiddingPanelProps {
    orderId: string;
    driverId: string;
    basePrice: number;
    distance: number | null | undefined;
    orderNumber: string;
    restaurantName: string;
    customerAddress: string | null;
    onBidAccepted?: () => void; // Callback when bid is accepted
}

export function BiddingPanel({
    orderId,
    driverId,
    basePrice,
    distance,
    orderNumber,
    restaurantName,
    customerAddress,
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

    useEffect(() => {
        loadExistingBid();

        // Subscribe to bid changes
        console.log('🔔 Subscribing to bid updates for order:', orderId);
        const channel = AuctionService.subscribeToBids(orderId, (payload) => {
            console.log('📨 Real-time bid update received:', payload);

            if (payload.new && payload.new.driver_id === driverId) {
                console.log('✅ Update is for this driver, updating UI:', {
                    status: payload.new.status,
                    customer_counter_offer: payload.new.customer_counter_offer,
                    final_price: payload.new.final_price
                });
                setExistingBid(payload.new as DeliveryBid);

                // If bid was accepted, notify parent
                if (payload.new.status === 'accepted' && onBidAccepted) {
                    console.log('🎉 Bid accepted! Notifying parent component...');
                    onBidAccepted();
                }
            } else {
                console.log('⏭️ Update is for different driver, ignoring');
            }
        });

        return () => {
            console.log('🔕 Unsubscribing from bid updates');
            channel.unsubscribe();
        };
    }, [orderId, driverId]);

    const loadExistingBid = async () => {
        try {
            setIsLoading(true);
            const bids = await AuctionService.getDriverBids(driverId);
            const myBid = bids.find(b => b.order_id === orderId);
            setExistingBid(myBid || null);
        } catch (err) {
            console.error('Error loading bid:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitBid = async () => {
        try {
            setIsSubmitting(true);
            setError('');

            const driverOffer = bidType === 'accept' ? null : parseFloat(counterOffer);

            // Validate counter-offer
            if (bidType === 'counter') {
                if (!counterOffer || isNaN(driverOffer!) || driverOffer! < basePrice) {
                    setError(`La oferta debe ser mayor o igual a ₡${basePrice.toLocaleString()}`);
                    return;
                }
            }

            // IMPORTANT: Start auction first if not already started
            // This will change order status from 3/4 to 7 (AUCTION_ACTIVE)
            try {
                console.log('🎯 Starting auction before creating bid...');
                await AuctionService.startAuction(orderId, distance || 3.5);
                console.log('✅ Auction started successfully');
            } catch (auctionError) {
                console.error('❌ Failed to start auction:', auctionError);
                // If auction already started (status already 7), continue
                // Otherwise, throw the error
                if (auctionError instanceof Error && !auctionError.message.includes('not in a valid status')) {
                    throw new Error('No se pudo iniciar la subasta. Por favor intenta de nuevo.');
                }
                console.log('⚠️ Auction may already be active, continuing with bid creation...');
            }

            console.log('📤 Creating bid...');
            await AuctionService.createBid({
                order_id: orderId,
                driver_id: driverId,
                driver_offer: driverOffer,
                distance_km: distance || undefined,
                driver_notes: driverNotes || undefined,
            });
            console.log('✅ Bid created successfully');

            // If accepting base price, bid is auto-accepted
            if (bidType === 'accept' && onBidAccepted) {
                onBidAccepted();
            }

            loadExistingBid();
        } catch (err) {
            console.error('❌ Error in handleSubmitBid:', err);
            setError(err instanceof Error ? err.message : 'Error al crear oferta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAcceptCounterOffer = async () => {
        if (!existingBid) return;

        try {
            setIsSubmitting(true);
            setError('');
            await AuctionService.acceptCounterOffer(existingBid.id);

            if (onBidAccepted) {
                onBidAccepted();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al aceptar contra-oferta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawBid = async () => {
        if (!existingBid) return;

        try {
            setIsSubmitting(true);
            setError('');
            await AuctionService.withdrawBid(existingBid.id, driverId);
            setExistingBid(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al retirar oferta');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-[16px] border border-gray-200 p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    // If bid already exists and is accepted
    if (existingBid?.status === 'accepted') {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[16px] border-2 border-green-500 p-6 shadow-lg">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-green-700">
                        ¡Orden Asignada!
                    </h3>
                    <p className="text-green-600 font-medium">
                        Precio acordado: <span className="text-2xl font-bold">₡{existingBid.final_price?.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-green-600">
                        El restaurante ya puede empezar a cocinar. Prepárate para recoger la orden.
                    </p>
                </div>
            </div>
        );
    }

    // If bid exists and customer made a counter-offer
    if (existingBid?.status === 'countered' && existingBid.customer_counter_offer) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[16px] border-2 border-blue-500 p-6 shadow-lg space-y-4">
                <h3 className="font-heading text-xl font-bold text-blue-700 flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    Contra-oferta del Cliente
                </h3>

                <div className="bg-white rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tu oferta:</span>
                        <span className="font-bold text-gray-800">₡{existingBid.driver_offer?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Contra-oferta:</span>
                        <span className="font-bold text-blue-600 text-xl">₡{existingBid.customer_counter_offer.toLocaleString()}</span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="outline"
                        onClick={handleWithdrawBid}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        Rechazar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAcceptCounterOffer}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    >
                        {isSubmitting ? 'Aceptando...' : 'Aceptar ₡' + existingBid.customer_counter_offer.toLocaleString()}
                    </Button>
                </div>
            </div>
        );
    }

    // If bid exists and is pending
    if (existingBid?.status === 'pending') {
        return (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-[16px] border-2 border-yellow-500 p-6 shadow-lg space-y-4">
                <h3 className="font-heading text-xl font-bold text-yellow-700 flex items-center gap-2">
                    <span className="text-2xl">⏳</span>
                    Oferta Enviada
                </h3>

                <div className="bg-white rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tu oferta:</span>
                        <span className="font-bold text-yellow-600 text-xl">₡{existingBid.driver_offer?.toLocaleString()}</span>
                    </div>
                    {existingBid.driver_notes && (
                        <div className="pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Nota:</span>
                            <p className="text-sm text-gray-700 mt-1">{existingBid.driver_notes}</p>
                        </div>
                    )}
                </div>

                <p className="text-sm text-yellow-600 text-center">
                    Esperando respuesta del cliente...
                </p>

                <Button
                    variant="outline"
                    onClick={handleWithdrawBid}
                    disabled={isSubmitting}
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                    Retirar Oferta
                </Button>
            </div>
        );
    }

    // No bid yet - show bidding form
    return (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-[16px] border-2 border-orange-500 p-6 shadow-lg space-y-6">
            <div className="text-center space-y-2">
                <h3 className="font-heading text-2xl font-bold text-orange-700">
                    💰 Oferta de Delivery
                </h3>
                <p className="text-sm text-gray-600">
                    Orden #{orderNumber} • {restaurantName}
                </p>
            </div>

            {/* Base Price Display */}
            <div className="bg-white rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Precio Base:</span>
                    <span className="font-heading text-3xl font-bold text-orange-600">
                        ₡{basePrice.toLocaleString()}
                    </span>
                </div>
                {distance && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Distancia:</span>
                        <span className="text-gray-700 font-medium">{distance.toFixed(1)} km</span>
                    </div>
                )}
                {customerAddress && (
                    <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Entregar en:</span>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{customerAddress}</p>
                    </div>
                )}
            </div>

            {/* Bid Type Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    ¿Qué deseas hacer?
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setBidType('accept')}
                        className={`p-4 rounded-xl border-2 transition-all ${bidType === 'accept'
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-green-300'
                            }`}
                    >
                        <div className="text-center space-y-1">
                            <div className="text-2xl">✅</div>
                            <div className="font-bold text-sm">Aceptar Base</div>
                            <div className="text-xs text-gray-500">Match inmediato</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setBidType('counter')}
                        className={`p-4 rounded-xl border-2 transition-all ${bidType === 'counter'
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                    >
                        <div className="text-center space-y-1">
                            <div className="text-2xl">💵</div>
                            <div className="font-bold text-sm">Proponer Precio</div>
                            <div className="text-xs text-gray-500">Negociar</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Counter Offer Form */}
            {bidType === 'counter' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tu Oferta (₡)
                        </label>
                        <input
                            type="number"
                            value={counterOffer}
                            onChange={(e) => setCounterOffer(e.target.value)}
                            placeholder={basePrice.toString()}
                            min={basePrice}
                            step="100"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg font-bold"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Mínimo: ₡{basePrice.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razón (Opcional)
                        </label>
                        <textarea
                            value={driverNotes}
                            onChange={(e) => setDriverNotes(e.target.value)}
                            placeholder="Ej: Camino en mal estado por lluvia"
                            rows={3}
                            maxLength={500}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {driverNotes.length}/500 caracteres
                        </p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <Button
                variant="primary"
                onClick={handleSubmitBid}
                disabled={isSubmitting || (bidType === 'counter' && !counterOffer)}
                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enviando...
                    </span>
                ) : bidType === 'accept' ? (
                    `🚴 TOMAR ORDEN - ₡${basePrice.toLocaleString()}`
                ) : (
                    `📤 Enviar Oferta - ₡${counterOffer ? parseFloat(counterOffer).toLocaleString() : '...'}`
                )}
            </Button>

            {bidType === 'accept' && (
                <p className="text-xs text-center text-gray-500">
                    Al aceptar el precio base, la orden se te asignará inmediatamente
                </p>
            )}
        </div>
    );
}
