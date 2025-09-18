import { Router } from 'express';
import { SupabaseAuthService, registerSchema, loginSchema } from '../domain/auth/supabase-auth.service.js';
import { createError } from '../middleware/errorHandler.js';
import { authenticateSupabase } from '../middleware/supabase-auth.middleware.js';

export const authRouter = Router();

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = registerSchema.parse(req.body);

    // Register user
    const result = await SupabaseAuthService.register(email, password);

    res.status(201).json({
      user: result.user,
      session: result.session,
      needsEmailVerification: result.needsEmailVerification,
      message: result.needsEmailVerification
        ? 'Please check your email to verify your account'
        : 'Registration successful',
    });
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return next(createError('Email already registered', 409));
    }
    next(error);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Login user
    const result = await SupabaseAuthService.login(email, password);

    res.json({
      user: result.user,
      profile: result.profile,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return next(createError('Invalid email or password', 401));
    }
    next(error);
  }
});

// Refresh tokens
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError('Refresh token required', 400));
    }

    const result = await SupabaseAuthService.refreshSession(refreshToken);

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    if (error.message.includes('Invalid refresh token')) {
      return next(createError('Invalid or expired refresh token', 401));
    }
    next(error);
  }
});

// Logout
authRouter.post('/logout', authenticateSupabase, async (req, res, next) => {
  try {
    await SupabaseAuthService.logout(req.supabaseAccessToken!);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user
authRouter.get('/me', authenticateSupabase, async (req, res, next) => {
  try {
    const user = await SupabaseAuthService.getUser(req.supabaseAccessToken!);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Send password reset email
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createError('Email required', 400));
    }

    await SupabaseAuthService.sendPasswordResetEmail(email);
    res.json({
      message: 'Password reset email sent. Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
});

// Update password (requires authentication)
authRouter.post('/update-password', authenticateSupabase, async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return next(createError('Password must be at least 8 characters', 400));
    }

    await SupabaseAuthService.updatePassword(req.supabaseAccessToken!, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Resend verification email
authRouter.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createError('Email required', 400));
    }

    await SupabaseAuthService.resendVerificationEmail(email);
    res.json({
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    next(error);
  }
});