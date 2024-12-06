import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    index: true
  },
  chainId: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  assets: [{
    token: String,
    symbol: String,
    amount: String,
    decimals: Number,
    value: Number,
    chainId: Number
  }],
  totalValue: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// 创建复合索引
AssetSchema.index({ address: 1, timestamp: -1 });

export const Asset = mongoose.model('Asset', AssetSchema);
