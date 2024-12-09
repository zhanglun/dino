import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from "../../src/app";

describe("Wallets API", () => {
  it("应能成功添加钱包", async () => {
    const res = await app.request("/api/wallets", {
      method: "POST",
      body: JSON.stringify({
        name: "My Wallet",
        address: "0x1234567890abcdef",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    expect(res.status).toBe(200);
    expect(201);

    expect(res.body).toEqual({
      id: expect.any(Number),
      name: "My Wallet",
      address: "0x1234567890abcdef",
    });
  });

  it("添加钱包时缺少必需字段应返回 400", async () => {
    const response = await app.request("/api/wallets", {
      method: "POST",
      body: JSON.stringify({
        name: "My Wallet",
      }),
    });
    expect(response.status).toBe(400);

    expect(response.body).toEqual({ error: "Name and address are required" });
  });

  it("应能成功获取钱包列表", async () => {
    const res = await app.request("/api/wallets", {
      method: "POST",
      body: JSON.stringify({
        name: "My Wallet",
        address: "0x1234567890abcdef",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: expect.any(Number),
      name: "My Wallet",
      address: "0x1234567890abcdef",
    });

    const res2 = await app.request("/api/wallets");

    expect(res.status).toBe(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "My Wallet",
          address: "0x1234567890abcdef",
        }),
      ])
    );
  });
});
