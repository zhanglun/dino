import { describe, it, expect } from "vitest";
import { app } from "../../src/app";

describe("API 路由测试", () => {
  it("示例：GET /api/health 应该返回 200", async () => {
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
    });
  });
});
