import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { driverService } from '@/services/driver.service';
import { Header } from '@/components/dashboard/header';
import { BottomNav } from '@/components/delivery/BottomNav';
import { DriverStatusProvider } from '@/context/driver-status.context';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log('No user session found in DashboardLayout, redirecting to /login');
        redirect('/login');
    }

    const driverId = user.id;

    try {
        let driver = await driverService.getDriverById(driverId);

        if (!driver) {
            console.log('No driver profile found for user:', driverId, 'Creating one...');
            // Attempt to create profile if missing
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser) {
                    const { data: newProfile, error: insertError } = await supabase
                        .from('user_profiles')
                        .insert({
                            user_id: authUser.id,
                            email: authUser.email,
                            full_name: authUser.user_metadata.full_name || authUser.email?.split('@')[0],
                            role_id: 'c8dd43d7-1070-470d-ac58-d01f8dae8511', // Delivery role ID
                        })
                        .select()
                        .single();

                    if (!insertError && newProfile) {
                        console.log('Profile created successfully on the fly');
                        driver = newProfile as any;
                    } else {
                        console.error('Failed to create profile on the fly:', insertError);
                        redirect('/login');
                    }
                } else {
                    redirect('/login');
                }
            } catch (createError) {
                console.error('Critical error creating profile on the fly:', createError);
                redirect('/login');
            }
        }

        if (!driver) {
            redirect('/login');
        }

        return (
            <DriverStatusProvider userId={driverId} initialIsOnline={!!driver.is_online}>
                <div className="flex min-h-[100dvh] flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 pb-32 md:pb-8">
                        {children}
                    </main>
                    <BottomNav />
                </div>
            </DriverStatusProvider>
        );
    } catch (error) {
        // If data validation fails (e.g. invalid cookie ID format), force logout
        console.error("Dashboard Layout Error:", error);
        redirect('/login');
    }
}
