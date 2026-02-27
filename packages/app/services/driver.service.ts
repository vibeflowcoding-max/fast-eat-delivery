import { createClient } from '../lib/supabase/server';
import { UserProfile, UserProfileSchema } from '../schemas/user.schema';

export class DriverService {
  async getDriverById(id: string): Promise<UserProfile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error || !data) {
      console.error('[DriverService] Error fetching driver by id:', error);
      return null;
    }

    return UserProfileSchema.parse(data);
  }

  async getDriverByEmail(email: string): Promise<UserProfile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      console.error('[DriverService] Error fetching driver by email:', error);
      return null;
    }

    return UserProfileSchema.parse(data);
  }

  async toggleOnlineStatus(id: string): Promise<UserProfile> {
    const supabase = await createClient();

    // Get current status
    const driver = await this.getDriverById(id);
    if (!driver) throw new Error('Driver not found');

    const newStatus = !driver.is_online;

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_online: newStatus })
      .eq('user_id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating online status: ${error.message}`);
    }

    return UserProfileSchema.parse(data);
  }
}

export const driverService = new DriverService();
