# Web3 资产管理应用实现细节

## 1. 项目结构

```
project-root/
├── apps/
│   ├── web/                 # SvelteKit 前端应用
│   │   ├── src/
│   │   │   ├── lib/        # 共享组件和工具
│   │   │   ├── routes/     # 页面路由
│   │   │   └── stores/     # Svelte stores
│   │   └── static/         # 静态资源
│   └── api/                # Hono 后端服务
│       ├── src/
│       │   ├── routes/     # API 路由
│       │   ├── services/   # 业务逻辑
│       │   └── utils/      # 工具函数
│       └── middleware/     # 中间件
└── packages/               # 共享包
    ├── types/             # 类型定义
    └── config/           # 共享配置

```

## 2. 前端实现 (SvelteKit)

### 2.1 路由结构
```typescript
// routes/
├── +layout.svelte         # 主布局
├── +page.svelte          # 首页
├── portfolio/
│   ├── +page.svelte      # 资产组合页面
│   └── +page.ts          # 页面加载数据
└── analytics/
    ├── +page.svelte      # 分析页面
    └── +page.ts          # 分析数据加载
```

### 2.2 状态管理
```typescript
// stores/wallet.ts
import { writable } from 'svelte/store';

interface WalletState {
  address: string;
  chainId: number;
  balance: string;
  assets: Asset[];
}

export const wallet = writable<WalletState>({
  address: '',
  chainId: 1,
  balance: '0',
  assets: []
});

// 钱包连接动作
export const connectWallet = async () => {
  // 实现钱包连接逻辑
};

// 资产更新动作
export const updateAssets = async () => {
  // 实现资产更新逻辑
};
```

### 2.3 组件示例
```svelte
<!-- components/AssetCard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Asset } from '$lib/types';
  
  export let asset: Asset;
  
  let usdValue = 0;
  
  onMount(async () => {
    // 获取资产USD价值
  });
</script>

<div class="card">
  <h3>{asset.symbol}</h3>
  <p>{asset.balance}</p>
  <p>${usdValue}</p>
</div>
```

### 2.4 API 调用
```typescript
// lib/api.ts
import { PUBLIC_API_URL } from '$env/static/public';

export const fetchAssets = async (address: string) => {
  const response = await fetch(`${PUBLIC_API_URL}/assets/${address}`);
  return response.json();
};

export const fetchHistory = async (address: string, days: number) => {
  const response = await fetch(`${PUBLIC_API_URL}/history/${address}?days=${days}`);
  return response.json();
};
```

## 3. 后端实现 (Hono)

### 3.1 API 路由
```typescript
// src/routes/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();

// 中间件
app.use('/*', cors());
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET }));

// 资产路由
app.get('/api/assets/:address', async (c) => {
  const address = c.req.param('address');
  // 实现资产获取逻辑
  return c.json({ /* 资产数据 */ });
});

// 历史数据路由
app.get('/api/history/:address', async (c) => {
  const address = c.req.param('address');
  const days = c.req.query('days');
  // 实现历史数据获取逻辑
  return c.json({ /* 历史数据 */ });
});

export default app;
```

### 3.2 区块链服务集成
```typescript
// src/services/blockchain.ts
import { Moralis } from 'moralis';
import { ethers } from 'ethers';

export class BlockchainService {
  private moralis: Moralis;
  
  constructor() {
    this.moralis = new Moralis();
  }
  
  async getAddressAssets(address: string) {
    // 实现多链资产获取逻辑
  }
  
  async getTokenPrice(address: string, chainId: number) {
    // 实现代币价格获取逻辑
  }
}
```

### 3.3 数据库模型
```typescript
// src/models/asset.ts
import { Schema, model } from 'mongoose';

const AssetSchema = new Schema({
  address: String,
  chainId: Number,
  timestamp: Date,
  assets: [{
    token: String,
    amount: String,
    value: Number
  }],
  totalValue: Number
}, { timestamps: true });

export const Asset = model('Asset', AssetSchema);
```

### 3.4 缓存实现
```typescript
// src/services/cache.ts
import { Redis } from 'ioredis';

export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async cacheAssets(address: string, data: any) {
    const key = `assets:${address}`;
    await this.redis.setex(key, 300, JSON.stringify(data)); // 5分钟缓存
  }
  
  async getCachedAssets(address: string) {
    const key = `assets:${address}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
```

## 4. 部署配置

### 4.1 Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

CMD ["pnpm", "start"]
```

### 4.2 环境变量
```env
# .env
DATABASE_URL=mongodb://localhost:27017/web3-assets
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
MORALIS_API_KEY=your-moralis-key
COVALENT_API_KEY=your-covalent-key
```

## 5. 性能优化

### 5.1 前端优化
- 使用 SvelteKit 的 SSR 能力
- 实现资产数据的增量更新
- 使用 Web Workers 处理大量数据计算
- 实现虚拟列表展示大量资产

### 5.2 后端优化
- 实现多级缓存策略
- 使用数据库索引优化查询
- 实现任务队列处理大量数据更新
- 使用 WebSocket 推送实时数据更新

## 6. 监控和日志

### 6.1 性能监控
```typescript
// src/middleware/monitor.ts
import { Hono } from 'hono';
import { timing } from 'hono/timing';

const app = new Hono();

app.use('*', timing());
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  
  // 记录API响应时间
  console.log(`${c.req.path} - ${end - start}ms`);
});
```

### 6.2 错误处理
```typescript
// src/middleware/error.ts
import { Hono } from 'hono';

const app = new Hono();

app.onError((err, c) => {
  console.error(err);
  return c.json({
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  }, 500);
});
```
