'use server';

import { driverService } from '@/services/driver.service';
import { UserProfile } from '@/schemas/user.schema';
import { cookies } from 'next/headers';

import { revalidatePath } from 'next/cache';

export type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };

export async function loginDriver(email: string): Promise<ActionResponse<UserProfile>> {
  try {
    const driver = await driverService.getDriverByEmail(email);
    if (!driver) {
      return { success: false, error: 'Driver not found' };
    }

    const cookieStore = await cookies();
    cookieStore.set('driverId', driver.user_id);

    revalidatePath('/dashboard');
    return { success: true, data: driver };
  } catch (error) {
    return { success: false, error: 'Login failed' };
  }
}

export async function logoutDriver() {
  const { createClient } = await import('@/lib/supabase/server');
  const { redirect } = await import('next/navigation');
  
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  redirect('/login');
}

export async function toggleOnline(driverId: string): Promise<ActionResponse<UserProfile>> {
  try {
    const driver = await driverService.toggleOnlineStatus(driverId);
    revalidatePath('/dashboard', 'layout');
    return { success: true, data: driver };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getDriverProfile(driverId: string): Promise<ActionResponse<UserProfile>> {
  try {
      const driver = await driverService.getDriverById(driverId);
      if (!driver) return { success: false, error: 'Driver not found' };
      return { success: true, data: driver };
  } catch (error) {
      return { success: false, error: 'Failed to fetch profile' };
  }
}
