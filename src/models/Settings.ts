import mongoose from 'mongoose';

export interface ISettings extends mongoose.Document {
  // Referral Commission Settings
  referralCommission: {
    bronze: {
      level1: number;
      level2: number;
      level3: number;
    };
    silver: {
      level1: number;
      level2: number;
      level3: number;
    };
    gold: {
      level1: number;
      level2: number;
      level3: number;
    };
    platinum: {
      level1: number;
      level2: number;
      level3: number;
    };
  };
  minimumWithdrawal: number;
  
  // Trading Commission Settings
  tradingCommission: number;
  
  // General Settings
  platformName: string;
  platformUrl: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  
  // Security Settings
  twoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  
  // Email Settings
  emailFrom: string;
  smtpHost: string;
  emailNotifications: boolean;
  
  // Metadata
  updatedAt: Date;
  updatedBy?: string;
  createdAt: Date;
}

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    referralCommission: {
      bronze: {
        level1: { type: Number, default: 5, min: 0, max: 100 },
        level2: { type: Number, default: 2, min: 0, max: 100 },
        level3: { type: Number, default: 1, min: 0, max: 100 },
      },
      silver: {
        level1: { type: Number, default: 10, min: 0, max: 100 },
        level2: { type: Number, default: 5, min: 0, max: 100 },
        level3: { type: Number, default: 2, min: 0, max: 100 },
      },
      gold: {
        level1: { type: Number, default: 15, min: 0, max: 100 },
        level2: { type: Number, default: 8, min: 0, max: 100 },
        level3: { type: Number, default: 4, min: 0, max: 100 },
      },
      platinum: {
        level1: { type: Number, default: 20, min: 0, max: 100 },
        level2: { type: Number, default: 10, min: 0, max: 100 },
        level3: { type: Number, default: 5, min: 0, max: 100 },
      },
    },
    minimumWithdrawal: {
      type: Number,
      default: 10,
      min: 0,
    },
    tradingCommission: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    platformName: {
      type: String,
      default: 'FuturePilot',
    },
    platformUrl: {
      type: String,
      default: 'https://futurepilot.pro',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    twoFactorRequired: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 15,
      max: 1440,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10,
    },
    emailFrom: {
      type: String,
      default: 'noreply@futurepilot.pro',
    },
    smtpHost: {
      type: String,
      default: 'smtp.example.com',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
