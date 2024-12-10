import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app";
import Web3 from "web3";
import exp from "constants";

const web3 = new Web3();

describe("Wallets API", () => {
  let testAddress;

  beforeAll(() => {
    // 使用 web3.js 生成一个新的钱包地址
    const account = web3.eth.accounts.create();
    testAddress = account.address;
  });

  it("应能成功添加钱包", async () => {
    const res = await app.request("/api/wallets", {
      method: "POST",
      body: JSON.stringify({
        address: testAddress,
        name: "My Wallet",
        color: "#6B7280",
        emoji: "fluent-emoji:beaming-face-with-smiling-eyes",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      success: true,
      message: "Wallet created successfully",
      data: {
        id: expect.any(Number),
        name: "My Wallet",
        address: testAddress,
        color: "#6B7280",
        emoji: "fluent-emoji:beaming-face-with-smiling-eyes",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("添加钱包时缺少Address字段应返回 400", async () => {
    const response = await app.request("/api/wallets", {
      method: "POST",
      body: JSON.stringify({
        name: "My Wallet",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });
    expect(response.status).toBe(400);

    const body = await response.json();
    console.log("🚀 ~ file: wallets.test.ts:53 ~ it ~ body:", body);
    expect(body).toEqual({
      message: 'Validation error: Required at "address"',
      success: false,
    });
  });

  it("应能成功获取钱包列表", async () => {
    const res = await app.request("/api/wallets");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      message: "Wallets fetched successfully",
      data: expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String), // 允许名称为任意字符串
          address: expect.any(String), // 允许地址为任意字符串
          color: expect.any(String), // 允许颜色为任意字符串
          emoji: expect.any(String), // 允许 emoji 为任意字符串
        }),
      ]),
    });
  });
});
