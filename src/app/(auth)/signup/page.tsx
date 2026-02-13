'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserService } from '@/services/user.service';
import { SignUpSchema, type SignUpInput } from '@/schemas/user.schema';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<SignUpInput>({
        email: '',
        password: '',
        full_name: '',
        phone: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof SignUpInput, string>>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setGeneralError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setGeneralError('');

        const result = SignUpSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (field && typeof field === 'string') {
                    fieldErrors[field as keyof SignUpInput] = issue.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);
        try {
            await UserService.signUp(formData);
            router.push('/orders');
        } catch (error) {
            setGeneralError(error instanceof Error ? error.message : 'Error al crear cuenta');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        setGeneralError('');
        try {
            await UserService.signInWithGoogle();
        } catch (error) {
            setGeneralError(error instanceof Error ? error.message : 'Error al registrarse con Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-heading text-3xl font-bold text-brand-text">
                        Crear Cuenta
                    </CardTitle>
                    <CardDescription>Regístrate como repartidor</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {generalError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-[16px] text-red-600 text-sm">
                                {generalError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="full_name" className="block text-sm font-medium text-brand-text">
                                Nombre Completo
                            </label>
                            <Input
                                id="full_name"
                                name="full_name"
                                type="text"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Juan Pérez"
                                disabled={isLoading}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-600">{errors.full_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-brand-text">
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="tu@email.com"
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="block text-sm font-medium text-brand-text">
                                Teléfono (Opcional)
                            </label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+506 1234 5678"
                                disabled={isLoading}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-brand-text">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="default"
                            className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">O continúa con</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleSignUp}
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </Button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/login" className="text-brand-primary hover:underline font-medium">
                            Inicia sesión
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
