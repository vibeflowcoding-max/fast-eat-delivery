import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'solito/navigation';
import { usePathname } from 'solito/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavItem {
    href: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { href: '/dashboard/feed', label: 'Inicio', icon: '🏠' },
    { href: '/dashboard/active-order', label: 'En proceso', icon: '🚴' },
    { href: '/dashboard/history', label: 'Historial', icon: '📊' },
    { href: '/dashboard/profile', label: 'Perfil', icon: '👤' },
];

export function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-row items-center border-t border-gray-200 bg-white md:hidden"
            style={{
                paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom,
                paddingTop: 12,
            }}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <TouchableOpacity
                        key={item.href}
                        onPress={() => router.push(item.href as any)}
                        className="flex-1 items-center justify-center p-2"
                    >
                        <Text className="text-2xl mb-1">{item.icon}</Text>
                        <Text
                            className={`text-[10px] font-medium text-center ${isActive ? 'text-brand-primary' : 'text-gray-500'
                                }`}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
