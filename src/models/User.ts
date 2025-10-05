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
  binanceApiKey?: string;
  binanceApiSecret?: string;
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
    binanceApiKey: {
      type: String,
      select: false,
    },
    binanceApiSecret: {
      type: String,
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

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
