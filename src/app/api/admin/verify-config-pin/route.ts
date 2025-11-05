/**
 * Verify Configuration PIN API
 * 
 * POST /api/admin/verify-config-pin
 * 
 * Verifies PIN for accessing Signal Center configuration tab
 * PIN is stored in .env as PIN_SIGNAL_CONFIGURATION
 * 
 * Security: Tracks failed attempts per user session to prevent brute force
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// In-memory storage for failed attempts (per user email)
// Format: { email: { attempts: number, lockedUntil: timestamp } }
const failedAttempts = new Map<string, { attempts: number; lockedUntil: number }>();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  const emailsToDelete: string[] = [];
  
  failedAttempts.forEach((data, email) => {
    if (data.lockedUntil && data.lockedUntil < now) {
      emailsToDelete.push(email);
    }
  });
  
  emailsToDelete.forEach(email => failedAttempts.delete(email));
}, 60 * 60 * 1000);

export async function POST(req: NextRequest) {
  console.log('\n🔐 ===== PIN VERIFICATION REQUEST =====');
  
  try {
    // Verify admin token (same pattern as other admin endpoints)
    console.log('1️⃣ Checking admin token...');
    const token = req.cookies.get('admin-token')?.value;
    
    if (!token) {
      console.log('❌ No admin-token cookie found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }
    
    console.log('✅ Admin token found');
    
    // Verify token
    console.log('2️⃣ Verifying token...');
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;
    
    console.log('✅ Token verified');
    console.log('   User email:', decoded.email);
    console.log('   User role:', decoded.role);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      console.log('❌ User is not admin. Role:', decoded.role);
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
      }, { status: 403 });
    }
    
    console.log('✅ User is admin');
    
    // Check if user is locked out
    const userEmail = decoded.email;
    const attemptData = failedAttempts.get(userEmail);
    const now = Date.now();
    
    if (attemptData && attemptData.lockedUntil && attemptData.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attemptData.lockedUntil - now) / 60000);
      console.warn('🚫 User is locked out:', userEmail);
      console.warn('   Remaining time:', remainingMinutes, 'minutes');
      return NextResponse.json({
        success: false,
        error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
        lockedUntil: attemptData.lockedUntil,
        remainingAttempts: 0,
      }, { status: 429 });
    }
    
    // Get PIN from request
    console.log('3️⃣ Parsing request body...');
    const body = await req.json();
    console.log('   Body received:', body);
    
    const { pin } = body;
    
    if (!pin) {
      console.log('❌ No PIN in request body');
      return NextResponse.json({
        success: false,
        error: 'PIN is required',
      }, { status: 400 });
    }
    
    console.log('✅ PIN received from request');
    
    // Get correct PIN from environment variable
    const correctPin = process.env.PIN_SIGNAL_CONFIGURATION;
    
    // Debug logging
    console.log('🔍 PIN Debug Info:');
    console.log('  - Received PIN:', pin);
    console.log('  - Received PIN type:', typeof pin);
    console.log('  - Received PIN length:', pin.length);
    console.log('  - Expected PIN:', correctPin);
    console.log('  - Expected PIN type:', typeof correctPin);
    console.log('  - Expected PIN length:', correctPin?.length);
    console.log('  - Comparison result:', pin === correctPin);
    console.log('  - Strict equality:', pin === correctPin);
    console.log('  - Loose equality:', pin == correctPin);
    
    if (!correctPin) {
      console.error('❌ PIN_SIGNAL_CONFIGURATION not set in environment variables');
      return NextResponse.json({
        success: false,
        error: 'PIN not configured on server',
      }, { status: 500 });
    }
    
    // Verify PIN (convert both to strings and trim)
    const pinStr = String(pin).trim();
    const correctPinStr = String(correctPin).trim();
    
    if (pinStr === correctPinStr) {
      // SUCCESS: Clear failed attempts
      failedAttempts.delete(userEmail);
      console.log('✅ Configuration PIN verified for admin:', decoded.email);
      
      // Set cookie to remember unlock status (expires in 24 hours)
      const response = NextResponse.json({
        success: true,
        message: 'PIN verified successfully',
      });
      
      response.cookies.set('config-unlocked', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      
      return response;
    } else {
      // FAILED: Increment attempts
      const currentAttempts = attemptData?.attempts || 0;
      const newAttempts = currentAttempts + 1;
      
      console.warn('⚠️ Failed PIN attempt for admin:', decoded.email);
      console.warn('   Attempt:', newAttempts, '/', MAX_ATTEMPTS);
      console.warn('   PIN mismatch: got', pinStr, 'expected', correctPinStr);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock user out for 15 minutes
        const lockedUntil = Date.now() + LOCKOUT_DURATION;
        failedAttempts.set(userEmail, { attempts: newAttempts, lockedUntil });
        
        console.error('🚫 User locked out for 15 minutes:', userEmail);
        
        return NextResponse.json({
          success: false,
          error: 'Maximum attempts exceeded. Account locked for 15 minutes.',
          remainingAttempts: 0,
          lockedUntil,
        }, { status: 429 });
      } else {
        // Update attempts
        failedAttempts.set(userEmail, { 
          attempts: newAttempts, 
          lockedUntil: 0 
        });
        
        const remainingAttempts = MAX_ATTEMPTS - newAttempts;
        
        return NextResponse.json({
          success: false,
          error: 'Incorrect PIN',
          remainingAttempts,
          totalAttempts: newAttempts,
        }, { status: 401 });
      }
    }
    
  } catch (error: any) {
    console.error('❌ PIN verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to verify PIN',
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin token
    const token = req.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Check if already unlocked via cookie
    const isUnlocked = req.cookies.get('config-unlocked')?.value === 'true';
    
    // Get attempt status for this user
    const userEmail = decoded.email;
    const attemptData = failedAttempts.get(userEmail);
    const now = Date.now();
    
    // If locked out
    if (attemptData && attemptData.lockedUntil && attemptData.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attemptData.lockedUntil - now) / 60000);
      return NextResponse.json({
        unlocked: false,
        locked: true,
        attempts: attemptData.attempts,
        remainingAttempts: 0,
        lockedUntil: attemptData.lockedUntil,
        remainingMinutes,
      });
    }
    
    // If already unlocked (has valid cookie)
    if (isUnlocked) {
      return NextResponse.json({
        unlocked: true,
        locked: false,
        attempts: 0,
        remainingAttempts: MAX_ATTEMPTS,
        maxAttempts: MAX_ATTEMPTS,
      });
    }
    
    // Not unlocked, show attempt status
    const attempts = attemptData?.attempts || 0;
    const remainingAttempts = MAX_ATTEMPTS - attempts;
    
    return NextResponse.json({
      unlocked: false,
      locked: false,
      attempts,
      remainingAttempts,
      maxAttempts: MAX_ATTEMPTS,
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Manual lock (when user clicks Lock button)
export async function DELETE(req: NextRequest) {
  try {
    // Verify admin token
    const token = req.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Clear unlock cookie
    const response = NextResponse.json({
      success: true,
      message: 'Configuration locked',
    });
    
    response.cookies.delete('config-unlocked');
    
    console.log('🔒 Configuration manually locked by:', decoded.email);
    
    return response;
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
