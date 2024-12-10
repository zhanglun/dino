import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app";
import Web3 from "web3";

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
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: expect.any(Number),
      name: "My Wallet",
      address: testAddress,
      color: "#6B7280",
      emoji: "fluent-emoji:beaming-face-with-smiling-eyes",
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

  // it("应能成功获取钱包列表", async () => {
  //   const res = await app.request("/api/wallets", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       name: "My Wallet",
  //       address: testAddress,
  //     }),
  //     headers: new Headers({ "Content-Type": "application/json" }),
  //   });

  //   expect(res.status).toBe(200);
  //   expect(res.body).toEqual({
  //     id: expect.any(Number),
  //     name: "My Wallet",
  //     address: testAddress,
  //   });

  //   const res2 = await app.request("/api/wallets");

  //   expect(res2.status).toBe(200);

  //   expect(res2.body).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({
  //         name: "My Wallet",
  //         address: testAddress,
  //       }),
  //     ])
  //   );
  // });
});
