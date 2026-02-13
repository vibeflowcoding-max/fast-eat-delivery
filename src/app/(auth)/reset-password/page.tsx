'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserService } from '@/services/user.service';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            await UserService.updateUserPassword(password);
            setMessage('Tu contraseña ha sido actualizada correctamente.');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-heading text-3xl font-bold text-brand-text">
                        Nueva Contraseña
                    </CardTitle>
                    <CardDescription>
                        Ingresa tu nueva contraseña para acceder a tu cuenta
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
                            <label htmlFor="password" className="block text-sm font-medium text-brand-text">
                                Nueva Contraseña
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading || message !== ''}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-text">
                                Confirmar Contraseña
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
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
                            {isLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
