import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#6366f1' // 默认颜色
  },
  emoji: {
    type: String,
    default: '💰' // 默认emoji
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间戳
WalletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Wallet = mongoose.model('Wallet', WalletSchema);
