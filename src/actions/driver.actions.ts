'use server';

import { driverService } from '@/services/driver.service';
import { UserProfile } from '@/schemas/user.schema';
import { cookies } from 'next/headers';

export type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };

export async function loginDriver(email: string): Promise<ActionResponse<UserProfile>> {
  try {
    const driver = await driverService.getDriverByEmail(email);
    if (!driver) {
      return { success: false, error: 'Driver not found' };
    }
    (await cookies()).set('driverId', driver.user_id);
    return { success: true, data: driver };
  } catch (error) {
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function logoutDriver() {
  (await cookies()).delete('driverId');
}

export async function toggleOnline(driverId: string): Promise<ActionResponse<UserProfile>> {
  try {
    const driver = await driverService.toggleOnlineStatus(driverId);
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
