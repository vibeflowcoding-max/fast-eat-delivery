import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { driverService } from '@/services/driver.service';
import { Header } from '@/components/dashboard/header';
import { BottomNav } from '@/components/delivery/BottomNav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const driverId = (await cookies()).get('driverId')?.value;

    if (!driverId) {
        redirect('/login');
    }

    try {
        const driver = await driverService.getDriverById(driverId);
        if (!driver) {
            redirect('/login');
        }

        return (
            <div className="flex min-h-screen flex-col">
                <Header driver={driver} />
                <main className="flex-1 space-y-4 p-8 pt-6 pb-20 md:pb-6">
                    {children}
                </main>
                <BottomNav />
            </div>
        );
    } catch (error) {
        // If data validation fails (e.g. invalid cookie ID format), force logout
        console.error("Dashboard Layout Error:", error);
        redirect('/login');
    }
}
