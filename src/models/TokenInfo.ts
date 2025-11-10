import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenInfo extends Document {
  network: string;
  tokenAddress: string;
  tokenType: 'USDT' | 'NATIVE' | 'CUSTOM';
  symbol: string;
  name: string;
  decimals: number;
  isVerified: boolean;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TokenInfoSchema = new Schema<ITokenInfo>(
  {
    network: {
      type: String,
      required: true,
      enum: ['BSC_MAINNET', 'ETHEREUM_MAINNET'],
    },
    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    tokenType: {
      type: String,
      required: true,
      enum: ['USDT', 'NATIVE', 'CUSTOM'],
    },
    symbol: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    decimals: {
      type: Number,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookups
TokenInfoSchema.index({ network: 1, tokenAddress: 1 }, { unique: true });
TokenInfoSchema.index({ tokenType: 1, network: 1 });

export const TokenInfo = mongoose.models.TokenInfo || mongoose.model<ITokenInfo>('TokenInfo', TokenInfoSchema);
