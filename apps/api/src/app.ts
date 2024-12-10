import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { assetsRouter } from "./routes/assets";
import { historyRouter } from "./routes/history";
import { walletsRouter } from "./routes/wallets";

const app = new Hono();

// 中间件
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// 路由
app.route("/api/wallets", walletsRouter);
app.route("/api/assets", assetsRouter);
app.route("/api/history", historyRouter);

// 健康检查
app.get("/api/health", (c) => c.json({ status: "ok" }));

export { app };
