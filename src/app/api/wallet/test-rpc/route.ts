import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(req: NextRequest) {
  try {
    // Test Ethereum RPC
    const ethereumRPC = process.env.ETHEREUM_RPC_URL;
    const bscRPC = process.env.BSC_RPC_URL;
    
    console.log('🔗 Testing RPC connections...');
    console.log('Ethereum RPC:', ethereumRPC);
    console.log('BSC RPC:', bscRPC);

    const results: any = {
      ethereum: { rpc: ethereumRPC, status: 'unknown', error: null },
      bsc: { rpc: bscRPC, status: 'unknown', error: null }
    };

    // Test Ethereum connection
    if (ethereumRPC) {
      try {
        const ethProvider = new ethers.JsonRpcProvider(ethereumRPC);
        const ethBlockNumber = await ethProvider.getBlockNumber();
        results.ethereum.status = 'connected';
        results.ethereum.blockNumber = ethBlockNumber;
        console.log('✅ Ethereum connected, block:', ethBlockNumber);
      } catch (error) {
        results.ethereum.status = 'failed';
        results.ethereum.error = error instanceof Error ? error.message : 'Unknown error';
        console.log('❌ Ethereum connection failed:', error);
      }
    } else {
      results.ethereum.status = 'not_configured';
    }

    // Test BSC connection
    if (bscRPC) {
      try {
        const bscProvider = new ethers.JsonRpcProvider(bscRPC);
        const bscBlockNumber = await bscProvider.getBlockNumber();
        results.bsc.status = 'connected';
        results.bsc.blockNumber = bscBlockNumber;
        console.log('✅ BSC connected, block:', bscBlockNumber);
      } catch (error) {
        results.bsc.status = 'failed';
        results.bsc.error = error instanceof Error ? error.message : 'Unknown error';
        console.log('❌ BSC connection failed:', error);
      }
    } else {
      results.bsc.status = 'not_configured';
    }

    // Test wallet generation
    try {
      const wallet = ethers.Wallet.createRandom();
      results.wallet_generation = {
        status: 'success',
        address: wallet.address,
        privateKey: '0x' + '*'.repeat(64) // Hide actual private key in response
      };
      console.log('✅ Wallet generation test successful');
    } catch (error) {
      results.wallet_generation = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.log('❌ Wallet generation failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'RPC and wallet generation test completed',
      results
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}