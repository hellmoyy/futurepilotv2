import bcrypt from 'bcryptjs';

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface AdminSession {
  email: string;
  role: 'admin';
  loginTime: Date;
}

// Verify admin credentials from environment variables
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials not configured in environment variables');
    return false;
  }

  // Check if email matches
  if (email !== adminEmail) {
    return false;
  }

  // Compare password directly (plain text for now, will be hashed in production)
  return password === adminPassword;
}

// Check if user is authenticated as admin from session
export function isAdminAuthenticated(session: any): boolean {
  return session?.user?.role === 'admin' && session?.user?.email === process.env.ADMIN_EMAIL;
}

// Create admin session data
export function createAdminSession(email: string): AdminSession {
  return {
    email,
    role: 'admin',
    loginTime: new Date(),
  };
}
