/**
 * 📡 SIGNAL CENTER STATE MODEL
 * 
 * MongoDB model untuk persist Signal Center on/off state
 * Menggantikan in-memory variable yang hilang setelah restart
 */

import mongoose from 'mongoose';

export interface ISignalCenterState extends mongoose.Document {
  running: boolean;
  startedAt: Date | null;
  stoppedAt: Date | null;
  startedBy: string | null; // Admin email
  stoppedBy: string | null; // Admin email
  config: any;
  uptime: number; // Total uptime in seconds
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
interface ISignalCenterStateModel extends mongoose.Model<ISignalCenterState> {
  getCurrentState(): Promise<ISignalCenterState>;
  startSignalCenter(adminEmail: string, config?: any): Promise<ISignalCenterState>;
  stopSignalCenter(adminEmail: string): Promise<{ state: ISignalCenterState; uptime: number }>;
}

const SignalCenterStateSchema = new mongoose.Schema<ISignalCenterState>(
  {
    running: {
      type: Boolean,
      required: true,
      default: false,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    stoppedAt: {
      type: Date,
      default: null,
    },
    startedBy: {
      type: String,
      default: null,
    },
    stoppedBy: {
      type: String,
      default: null,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    uptime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Static method: Get current state (or create default)
SignalCenterStateSchema.statics.getCurrentState = async function (): Promise<ISignalCenterState> {
  let state = await this.findOne().sort({ updatedAt: -1 });
  
  if (!state) {
    // Create default state if not exists
    state = await this.create({
      running: false,
      startedAt: null,
      stoppedAt: null,
      startedBy: null,
      stoppedBy: null,
      config: null,
      uptime: 0,
    });
    console.log('✅ Created default Signal Center state');
  }
  
  return state;
};

// Static method: Start Signal Center
SignalCenterStateSchema.statics.startSignalCenter = async function (
  adminEmail: string,
  config?: any
): Promise<ISignalCenterState> {
  const Model = this as ISignalCenterStateModel;
  const state = await Model.getCurrentState();
  
  if (state.running) {
    throw new Error('Signal Center already running');
  }
  
  state.running = true;
  state.startedAt = new Date();
  state.startedBy = adminEmail;
  state.config = config || null;
  
  await state.save();
  
  console.log(`🚀 Signal Center STARTED by ${adminEmail}`);
  
  return state;
};

// Static method: Stop Signal Center
SignalCenterStateSchema.statics.stopSignalCenter = async function (
  adminEmail: string
): Promise<{ state: ISignalCenterState; uptime: number }> {
  const Model = this as ISignalCenterStateModel;
  const state = await Model.getCurrentState();
  
  if (!state.running) {
    throw new Error('Signal Center not running');
  }
  
  const stoppedAt = new Date();
  const uptime = state.startedAt 
    ? Math.floor((stoppedAt.getTime() - state.startedAt.getTime()) / 1000)
    : 0;
  
  state.running = false;
  state.stoppedAt = stoppedAt;
  state.stoppedBy = adminEmail;
  state.uptime += uptime; // Accumulate total uptime
  
  await state.save();
  
  console.log(`🛑 Signal Center STOPPED by ${adminEmail} (uptime: ${uptime}s)`);
  
  return { state, uptime };
};

// Prevent multiple model compilation
const SignalCenterState = 
  (mongoose.models.SignalCenterState as ISignalCenterStateModel) || 
  mongoose.model<ISignalCenterState, ISignalCenterStateModel>('SignalCenterState', SignalCenterStateSchema);

export default SignalCenterState;
