'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendPasswordResetAction, updatePasswordAction } from '@/actions/auth.actions';

type Mode = 'idle' | 'change' | 'reset';
type Status = { type: 'success' | 'error'; message: string } | null;

function PasswordInput({
    id,
    placeholder,
    value,
    onChange,
    disabled,
}: {
    id: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input
                id={id}
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="pr-10"
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={show ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

export function ChangePasswordCard({ email }: { email: string }) {
    const [mode, setMode] = useState<Mode>('idle');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    // Change password form
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');

    const reset = () => {
        setMode('idle');
        setStatus(null);
        setCurrent('');
        setNext('');
        setConfirm('');
    };

    // --- Validation for change mode ---
    const passwordsMatch = next === confirm;
    const nextLongEnough = next.length >= 8;
    const canSubmitChange = current.length > 0 && nextLongEnough && passwordsMatch;

    const handleChangePassword = async () => {
        if (!canSubmitChange) return;
        setLoading(true);
        setStatus(null);
        const result = await updatePasswordAction(email, current, next);
        setLoading(false);
        if (result.success) {
            setStatus({ type: 'success', message: '¡Contraseña actualizada con éxito!' });
            setCurrent(''); setNext(''); setConfirm('');
        } else {
            setStatus({ type: 'error', message: result.error || 'Error desconocido.' });
        }
    };

    const handleSendReset = async () => {
        setLoading(true);
        setStatus(null);
        const result = await sendPasswordResetAction(email);
        setLoading(false);
        if (result.success) {
            setStatus({ type: 'success', message: `Enviamos un enlace de restablecimiento a ${email}. Revisa tu correo.` });
        } else {
            setStatus({ type: 'error', message: result.error || 'Error al enviar el correo.' });
        }
    };

    return (
        <div className="bg-white rounded-[16px] p-6 mb-6 border border-brand-accent">
            {/* Header - always visible */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <Lock className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="text-xl font-heading font-bold text-brand-text">
                    Seguridad
                </h3>
            </div>

            {/* Status feedback */}
            {status && (
                <div
                    className={cn(
                        'flex items-start gap-2 p-3 rounded-xl mb-4 text-sm font-medium',
                        status.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                    )}
                >
                    {status.type === 'success'
                        ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                    <span>{status.message}</span>
                </div>
            )}

            {/* Idle state */}
            {mode === 'idle' && (
                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => { setStatus(null); setMode('change'); }}
                    >
                        <Lock className="w-4 h-4" />
                        Cambiar contraseña
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-brand-text/70"
                        onClick={() => { setStatus(null); setMode('reset'); }}
                    >
                        <Mail className="w-4 h-4" />
                        ¿Olvidaste tu contraseña? Recíbela por email
                    </Button>
                </div>
            )}

            {/* Change password mode */}
            {mode === 'change' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">
                            Contraseña actual
                        </label>
                        <PasswordInput
                            id="current-password"
                            placeholder="Tu contraseña actual"
                            value={current}
                            onChange={setCurrent}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">
                            Nueva contraseña
                        </label>
                        <PasswordInput
                            id="new-password"
                            placeholder="Mínimo 8 caracteres"
                            value={next}
                            onChange={setNext}
                            disabled={loading}
                        />
                        {next.length > 0 && !nextLongEnough && (
                            <p className="text-xs text-red-500 mt-1">Debe tener al menos 8 caracteres.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">
                            Confirmar nueva contraseña
                        </label>
                        <PasswordInput
                            id="confirm-password"
                            placeholder="Repite la nueva contraseña"
                            value={confirm}
                            onChange={setConfirm}
                            disabled={loading}
                        />
                        {confirm.length > 0 && !passwordsMatch && (
                            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
                        )}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            className="flex-1 font-bold"
                            onClick={handleChangePassword}
                            disabled={loading || !canSubmitChange}
                        >
                            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                        </Button>
                        <Button variant="outline" onClick={reset} disabled={loading}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}

            {/* Reset by email mode */}
            {mode === 'reset' && (
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-sm text-amber-700">
                            Enviaremos un enlace de restablecimiento de contraseña a:
                        </p>
                        <p className="text-sm font-bold text-amber-800 mt-1">📧 {email}</p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className="flex-1 font-bold"
                            onClick={handleSendReset}
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Enviar enlace'}
                        </Button>
                        <Button variant="outline" onClick={reset} disabled={loading}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
