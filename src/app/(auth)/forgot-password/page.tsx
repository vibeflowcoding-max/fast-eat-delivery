'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserService } from '@/services/user.service';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            await UserService.sendPasswordResetEmail(email);
            setMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar el correo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-heading text-3xl font-bold text-brand-text">
                        Recuperar Contraseña
                    </CardTitle>
                    <CardDescription>
                        Ingresa tu email para recibir un enlace de recuperación
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-[16px] text-green-600 text-sm">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-[16px] text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-brand-text">
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                disabled={isLoading || message !== ''}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                            disabled={isLoading || message !== ''}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                        </Button>

                        <div className="text-center text-sm">
                            <Link href="/login" className="text-brand-primary hover:underline font-medium">
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
