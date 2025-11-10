import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { validateBinanceCredentials } from '@/lib/binance';

// GET - Get all exchange connections for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all connections (without sensitive data)
    const connections = await ExchangeConnection.find({ userId: user._id });

    return NextResponse.json({ connections }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching exchange connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST - Add new exchange connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { exchange, apiKey, apiSecret, nickname, permissions } = body;

    // Validation
    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Exchange, API Key, and API Secret are required' },
        { status: 400 }
      );
    }

    if (!['binance', 'bybit', 'kucoin', 'okx'].includes(exchange)) {
      return NextResponse.json(
        { error: 'Invalid exchange. Supported: binance, bybit, kucoin, okx' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ MAINNET ONLY - Check if connection already exists
    const existingConnection = await ExchangeConnection.findOne({
      userId: user._id,
      exchange,
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: `${exchange} connection already exists. Please update the existing one.` },
        { status: 409 }
      );
    }

    // ✅ MAINNET ONLY - Validate Binance API credentials before saving
    if (exchange === 'binance') {
      console.log('🔍 Validating Binance API credentials...');
      
      const validation = await validateBinanceCredentials(
        apiKey,
        apiSecret,
        false // Mainnet only
      );

      if (!validation.valid) {
        console.log('❌ Binance validation failed:', validation.message);
        return NextResponse.json(
          { 
            error: validation.message,
            details: 'Please verify your API Key and Secret are correct and have proper permissions.'
          },
          { status: 400 }
        );
      }

      console.log('✅ Binance API credentials validated successfully');
      
      // Log account permissions for debugging
      if (validation.accountInfo) {
        console.log('Account permissions:', validation.accountInfo.permissions);
      }
    }

    // Create new connection (encryption happens automatically in pre-save hook)
    const connection = await ExchangeConnection.create({
      userId: user._id,
      exchange,
      apiKey, // Will be encrypted by pre-save middleware
      apiSecret, // Will be encrypted by pre-save middleware
      nickname: nickname || `${exchange} Account`,
      permissions: permissions || { spot: false, futures: false, margin: false },
      isActive: true,
      lastConnected: new Date(), // Set initial connection time
    });

    console.log('✅ Exchange connection saved with encrypted credentials');

    // Return without sensitive data
    const responseConnection = {
      _id: connection._id,
      exchange: connection.exchange,
      nickname: connection.nickname,
      isActive: connection.isActive,
      permissions: connection.permissions,
      createdAt: connection.createdAt,
    };

    return NextResponse.json(
      { 
        message: 'Exchange connection added successfully',
        connection: responseConnection 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding exchange connection:', error);
    return NextResponse.json(
      { error: 'Failed to add connection' },
      { status: 500 }
    );
  }
}

// PUT - Update exchange connection
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { connectionId, apiKey, apiSecret, nickname, isActive, permissions } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find and update connection
    const connection = await ExchangeConnection.findOne({
      _id: connectionId,
      userId: user._id,
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (apiKey) connection.apiKey = apiKey;
    if (apiSecret) connection.apiSecret = apiSecret;
    if (nickname) connection.nickname = nickname;
    if (typeof isActive === 'boolean') connection.isActive = isActive;
    if (permissions) connection.permissions = permissions;
    connection.lastConnected = new Date();

    await connection.save();

    // Return without sensitive data
    const responseConnection = {
      _id: connection._id,
      exchange: connection.exchange,
      nickname: connection.nickname,
      isActive: connection.isActive,
      permissions: connection.permissions,
      lastConnected: connection.lastConnected,
      updatedAt: connection.updatedAt,
    };

    return NextResponse.json(
      { 
        message: 'Connection updated successfully',
        connection: responseConnection 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating exchange connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// DELETE - Remove exchange connection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete connection
    const result = await ExchangeConnection.deleteOne({
      _id: connectionId,
      userId: user._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Connection deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting exchange connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
