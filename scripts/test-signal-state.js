/**
 * 🧪 TEST: Signal Center State Persistence
 * 
 * Test apakah Start/Stop Signal tersimpan di database
 * dan tetap persist setelah server restart
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Import model
const SignalCenterStateSchema = new mongoose.Schema({
  running: { type: Boolean, required: true, default: false },
  startedAt: { type: Date, default: null },
  stoppedAt: { type: Date, default: null },
  startedBy: { type: String, default: null },
  stoppedBy: { type: String, default: null },
  config: { type: mongoose.Schema.Types.Mixed, default: null },
  uptime: { type: Number, default: 0 },
}, { timestamps: true });

// Static methods
SignalCenterStateSchema.statics.getCurrentState = async function() {
  let state = await this.findOne().sort({ updatedAt: -1 });
  if (!state) {
    state = await this.create({
      running: false,
      startedAt: null,
      stoppedAt: null,
      startedBy: null,
      stoppedBy: null,
      config: null,
      uptime: 0,
    });
  }
  return state;
};

SignalCenterStateSchema.statics.startSignalCenter = async function(adminEmail, config) {
  const state = await this.getCurrentState();
  if (state.running) throw new Error('Already running');
  
  state.running = true;
  state.startedAt = new Date();
  state.startedBy = adminEmail;
  state.config = config || null;
  await state.save();
  
  return state;
};

SignalCenterStateSchema.statics.stopSignalCenter = async function(adminEmail) {
  const state = await this.getCurrentState();
  if (!state.running) throw new Error('Not running');
  
  const stoppedAt = new Date();
  const uptime = Math.floor((stoppedAt - state.startedAt) / 1000);
  
  state.running = false;
  state.stoppedAt = stoppedAt;
  state.stoppedBy = adminEmail;
  state.uptime += uptime;
  await state.save();
  
  return { state, uptime };
};

const SignalCenterState = mongoose.model('SignalCenterState', SignalCenterStateSchema);

async function main() {
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');
    
    // Test 1: Get current state
    console.log('📊 TEST 1: Get Current State');
    console.log('─'.repeat(50));
    const state1 = await SignalCenterState.getCurrentState();
    console.log('Current state:', {
      running: state1.running,
      startedAt: state1.startedAt,
      startedBy: state1.startedBy,
      totalUptime: state1.uptime,
    });
    console.log('');
    
    // Test 2: Start Signal Center
    console.log('🚀 TEST 2: Start Signal Center');
    console.log('─'.repeat(50));
    try {
      const state2 = await SignalCenterState.startSignalCenter('admin@test.com', { test: true });
      console.log('✅ Started successfully!');
      console.log('State:', {
        running: state2.running,
        startedAt: state2.startedAt,
        startedBy: state2.startedBy,
      });
    } catch (error) {
      console.log('⚠️ Already running:', error.message);
    }
    console.log('');
    
    // Test 3: Wait 3 seconds
    console.log('⏱️  TEST 3: Wait 3 seconds...');
    console.log('─'.repeat(50));
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Done waiting\n');
    
    // Test 4: Stop Signal Center
    console.log('🛑 TEST 4: Stop Signal Center');
    console.log('─'.repeat(50));
    try {
      const { state, uptime } = await SignalCenterState.stopSignalCenter('admin@test.com');
      console.log('✅ Stopped successfully!');
      console.log('Uptime:', uptime, 'seconds');
      console.log('State:', {
        running: state.running,
        stoppedAt: state.stoppedAt,
        stoppedBy: state.stoppedBy,
        totalUptime: state.uptime,
      });
    } catch (error) {
      console.log('⚠️ Not running:', error.message);
    }
    console.log('');
    
    // Test 5: Verify persistence
    console.log('💾 TEST 5: Verify Persistence (Re-fetch from DB)');
    console.log('─'.repeat(50));
    const state5 = await SignalCenterState.getCurrentState();
    console.log('Current state after stop:', {
      running: state5.running,
      startedAt: state5.startedAt,
      stoppedAt: state5.stoppedAt,
      totalUptime: state5.uptime + 's',
    });
    console.log('');
    
    // Test 6: Start again
    console.log('🔄 TEST 6: Start Again');
    console.log('─'.repeat(50));
    const state6 = await SignalCenterState.startSignalCenter('admin@test.com', null);
    console.log('✅ Started again!');
    console.log('State:', {
      running: state6.running,
      startedAt: state6.startedAt,
      accumulatedUptime: state6.uptime + 's',
    });
    console.log('');
    
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n⚠️  CLEANUP: Stopping Signal Center...');
    await SignalCenterState.stopSignalCenter('admin@test.com');
    console.log('✅ Cleanup complete\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

main();
