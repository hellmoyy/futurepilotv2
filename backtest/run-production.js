#!/usr/bin/env node

/**
 * 🎯 Production Backtest Runner
 * 
 * Uses ACTUAL production code with TypeScript support
 * Requires: ts-node for TypeScript execution
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n🎯 FuturePilot v2 - Production Strategy Backtest');
console.log('=' .repeat(70));

// Check if ts-node is available
try {
  execSync('npx ts-node --version', { stdio: 'ignore' });
  console.log('✅ ts-node found\n');
} catch (error) {
  console.log('❌ ts-node not found, installing...\n');
  try {
    execSync('npm install -D ts-node @types/node', { stdio: 'inherit' });
    console.log('\n✅ ts-node installed\n');
  } catch (installError) {
    console.error('❌ Failed to install ts-node');
    console.log('\n💡 Please install manually:');
    console.log('   npm install -D ts-node @types/node\n');
    process.exit(1);
  }
}

// Run the TypeScript backtest
const backtestScript = path.join(__dirname, 'run-production-backtest.ts');

try {
  console.log('🚀 Running production backtest with TypeScript...\n');
  
  // Use ts-node with CommonJS module resolution
  execSync(`npx ts-node -O '{"module":"commonjs"}' ${backtestScript} ${process.argv.slice(2).join(' ')}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
} catch (error) {
  console.error('\n❌ Backtest failed:', error.message);
  process.exit(1);
}
