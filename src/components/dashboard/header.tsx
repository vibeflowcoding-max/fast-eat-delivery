import { UserProfile } from '@/schemas/user.schema';
import { Badge } from '@/components/ui/badge';
import { logoutDriver } from '@/actions/driver.actions';
import { OnlineToggle } from './online-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header({ driver }: { driver: UserProfile }) {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link className="mr-6 flex items-center space-x-2 font-bold" href="/dashboard/feed">
                        <span>FastDelivery</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link className="transition-colors hover:text-foreground/80 text-foreground" href="/dashboard/feed">
                            🏠 Inicio
                        </Link>
                        <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/dashboard/active-order">
                            🚴 En Proceso
                        </Link>
                        <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/dashboard/history">
                            📋 Historial
                        </Link>
                        <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/dashboard/profile">
                            👤 Perfil
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="flex items-center gap-4">
                        <Badge variant={driver.subscription_status === 'ACTIVE' ? 'default' : 'destructive'}>
                            {driver.subscription_status}
                        </Badge>
                        <OnlineToggle userId={driver.user_id} isOnline={!!driver.is_online} />
                    </div>
                    <div className="flex items-center gap-2">
                        <form action={logoutDriver}>
                            <Button variant="ghost" size="sm" type="submit">Logout</Button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    );
}
