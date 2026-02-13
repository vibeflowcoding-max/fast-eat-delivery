import { UserProfile } from '@/schemas/user.schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logoutDriver, toggleOnline } from '@/actions/driver.actions';
import Link from 'next/link';

export function Header({ driver }: { driver: UserProfile }) {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link className="mr-6 flex items-center space-x-2 font-bold" href="/feed">
                        <span>FastDelivery</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link className="transition-colors hover:text-foreground/80 text-foreground" href="/feed">
                            Feed
                        </Link>
                        <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/active-order">
                            Active Order
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        <Badge variant={driver.subscriptionStatus === 'ACTIVE' ? 'default' : 'destructive'}>
                            {driver.subscriptionStatus}
                        </Badge>
                        <span className="ml-2 text-sm text-muted-foreground">
                            Online: {driver.isOnline ? '🟢' : '🔴'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <form action={async () => {
                            'use server';
                            await toggleOnline(driver.id);
                        }}>
                            <Button variant="outline" size="sm">
                                {driver.isOnline ? 'Go Offline' : 'Go Online'}
                            </Button>
                        </form>
                        <form action={async () => {
                            'use server';
                            await logoutDriver();
                        }}>
                            <Button variant="ghost" size="sm">Logout</Button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    );
}
