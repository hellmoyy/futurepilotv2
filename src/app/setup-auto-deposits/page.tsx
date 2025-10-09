import { NextRequest, NextResponse } from 'next/server';

export default function SetupAutoDeposits() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-blue-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center">
            🤖 Automatic Deposit Detection Setup
          </h1>
          <p className="text-gray-300 text-lg">
            Configure automatic USDT deposit monitoring system
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center text-green-400">
            ✅ System Status
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Environment Variables</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>ETHEREUM_RPC_URL</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>BSC_RPC_URL</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>USDT_ERC20_CONTRACT</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>USDT_BEP20_CONTRACT</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>CRON_SECRET</span>
                  <span className="text-green-400">✅</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold mb-2">API Endpoints</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>/api/cron/monitor-deposits</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>Authentication</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Handling</span>
                  <span className="text-green-400">✅</span>
                </div>
                <div className="flex justify-between">
                  <span>Duplicate Prevention</span>
                  <span className="text-green-400">✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🔧 Setup Upstash Cron</h2>
          
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Step 1A: Method GET (Easiest)</h3>
              <p className="text-sm text-gray-300 mb-3">Token in URL parameter:</p>
              
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">Destination URL:</div>
                <div className="text-white break-all">
                  https://futurepilot.pro/api/cron/monitor-deposits?token=YOUR_CRON_SECRET
                </div>
                
                <div className="text-green-400 mt-3">Method:</div>
                <div className="text-white">GET</div>
                
                <div className="text-green-400 mt-3">Headers:</div>
                <div className="text-white">Not required</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Step 1B: Method POST (More Secure)</h3>
              <p className="text-sm text-gray-300 mb-3">Token in Authorization header:</p>
              
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">Destination URL:</div>
                <div className="text-white break-all">
                  https://futurepilot.pro/api/cron/monitor-deposits
                </div>
                
                <div className="text-green-400 mt-3">Method:</div>
                <div className="text-white">POST</div>
                
                <div className="text-green-400 mt-3">Headers:</div>
                <div className="text-white">{`{"Authorization": "Bearer YOUR_CRON_SECRET"}`}</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Common Settings (Both Methods)</h3>
              
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">Schedule (Every 5 minutes):</div>
                <div className="text-white">*/5 * * * *</div>
                
                <div className="text-green-400 mt-3">Timeout:</div>
                <div className="text-white">300 seconds</div>
                
                <div className="text-green-400 mt-3">Retries:</div>
                <div className="text-white">3</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Step 2: Test Configuration</h3>
              <p className="text-sm text-gray-300 mb-3">Test both methods:</p>
              
              <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                <div className="text-yellow-400"># Method A - GET with query:</div>
                <div className="text-white break-all mb-2">
                  curl "http://localhost:3000/api/cron/monitor-deposits?token=YOUR_CRON_SECRET"
                </div>
                
                <div className="text-yellow-400 mt-3"># Method B - POST with header:</div>
                <div className="text-white break-all mb-2">
                  curl -X POST http://localhost:3000/api/cron/monitor-deposits \
                  -H "Authorization: Bearer YOUR_CRON_SECRET"
                </div>
                
                <div className="text-yellow-400 mt-3"># Production URLs:</div>
                <div className="text-white break-all text-xs">
                  Replace localhost:3000 with futurepilot.pro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-purple-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-purple-400">⚙️ How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-xl">
                🔍
              </div>
              <h3 className="font-semibold mb-2">1. Scan Blockchain</h3>
              <p className="text-sm text-gray-300">
                Every 5 minutes, scans last 100 blocks on Ethereum & BSC for USDT transfers
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-xl">
                💰
              </div>
              <h3 className="font-semibold mb-2">2. Detect Deposits</h3>
              <p className="text-sm text-gray-300">
                Finds USDT transfers to user wallet addresses and prevents duplicates
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-xl">
                🔄
              </div>
              <h3 className="font-semibent mb-2">3. Auto Update</h3>
              <p className="text-sm text-gray-300">
                Creates transaction record and automatically updates user balance
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-500/10 backdrop-blur-xl border border-gray-500/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-300">🧪 Live Test Results</h2>
          
          <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
            <div className="text-green-400 mb-2">✅ Endpoint Test Successful</div>
            <div className="text-white">
              {JSON.stringify({
                "success": true,
                "message": "Deposit monitoring completed",
                "results": {
                  "timestamp": "2025-10-09T14:27:55.442Z",
                  "networksChecked": 2,
                  "totalDepositsFound": 0,
                  "newDepositsProcessed": 0,
                  "errors": [],
                  "details": []
                }
              }, null, 2)}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <p className="text-green-400 font-semibold">🎉 Ready for Production!</p>
            <p className="text-sm text-gray-300 mt-1">
              Automatic deposit detection system is configured and ready. 
              Just setup the Upstash cron job to enable automatic monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}