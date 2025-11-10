import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const USDT_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get network mode
    const networkMode = process.env.NETWORK_MODE || 'mainnet'; // Default to mainnet for production
    
    // Get master wallet address
    const masterWalletAddress = process.env.MASTER_WALLET_ADDRESS;
    if (!masterWalletAddress) {
      return NextResponse.json(
        { error: 'Master wallet not configured' },
        { status: 500 }
      );
    }

    // Network configurations
    const networks = networkMode === 'mainnet' 
      ? [
          {
            name: 'BSC_MAINNET',
            label: 'BSC Mainnet',
            rpc: process.env.BSC_RPC_URL || '',
            usdt: process.env.USDT_BEP20_CONTRACT || '',
            nativeSymbol: 'BNB',
            explorer: 'https://bscscan.com',
          },
          {
            name: 'ETHEREUM_MAINNET',
            label: 'Ethereum Mainnet',
            rpc: process.env.ETHEREUM_RPC_URL || '',
            usdt: process.env.USDT_ERC20_CONTRACT || '',
            nativeSymbol: 'ETH',
            explorer: 'https://etherscan.io',
          }
        ]
      : [
          {
            name: 'BSC_TESTNET',
            label: 'BSC Testnet',
            rpc: process.env.TESTNET_BSC_RPC_URL || '',
            usdt: process.env.TESTNET_USDT_BEP20_CONTRACT || '',
            nativeSymbol: 'BNB',
            explorer: 'https://testnet.bscscan.com',
          },
          {
            name: 'ETHEREUM_TESTNET',
            label: 'Ethereum Sepolia',
            rpc: process.env.TESTNET_ETHEREUM_RPC_URL || '',
            usdt: process.env.TESTNET_USDT_ERC20_CONTRACT || '',
            nativeSymbol: 'ETH',
            explorer: 'https://sepolia.etherscan.io',
          }
        ];

    // Fetch balances for all networks
    const balances = await Promise.all(
      networks.map(async (net) => {
        try {
          const provider = new ethers.JsonRpcProvider(net.rpc);
          
          // Get native balance (BNB/ETH)
          const nativeBalance = await provider.getBalance(masterWalletAddress);
          const nativeFormatted = parseFloat(ethers.formatEther(nativeBalance)).toFixed(6);

          // Get USDT balance
          const usdtContract = new ethers.Contract(net.usdt, USDT_ABI, provider);
          const usdtBalance = await usdtContract.balanceOf(masterWalletAddress);
          
          // Get decimals from env based on network
          let usdtDecimals = 6; // Default
          if (net.name === 'BSC_TESTNET') {
            usdtDecimals = parseInt(process.env.TESTNET_USDT_BEP20_DECIMAL || '18');
          } else if (net.name === 'ETHEREUM_TESTNET') {
            usdtDecimals = parseInt(process.env.TESTNET_USDT_ERC20_DECIMAL || '18');
          } else if (net.name === 'BSC_MAINNET') {
            usdtDecimals = parseInt(process.env.USDT_BEP20_DECIMAL || '18');
          } else if (net.name === 'ETHEREUM_MAINNET') {
            usdtDecimals = parseInt(process.env.USDT_ERC20_DECIMAL || '6');
          }
          
          const usdtFormatted = parseFloat(ethers.formatUnits(usdtBalance, usdtDecimals)).toFixed(2);

          return {
            network: net.name,
            label: net.label,
            nativeSymbol: net.nativeSymbol,
            nativeBalance: nativeFormatted,
            usdtBalance: usdtFormatted,
            explorer: net.explorer,
          };
        } catch (error) {
          console.error(`Failed to fetch balance for ${net.name}:`, error);
          return {
            network: net.name,
            label: net.label,
            nativeSymbol: net.nativeSymbol,
            nativeBalance: '0.000000',
            usdtBalance: '0.00',
            explorer: net.explorer,
            error: true,
          };
        }
      })
    );

    // Calculate totals
    const totalBNB = balances
      .filter(b => b.nativeSymbol === 'BNB')
      .reduce((sum, b) => sum + parseFloat(b.nativeBalance), 0);
    
    const totalETH = balances
      .filter(b => b.nativeSymbol === 'ETH')
      .reduce((sum, b) => sum + parseFloat(b.nativeBalance), 0);
    
    const totalUSDT = balances
      .reduce((sum, b) => sum + parseFloat(b.usdtBalance), 0);

    return NextResponse.json({
      success: true,
      address: masterWalletAddress,
      networkMode,
      balances,
      totals: {
        bnb: totalBNB.toFixed(6),
        eth: totalETH.toFixed(6),
        usdt: totalUSDT.toFixed(2),
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch master wallet balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
