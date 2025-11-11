/**
 * 🔧 DISABLE ALL TRADING PAIRS EXCEPT BTC
 * 
 * Script untuk disable semua enabled pairs di trading-pairs.ts
 * KECUALI BTCUSDT
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'config', 'trading-pairs.ts');

console.log('📝 Reading trading-pairs.ts...');
let content = fs.readFileSync(configPath, 'utf-8');

// List of pairs to disable (all except BTCUSDT)
const pairsToDisable = [
  'ETHUSDT',
  'BNBUSDT', 
  'SOLUSDT',
  'ADAUSDT',
  'DOTUSDT',
  'AVAXUSDT',
  'ATOMUSDT',
  'TRXUSDT',
  'APTUSDT',
  'MATICUSDT',
  'ARBUSDT',
  'OPUSDT',
  'LINKUSDT',
  'UNIUSDT',
  'FILUSDT',
  'XRPUSDT',
  'LTCUSDT',
  'DOGEUSDT',
];

console.log(`🔒 Disabling ${pairsToDisable.length} trading pairs...`);
console.log('✅ Keeping BTCUSDT enabled\n');

let disabledCount = 0;

pairsToDisable.forEach(symbol => {
  // Find the pair block and replace enabled: true with enabled: false
  const pairRegex = new RegExp(
    `(${symbol}:[\\s\\S]*?settings:\\s*{[\\s\\S]*?)(enabled:\\s*true,)([\\s\\S]*?status:\\s*)'active'`,
    'g'
  );
  
  const beforeReplace = content;
  content = content.replace(pairRegex, (match, before, enabled, after) => {
    disabledCount++;
    return before + 'enabled: false, // ❌ DISABLED - Only BTC active' + after + '\'inactive\'';
  });
  
  if (content !== beforeReplace) {
    console.log(`  ✅ ${symbol} disabled`);
  }
});

console.log(`\n✅ Disabled ${disabledCount} pairs`);

// Write back to file
fs.writeFileSync(configPath, content, 'utf-8');

console.log('💾 File saved successfully!');
console.log('📍 Location:', configPath);
console.log('\n🎯 ONLY BTCUSDT is now enabled for signal generation');
console.log('🔄 Please restart the development server: npm run dev');
