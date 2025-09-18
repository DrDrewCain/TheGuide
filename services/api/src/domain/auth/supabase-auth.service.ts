import { z } from 'zod';
import { supabase, supabaseAdmin } from '../../config/supabase.js';
import { AuthError } from '@supabase/supabase-js';

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = registerSchema;

export class SupabaseAuthService {
  static async register(email: string, password: string) {
    try {
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('User already exists');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      // Return user and session info
      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
        },
        session: data.session,
        needsEmailVerification: !data.user.email_confirmed_at,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  static async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error('Invalid credentials');
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed');
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          emailVerified: !!data.user.email_confirmed_at,
        },
        profile,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw new Error('Invalid credentials');
      }
      throw error;
    }
  }

  static async logout(accessToken: string) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async refreshSession(refreshToken: string) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new Error('Invalid refresh token');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getUser(accessToken: string) {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        throw new Error('Invalid access token');
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        emailVerified: !!data.user.email_confirmed_at,
      };
    } catch (error) {
      throw error;
    }
  }

  static async updatePassword(accessToken: string, newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser(
        { password: newPassword }
      );

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async sendPasswordResetEmail(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async resendVerificationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Admin functions (using service role key)
  static async deleteUser(userId: string) {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async listUsers(page = 1, perPage = 50) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }
}