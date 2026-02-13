'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserService } from '@/services/user.service';

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { href: '/orders', label: 'Inicio', icon: '🏠' },
    { href: '/active', label: 'En proceso', icon: '🚴' },
    { href: '/history', label: 'Historial', icon: '📊' },
    { href: '/profile', label: 'Perfil', icon: '👤' },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await UserService.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-brand-accent h-screen sticky top-0">
            {/* Logo/Header */}
            <div className="p-6 border-b border-brand-accent">
                <h2 className="text-2xl font-heading font-bold text-brand-primary">
                    🚀 Delivery App
                </h2>
                <p className="text-sm text-brand-text opacity-60 mt-1">
                    Panel de Repartidor
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <div className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all font-medium',
                                    isActive
                                        ? 'bg-brand-primary text-white shadow-md'
                                        : 'text-brand-text hover:bg-brand-accent'
                                )}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-brand-accent">
                <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </Button>
            </div>
        </aside>
    );
}
