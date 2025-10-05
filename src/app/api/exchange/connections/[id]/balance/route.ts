import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { ExchangeConnection } from '@/models/ExchangeConnection';
import { BinanceClient } from '@/lib/binance';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find connection with decrypted keys
    const connection = await ExchangeConnection.findOne({
      _id: params.id,
      userId: session.user.id,
    }).select('+apiKey +apiSecret');

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Only Binance is supported for now
    if (connection.exchange !== 'binance') {
      return NextResponse.json(
        { error: 'Balance fetching only supported for Binance' },
        { status: 400 }
      );
    }

    // Decrypt API credentials with error handling
    let decryptedApiKey: string;
    let decryptedApiSecret: string;
    
    try {
      decryptedApiKey = decryptApiKey(connection.apiKey);
      decryptedApiSecret = decryptApiKey(connection.apiSecret);
    } catch (decryptError: any) {
      console.error('Decryption error:', decryptError);
      return NextResponse.json(
        { 
          error: 'Failed to decrypt API credentials. Please reconnect your exchange.',
          details: decryptError.message 
        },
        { status: 500 }
      );
    }

    // Get balances from Binance
    const binanceClient = new BinanceClient(decryptedApiKey, decryptedApiSecret, connection.testnet);
    
    let spotBalance = 0;
    let futuresBalance = 0;

    try {
      // Fetch spot balance if permission enabled
      if (connection.permissions?.spot) {
        const spotBalances = await binanceClient.getAccountBalances();
        
        // Only count stablecoins (USDT, USDC, BUSD) as USD balance
        // This avoids incorrect summing of different cryptocurrencies
        const stablecoins = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD'];
        
        spotBalance = spotBalances.reduce((total: number, balance: any) => {
          if (stablecoins.includes(balance.asset)) {
            const free = parseFloat(balance.free) || 0;
            const locked = parseFloat(balance.locked) || 0;
            return total + free + locked;
          }
          return total;
        }, 0);
      }

      // Fetch futures balance if permission enabled
      if (connection.permissions?.futures) {
        try {
          const futuresBalances = await binanceClient.getFuturesBalances();
          
          // Sum up wallet balances (in USDT)
          futuresBalance = futuresBalances.reduce((total: number, asset: any) => {
            const walletBalance = parseFloat(asset.walletBalance) || 0;
            return total + walletBalance;
          }, 0);
        } catch (futuresError: any) {
          console.error('Futures balance fetch error:', futuresError);
          // Don't fail the entire request if futures fails
          // Just keep futuresBalance as 0
        }
      }

      // Update connection with new balances
      await ExchangeConnection.findByIdAndUpdate(params.id, {
        balances: {
          spot: spotBalance,
          futures: futuresBalance,
        },
        lastConnected: new Date(),
      });

      return NextResponse.json({
        balances: {
          spot: spotBalance,
          futures: futuresBalance,
        },
      });
    } catch (error: any) {
      console.error('Binance balance fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch balances from Binance', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
