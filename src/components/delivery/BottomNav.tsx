'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-accent z-50 md:hidden">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                                isActive
                                    ? 'text-brand-primary'
                                    : 'text-brand-text opacity-60 hover:opacity-100'
                            )}
                        >
                            <span className="text-2xl mb-1">{item.icon}</span>
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
