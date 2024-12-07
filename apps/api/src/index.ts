import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from 'dotenv';
// import { connectDB } from './utils/db';
import { assetsRouter } from './routes/assets';
import { historyRouter } from './routes/history';
import { walletsRouter } from './routes/wallets';

// 加载环境变量
config();

const app = new Hono();

// 中间件
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

// 路由
app.route('/api/wallets', walletsRouter);
app.route('/api/assets', assetsRouter);
app.route('/api/history', historyRouter);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok' }));

// 连接数据库
// connectDB();

// 启动服务器
const port = (process.env.PORT || 3000) as number;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
