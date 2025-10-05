import mongoose, { Schema, Document, Model } from 'mongoose';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption';

export interface IExchangeConnection extends Document {
  userId: mongoose.Types.ObjectId;
  exchange: 'binance' | 'bybit' | 'kucoin' | 'okx';
  apiKey: string;
  apiSecret: string;
  nickname?: string;
  isActive: boolean;
  testnet: boolean;
  permissions?: {
    spot?: boolean;
    futures?: boolean;
  };
  balances?: {
    spot?: number;
    futures?: number;
  };
  lastConnected?: Date;
  createdAt: Date;
  updatedAt: Date;
  getDecryptedApiKey(): string;
  getDecryptedApiSecret(): string;
}

const ExchangeConnectionSchema = new Schema<IExchangeConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'futurepilotcol',
      required: true,
      index: true,
    },
    exchange: {
      type: String,
      enum: ['binance', 'bybit', 'kucoin', 'okx'],
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
      select: false, // Don't return by default for security
    },
    apiSecret: {
      type: String,
      required: true,
      select: false, // Don't return by default for security
    },
    nickname: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    testnet: {
      type: Boolean,
      default: false,
    },
    permissions: {
      spot: {
        type: Boolean,
        default: false,
      },
      futures: {
        type: Boolean,
        default: false,
      },
    },
    balances: {
      spot: {
        type: Number,
        default: 0,
      },
      futures: {
        type: Number,
        default: 0,
      },
    },
    lastConnected: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index untuk user + exchange
ExchangeConnectionSchema.index({ userId: 1, exchange: 1 });

// Pre-save middleware to encrypt API keys
ExchangeConnectionSchema.pre('save', function(next) {
  if (this.isModified('apiKey')) {
    // Only encrypt if it's not already encrypted (check if it looks like plain text)
    // Encrypted strings start with 'U2FsdGVkX1' (base64 of "Salted__")
    if (!this.apiKey.startsWith('U2FsdGVkX1')) {
      this.apiKey = encryptApiKey(this.apiKey);
    }
  }
  
  if (this.isModified('apiSecret')) {
    if (!this.apiSecret.startsWith('U2FsdGVkX1')) {
      this.apiSecret = encryptApiKey(this.apiSecret);
    }
  }
  
  next();
});

// Instance method to get decrypted API key
ExchangeConnectionSchema.methods.getDecryptedApiKey = function(): string {
  return decryptApiKey(this.apiKey);
};

// Instance method to get decrypted API secret
ExchangeConnectionSchema.methods.getDecryptedApiSecret = function(): string {
  return decryptApiKey(this.apiSecret);
};

export const ExchangeConnection: Model<IExchangeConnection> =
  mongoose.models.ExchangeConnection || 
  mongoose.model<IExchangeConnection>('ExchangeConnection', ExchangeConnectionSchema);
