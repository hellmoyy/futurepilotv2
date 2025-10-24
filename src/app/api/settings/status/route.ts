import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get user data
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get exchange connections count
    const exchangeConnections = await fetch(`${process.env.NEXTAUTH_URL}/api/exchange-connections`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });
    
    let exchangeData = { connections: [], count: 0, verified: 0 };
    if (exchangeConnections.ok) {
      const data = await exchangeConnections.json();
      exchangeData = {
        connections: data.connections || [],
        count: (data.connections || []).length,
        verified: (data.connections || []).filter((conn: any) => conn.isActive).length
      };
    }

    // Cast to any for optional fields not yet in User model
    const userAny = user as any;

    // Calculate settings status
    const settingsStatus = {
      profile: {
        completed: !!(user.name && userAny.avatar),
        avatar: !!userAny.avatar,
        name: !!user.name,
        phone: !!userAny.phoneNumber
      },
      security: {
        completed: !!(user.twoFactorEnabled && user.emailVerified),
        twoFA: !!user.twoFactorEnabled,
        passwordChanged: !!userAny.passwordChangedAt,
        emailVerified: !!user.emailVerified
      },
      exchange: {
        completed: exchangeData.count > 0 && exchangeData.verified > 0,
        connected: exchangeData.count,
        verified: exchangeData.verified
      },
      notification: {
        completed: !!(userAny.notificationSettings?.email || userAny.notificationSettings?.telegram || userAny.notificationSettings?.push),
        email: !!userAny.notificationSettings?.email,
        telegram: !!userAny.telegramId,
        push: !!userAny.notificationSettings?.push
      }
    };

    return NextResponse.json(settingsStatus);

  } catch (error) {
    console.error('Error fetching settings status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings status' },
      { status: 500 }
    );
  }
}