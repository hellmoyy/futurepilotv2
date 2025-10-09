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
  totalEarnings?: number;
  gasFeeBalance?: number;
  walletData?: {
    erc20Address: string;
    bep20Address: string;
    encryptedPrivateKey: string;
    balance: number;
    createdAt: Date;
  };
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
      minlength: 6,
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
    totalEarnings: {
      type: Number,
      default: 0,
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
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      createdAt: Date,
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
  mongoose.models.futurepilotcol || mongoose.model<IUser>('futurepilotcol', UserSchema);
