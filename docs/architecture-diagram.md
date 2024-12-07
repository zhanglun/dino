# Web3 资产管理平台技术架构图

```mermaid
graph TB
    subgraph "前端应用 (SvelteKit)"
        UI[用户界面]
        Store[Svelte Store]
        Components[组件]
        Web3Client[Web3 Client]
        
        UI --> Store
        UI --> Components
        Components --> Store
        Components --> Web3Client
    end
    
    subgraph "后端服务 (Hono)"
        API[API 服务]
        Middleware[中间件层]
        Services[业务服务层]
        
        API --> Middleware
        Middleware --> Services
    end
    
    subgraph "数据层"
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis)]
        
        Services --> PostgreSQL
        Services --> Redis
    end
    
    subgraph "区块链服务"
        RPC[公共 RPC 节点]
        Scanner[区块浏览器 API]
        
        Web3Client --> RPC
        Services --> RPC
        Services --> Scanner
    end
    
    subgraph "外部服务"
        PriceAPI[价格 API]
        TokenAPI[代币元数据 API]
        
        Services --> PriceAPI
        Services --> TokenAPI
    end
    
    Components --> API
    
    classDef frontend fill:#d4e6f1,stroke:#2874a6,stroke-width:2px
    classDef backend fill:#d5f5e3,stroke:#196f3d,stroke-width:2px
    classDef database fill:#fadbd8,stroke:#943126,stroke-width:2px
    classDef blockchain fill:#fef9e7,stroke:#b7950b,stroke-width:2px
    classDef external fill:#f5eef8,stroke:#6c3483,stroke-width:2px
    
    class UI,Store,Components,Web3Client frontend
    class API,Middleware,Services backend
    class PostgreSQL,Redis database
    class RPC,Scanner blockchain
    class PriceAPI,TokenAPI external
```

## 架构说明

### 1. 前端层
- **用户界面 (UI)**
  - 使用 TailwindCSS + DaisyUI 构建
  - 响应式设计
  - 主题支持

- **状态管理 (Store)**
  - Svelte Store 管理应用状态
  - 钱包状态
  - 资产数据
  - 用户配置

- **组件系统 (Components)**
  - 钱包管理组件
  - 资产展示组件
  - 图表组件 (ECharts)

- **Web3 客户端**
  - ethers.js 集成
  - 多链支持
  - 钱包连接

### 2. 后端层
- **API 服务**
  - RESTful API
  - WebSocket 支持
  - 速率限制

- **中间件层**
  - 认证/授权
  - 日志记录
  - 错误处理
  - CORS

- **业务服务层**
  - 钱包管理
  - 资产追踪
  - 数据分析

### 3. 数据层
- **PostgreSQL**
  - 关系型数据存储
  - 事务支持
  - 复杂查询
  - 数据完整性

- **Redis**
  - 缓存层
  - 会话存储
  - 任务队列
  - 实时数据

### 4. 区块链服务
- **公共 RPC 节点**
  - 以太坊
  - BSC
  - Polygon

- **区块浏览器 API**
  - Etherscan
  - BscScan
  - PolygonScan

### 5. 外部服务
- **价格 API**
  - CoinGecko
  - 实时价格更新
  - 历史价格数据

- **代币元数据 API**
  - 代币信息
  - 合约 ABI
  - 代币图标

## 数据流

1. **用户操作流**
   ```
   用户界面 -> 组件 -> Store -> API -> 服务层 -> 数据库
   ```

2. **资产更新流**
   ```
   区块链服务 -> 服务层 -> Redis -> Store -> 用户界面
   ```

3. **价格更新流**
   ```
   外部服务 -> 服务层 -> Redis -> Store -> 用户界面
   ```

## 部署架构

```mermaid
graph TB
    subgraph "生产环境"
        LB[负载均衡器]
        FE1[前端服务器 1]
        FE2[前端服务器 2]
        BE1[后端服务器 1]
        BE2[后端服务器 2]
        DB[(主数据库)]
        DBR[(从数据库)]
        RC[(Redis 集群)]
        
        LB --> FE1
        LB --> FE2
        FE1 --> BE1
        FE1 --> BE2
        FE2 --> BE1
        FE2 --> BE2
        BE1 --> DB
        BE2 --> DB
        DB --> DBR
        BE1 --> RC
        BE2 --> RC
    end
    
    classDef lb fill:#f8f9fa,stroke:#343a40,stroke-width:2px
    classDef fe fill:#e9ecef,stroke:#495057,stroke-width:2px
    classDef be fill:#dee2e6,stroke:#6c757d,stroke-width:2px
    classDef db fill:#ced4da,stroke:#495057,stroke-width:2px
    
    class LB lb
    class FE1,FE2 fe
    class BE1,BE2 be
    class DB,DBR,RC db
```

这个架构图展示了系统的各个层次和组件之间的关系，以及数据流动的方向。图中使用不同的颜色和分组来区分不同的功能模块，使整个系统架构更加清晰。
