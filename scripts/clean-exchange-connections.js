/**
 * Script to clean all exchange connections from database
 * Run this if you have decryption errors or need to reset all connections
 * 
 * Usage: MONGODB_URI="your_uri" node scripts/clean-exchange-connections.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+?)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const MONGODB_URI = envVars.MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanExchangeConnections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check if collection exists
    const collections = await db.listCollections({ name: 'exchangeconnections' }).toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️  No ExchangeConnection collection found');
    } else {
      // Delete all documents
      const result = await db.collection('exchangeconnections').deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} exchange connection(s)`);
    }

    console.log('✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error cleaning exchange connections:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

cleanExchangeConnections();
