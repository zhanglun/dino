import { serve } from "@hono/node-server";
import "dotenv/config";
import { app } from "./app";

// 启动服务器
const port = (process.env.PORT || 3000) as number;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
