import { createClient } from '@/lib/supabase/client';
import type { UserProfile, SignUpInput } from '@/schemas/user.schema';
import type { User } from '@supabase/supabase-js';

export class UserService {
  /**
   * Create a user profile in the user_profiles table with delivery role
   */
  static async createUserProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role_id: 'c8dd43d7-1070-470d-ac58-d01f8dae8511', // Delivery role ID
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating user profile: ${error.message}`);
    }

    return profile as UserProfile;
  }

  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    return data as UserProfile;
  }

  /**
   * Sign up a new user with email and password
   */
  static async signUp(input: SignUpInput): Promise<{ user: User; profile: UserProfile }> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.full_name,
          phone: input.phone,
        },
      },
    });

    if (error) {
      throw new Error(`Error signing up: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('No user returned from sign up');
    }

    // Create user profile
    const profile = await this.createUserProfile(data.user.id, {
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
    });

    return { user: data.user, profile };
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Error signing in: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('No user returned from sign in');
    }

    return data.user;
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(`Error signing in with Google: ${error.message}`);
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Error signing out: ${error.message}`);
    }
  }

  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Send a password reset email to the user
   */
  static async sendPasswordResetEmail(email: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      throw new Error(`Error sending password reset email: ${error.message}`);
    }
  }

  /**
   * Update the current user's password
   */
  static async updateUserPassword(password: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }
  
  /**
   * Update the current user's profile
   */
  static async updateUserProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    const supabase = createClient();
    
    // Update profile table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }

    // Also update Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: data.full_name,
        phone: data.phone,
      },
    });

    if (authError) {
      console.warn('Profile updated but Auth metadata failed:', authError.message);
    }

    return profile as UserProfile;
  }
}
