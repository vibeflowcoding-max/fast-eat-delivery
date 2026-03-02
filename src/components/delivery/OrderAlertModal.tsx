'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, Clock, Banknote, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrderWithDetails } from '@/schemas/order.schema';

interface OrderAlertModalProps {
    order: OrderWithDetails | null;
    onOpenDetails: (order: OrderWithDetails) => void;
    onClose: () => void;
}

export function OrderAlertModal({ order, onOpenDetails, onClose }: OrderAlertModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (order) {
            setIsVisible(true);
            // Auto close after 30 seconds if no interaction
            const timer = setTimeout(() => {
                handleClose();
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [order]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    if (!order) return null;

    const total = order.total || 0;
    const itemsCount = order.items?.length || 0;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl border border-brand-accent relative"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Flash/Wave Animation Header */}
                        <div className="h-32 bg-brand-primary relative flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 rounded-full bg-white/30"
                                />
                                <motion.div
                                    animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    className="w-20 h-20 rounded-full bg-white/20"
                                />
                            </div>
                            <div className="bg-white rounded-full p-4 shadow-lg relative z-10">
                                <Navigation className="w-8 h-8 text-brand-primary fill-brand-primary/20" />
                            </div>
                        </div>

                        <div className="p-6 text-center space-y-4">
                            <div>
                                <h3 className="text-2xl font-heading font-black text-brand-text">
                                    ¡Nueva Orden!
                                </h3>
                                <p className="text-brand-text/60 font-medium">
                                    #{order.order_number} • {itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-2">
                                <div className="bg-brand-background rounded-2xl p-3 flex flex-col items-center justify-center border border-brand-accent">
                                    <Clock className="w-5 h-5 text-brand-primary mb-1" />
                                    <span className="text-xs text-brand-text/60 font-medium">Recogida</span>
                                    <span className="text-sm font-bold text-brand-text">~10 min</span>
                                </div>
                                <div className="bg-brand-background rounded-2xl p-3 flex flex-col items-center justify-center border border-brand-accent">
                                    <Banknote className="w-5 h-5 text-green-500 mb-1" />
                                    <span className="text-xs text-brand-text/60 font-medium">Ganancia</span>
                                    <span className="text-sm font-bold text-green-600">₡{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3">
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Restaurante</p>
                                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{order.restaurant?.name}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPin className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Entrega</p>
                                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{order.delivery_address || 'Dirección de entrega'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    onClick={() => onOpenDetails(order)}
                                    className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-black text-lg shadow-lg shadow-brand-primary/20"
                                >
                                    Ver Detalles
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
                                    className="w-full h-12 rounded-2xl text-brand-text/40 font-bold hover:bg-transparent hover:text-brand-text/60"
                                >
                                    Ignorar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
