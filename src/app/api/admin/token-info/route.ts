import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { TokenInfo } from '@/models/TokenInfo';
import { ethers } from 'ethers';

/**
 * Get Token Info (Decimals, Symbol, Name)
 * Fetches from blockchain and caches in database
 */

const TOKEN_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)"
];

// Network configuration
const networkConfig = {
  BSC_MAINNET: {
    rpc: process.env.BSC_RPC_URL,
    usdtContract: process.env.USDT_BEP20_CONTRACT,
    nativeName: 'Binance Coin',
    nativeSymbol: 'BNB',
  },
  ETHEREUM_MAINNET: {
    rpc: process.env.ETHEREUM_RPC_URL,
    usdtContract: process.env.USDT_ERC20_CONTRACT,
    nativeName: 'Ethereum',
    nativeSymbol: 'ETH',
  },
  BSC_TESTNET: {
    rpc: process.env.TESTNET_BSC_RPC_URL,
    usdtContract: process.env.TESTNET_USDT_BEP20_CONTRACT,
    nativeName: 'Binance Coin',
    nativeSymbol: 'BNB',
  },
  ETHEREUM_TESTNET: {
    rpc: process.env.TESTNET_ETHEREUM_RPC_URL,
    usdtContract: process.env.TESTNET_USDT_ERC20_CONTRACT,
    nativeName: 'Ethereum',
    nativeSymbol: 'ETH',
  },
};

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') as keyof typeof networkConfig;
    const tokenType = searchParams.get('tokenType') as 'USDT' | 'NATIVE' | 'CUSTOM';
    const customTokenAddress = searchParams.get('tokenAddress');

    if (!network || !tokenType) {
      return NextResponse.json(
        { error: 'Network and tokenType are required' },
        { status: 400 }
      );
    }

    const config = networkConfig[network];
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid network' },
        { status: 400 }
      );
    }

    await connectDB();

    let tokenAddress = '';
    let tokenInfo: any = null;

    // Determine token address
    if (tokenType === 'USDT') {
      tokenAddress = config.usdtContract!;
    } else if (tokenType === 'CUSTOM') {
      if (!customTokenAddress) {
        return NextResponse.json(
          { error: 'Custom token address is required' },
          { status: 400 }
        );
      }
      if (!ethers.isAddress(customTokenAddress)) {
        return NextResponse.json(
          { error: 'Invalid token address format' },
          { status: 400 }
        );
      }
      tokenAddress = customTokenAddress.toLowerCase();
    } else if (tokenType === 'NATIVE') {
      // Native token - return static info (no contract, just blockchain convention)
      // Native BNB/ETH are not ERC-20/BEP-20 tokens, so no decimals() function
      // But they follow 18 decimals convention: 1 BNB = 10^18 wei, 1 ETH = 10^18 wei
      return NextResponse.json({
        network,
        tokenAddress: 'native',
        tokenType,
        symbol: config.nativeSymbol,
        name: config.nativeName,
        decimals: 18, // Convention, not from contract
        isVerified: true,
        isCached: false,
      });
    }

    // Check cache first (only for ERC-20/BEP-20 tokens)
    const cached = await TokenInfo.findOne({
      network,
      tokenAddress,
    });

    if (cached) {
      // Update lastChecked if older than 1 day
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (cached.lastChecked < oneDayAgo) {
        cached.lastChecked = new Date();
        await cached.save();
      }

      return NextResponse.json({
        network: cached.network,
        tokenAddress: cached.tokenAddress,
        tokenType: cached.tokenType,
        symbol: cached.symbol,
        name: cached.name,
        decimals: cached.decimals,
        isVerified: cached.isVerified,
        isCached: true,
        lastChecked: cached.lastChecked,
      });
    }

    // Fetch from blockchain
    console.log('🔍 Fetching token info from blockchain...');
    console.log('Network:', network);
    console.log('Token Address:', tokenAddress);

    const provider = new ethers.JsonRpcProvider(config.rpc);
    const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

    try {
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals(),
      ]);

      console.log('✅ Token info fetched:', { symbol, name, decimals });

      tokenInfo = {
        network,
        tokenAddress,
        tokenType,
        symbol: String(symbol),
        name: String(name),
        decimals: Number(decimals),
        isVerified: true,
        lastChecked: new Date(),
      };

      // Save to database
      await TokenInfo.create(tokenInfo);
      console.log('💾 Token info saved to database');

      return NextResponse.json({
        ...tokenInfo,
        isCached: false,
      });

    } catch (error) {
      console.error('❌ Failed to fetch token info:', error);
      return NextResponse.json(
        { 
          error: 'Invalid token contract. Cannot read token information.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Token info fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch token info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear cache
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network');
    const tokenAddress = searchParams.get('tokenAddress');

    await connectDB();

    if (network && tokenAddress) {
      // Delete specific token
      await TokenInfo.deleteOne({ network, tokenAddress: tokenAddress.toLowerCase() });
      return NextResponse.json({
        success: true,
        message: 'Token cache cleared',
      });
    } else {
      // Clear all cache
      const result = await TokenInfo.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'All token cache cleared',
        deletedCount: result.deletedCount,
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
