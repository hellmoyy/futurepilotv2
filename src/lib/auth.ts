import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyTwoFactorToken } from '@/lib/twoFactor';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await connectDB();

        // Find user with password, 2FA fields, and lockout fields
        const user = await User.findOne({ email: credentials.email })
          .select('+password +twoFactorEnabled +twoFactorSecret +twoFactorBackupCodes +accountLockedUntil +lastFailedLogin');

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if user is banned
        if (user.isBanned) {
          throw new Error('Your account has been banned. Please contact administrator for more information.');
        }

        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          const minutesRemaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Account is locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute(s).`);
        }

        // Reset lockout if time has passed
        if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
          user.failedLoginAttempts = 0;
          user.accountLockedUntil = undefined;
          await user.save();
        }

        // Check if user has a password (for OAuth users, password might be null)
        if (!user.password) {
          throw new Error('Please sign in with your OAuth provider');
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          // Increment failed login attempts
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          user.lastFailedLogin = new Date();

          // Lock account after 5 failed attempts for 30 minutes
          if (user.failedLoginAttempts >= 5) {
            user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            await user.save();
            throw new Error('Too many failed login attempts. Your account has been locked for 30 minutes.');
          }

          await user.save();
          const remainingAttempts = 5 - user.failedLoginAttempts;
          throw new Error(`Invalid email or password. ${remainingAttempts} attempt(s) remaining before account lockout.`);
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        // Reset failed login attempts on successful password validation
        if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
          user.failedLoginAttempts = 0;
          user.accountLockedUntil = undefined;
          user.lastFailedLogin = undefined;
          await user.save();
        }

        // Check if 2FA is enabled for this user
        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('2FA_REQUIRED');
          }

          // Check if it's a backup code first
          let isValid = false;
          let usedBackupCode = false;

          if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
            // Try to match backup code (hashed)
            for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
              const isBackupCodeValid = await bcrypt.compare(
                credentials.twoFactorCode,
                user.twoFactorBackupCodes[i]
              );

              if (isBackupCodeValid) {
                isValid = true;
                usedBackupCode = true;
                // Remove used backup code
                user.twoFactorBackupCodes.splice(i, 1);
                await user.save();
                console.log(`✅ Backup code used for user: ${user.email}`);
                break;
              }
            }
          }

          // If not a valid backup code, try TOTP
          if (!isValid && user.twoFactorSecret) {
            isValid = verifyTwoFactorToken(credentials.twoFactorCode, user.twoFactorSecret);
          }

          if (!isValid) {
            throw new Error('Invalid 2FA code. Please check your authenticator app or use a backup code.');
          }

          // If backup code was used, add flag to session
          if (usedBackupCode) {
            console.log(`⚠️ User ${user.email} has ${user.twoFactorBackupCodes?.length || 0} backup codes remaining`);
          }
        }

        return {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60, // 14 days (reduced from 30 for security)
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
