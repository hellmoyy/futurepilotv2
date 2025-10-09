import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// USDT Contract ABIs (minimal - just for transfer event)
const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export async function POST(req: NextRequest) {
  try {
    const { address, network = 'ethereum' } = await req.json();
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Address is required'
      }, { status: 400 });
    }

    console.log(`🔍 Testing blockchain monitoring for ${address} on ${network}`);

    // Get RPC and contract address
    const rpcUrl = network === 'ethereum' 
      ? process.env.ETHEREUM_RPC_URL 
      : process.env.BSC_RPC_URL;
    
    const contractAddress = network === 'ethereum'
      ? process.env.USDT_ERC20_CONTRACT
      : process.env.USDT_BEP20_CONTRACT;

    if (!rpcUrl || !contractAddress) {
      return NextResponse.json({
        success: false,
        error: 'RPC URL or contract address not configured'
      }, { status: 500 });
    }

    // Setup provider and contract
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, USDT_ABI, provider);

    // Test results object
    const results: any = {
      network,
      address,
      rpcUrl,
      contractAddress,
      providerStatus: 'unknown',
      balance: '0',
      blockNumber: 0,
      decimals: 0
    };

    // Test provider connection
    try {
      const blockNumber = await provider.getBlockNumber();
      results.blockNumber = blockNumber;
      results.providerStatus = 'connected';
      console.log(`✅ Connected to ${network}, block: ${blockNumber}`);
    } catch (error) {
      results.providerStatus = 'failed';
      results.error = error instanceof Error ? error.message : 'Provider connection failed';
      console.error('❌ Provider connection failed:', error);
    }

    // Test USDT balance query
    if (results.providerStatus === 'connected') {
      try {
        const balance = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        results.balance = ethers.formatUnits(balance, decimals);
        results.decimals = Number(decimals); // Convert BigInt to Number
        console.log(`💰 USDT Balance: ${results.balance}`);
      } catch (error) {
        results.balanceError = error instanceof Error ? error.message : 'Balance query failed';
        console.error('❌ Balance query failed:', error);
      }
    }

    // Test recent transfer events (last 1000 blocks)
    if (results.providerStatus === 'connected') {
      try {
        const currentBlock = results.blockNumber;
        const fromBlock = Math.max(0, currentBlock - 1000);
        
        console.log(`🔎 Checking transfer events from block ${fromBlock} to ${currentBlock}`);
        
        // Get incoming transfers
        const incomingTransfers = await contract.queryFilter(
          contract.filters.Transfer(null, address),
          fromBlock,
          currentBlock
        );

        // Get outgoing transfers  
        const outgoingTransfers = await contract.queryFilter(
          contract.filters.Transfer(address, null),
          fromBlock,
          currentBlock
        );

        results.recentTransfers = {
          incoming: incomingTransfers.length,
          outgoing: outgoingTransfers.length,
          total: incomingTransfers.length + outgoingTransfers.length,
          blocksChecked: currentBlock - fromBlock,
          sampleEvents: [
            ...incomingTransfers.slice(-2).map(event => {
              const eventLog = event as ethers.EventLog;
              return {
                type: 'incoming',
                from: eventLog.args?.[0] || 'unknown',
                to: eventLog.args?.[1] || 'unknown', 
                amount: eventLog.args?.[2] ? ethers.formatUnits(eventLog.args[2], results.decimals || 6) : '0',
                blockNumber: event.blockNumber,
                txHash: event.transactionHash
              };
            }),
            ...outgoingTransfers.slice(-2).map(event => {
              const eventLog = event as ethers.EventLog;
              return {
                type: 'outgoing',
                from: eventLog.args?.[0] || 'unknown',
                to: eventLog.args?.[1] || 'unknown',
                amount: eventLog.args?.[2] ? ethers.formatUnits(eventLog.args[2], results.decimals || 6) : '0', 
                blockNumber: event.blockNumber,
                txHash: event.transactionHash
              };
            })
          ].slice(0, 4) // Show max 4 recent events
        };

        console.log(`📊 Found ${results.recentTransfers.total} recent transfers`);
        
      } catch (error) {
        results.transferError = error instanceof Error ? error.message : 'Transfer query failed';
        console.error('❌ Transfer query failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Blockchain monitoring test completed',
      results
    });

  } catch (error) {
    console.error('❌ Monitoring test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Monitoring test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}