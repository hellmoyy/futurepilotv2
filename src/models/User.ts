import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// User Interface
export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  provider?: string;
  image?: string;
  emailVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  binanceApiKey?: string;
  binanceApiSecret?: string;
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierSetManually?: boolean; // True if admin manually set the tier (prevents auto-upgrade)
  totalEarnings?: number;
  totalPersonalDeposit?: number; // Total personal gas fee deposits for tier calculation
  gasFeeBalance?: number;
  walletData?: {
    erc20Address: string;
    bep20Address: string;
    encryptedPrivateKey: string;
    mainnetBalance: number; // Mainnet balance only
    createdAt: Date;
  };
  // Withdrawal wallet addresses
  withdrawalWallets?: {
    erc20?: string;
    bep20?: string;
    verified?: boolean;
    addedAt?: Date;
  };
  // Bot settings for Signal Center
  botSettings?: {
    enabled: boolean; // Auto-execute signals
    symbols: string[]; // Symbol filter (e.g., ['BTCUSDT', 'ETHUSDT'])
    minStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG'; // Minimum signal strength
    riskPerTrade: number; // 1-5% (default 2%)
    maxPositions: number; // 1-5 concurrent positions (default 3)
    leverage: number; // 1-20x (default 10x)
    aiDecisionEnabled?: boolean; // Enable AI evaluation (default: true)
    aiDecisionFallbackEnabled?: boolean; // Execute on AI error (default: true)
    createdAt?: Date;
    updatedAt?: Date;
  };
  // 2FA fields
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // Ban status
  isBanned?: boolean;
  bannedAt?: Date;
  banReason?: string;
  // Account lockout fields (for failed login attempts)
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  lastFailedLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    password: {
      type: String,
      select: false,
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty for OAuth users
          // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
        },
        message: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number'
      }
    },
    provider: {
      type: String,
      default: 'credentials',
    },
    image: String,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },
    binanceApiKey: {
      type: String,
      select: false,
    },
    binanceApiSecret: {
      type: String,
      select: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'futurepilotcol',
    },
    membershipLevel: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    tierSetManually: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalPersonalDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    gasFeeBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    walletData: {
      erc20Address: String,
      bep20Address: String,
      encryptedPrivateKey: {
        type: String,
        select: false,
      },
      mainnetBalance: {
        type: Number,
        default: 0,
        min: 0,
      },
      createdAt: Date,
    },
    // Withdrawal wallet addresses
    withdrawalWallets: {
      erc20: {
        type: String,
        validate: {
          validator: function(v: string) {
            if (!v) return true;
            return /^0x[a-fA-F0-9]{40}$/.test(v);
          },
          message: 'Invalid ERC20 wallet address'
        }
      },
      bep20: {
        type: String,
        validate: {
          validator: function(v: string) {
            if (!v) return true;
            return /^0x[a-fA-F0-9]{40}$/.test(v);
          },
          message: 'Invalid BEP20 wallet address'
        }
      },
      verified: {
        type: Boolean,
        default: false,
      },
      addedAt: Date,
    },
    // Bot settings for Signal Center
    botSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      symbols: {
        type: [String],
        default: ['BTCUSDT'],
      },
      minStrength: {
        type: String,
        enum: ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'],
        default: 'STRONG',
      },
      riskPerTrade: {
        type: Number,
        default: 2,
        min: 1,
        max: 5,
      },
      maxPositions: {
        type: Number,
        default: 3,
        min: 1,
        max: 5,
      },
      leverage: {
        type: Number,
        default: 10,
        min: 1,
        max: 20,
      },
      aiDecisionEnabled: {
        type: Boolean,
        default: true, // AI evaluation enabled by default
      },
      aiDecisionFallbackEnabled: {
        type: Boolean,
        default: true, // Execute on AI error by default
      },
      createdAt: Date,
      updatedAt: Date,
    },
    // 2FA fields
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
      default: [],
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Ban status
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: Date,
    banReason: String,
    // Account lockout fields (for failed login attempts)
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    accountLockedUntil: {
      type: Date,
      select: false,
    },
    lastFailedLogin: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Generate referral code before saving
UserSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referralCode = `FP${randomString}`;
  }
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> =
  mongoose.models.futurepilotcols || mongoose.model<IUser>('futurepilotcols', UserSchema, 'futurepilotcols');

// Also register with 'User' name for populate compatibility
if (!mongoose.models.User) {
  mongoose.model<IUser>('User', UserSchema, 'futurepilotcols');
}

export default User;
