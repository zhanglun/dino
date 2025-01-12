import { describe, it, expect, beforeAll } from "vitest";
import { SolanaService } from "../../src/services/solana";

describe("SolanaService", () => {
  let solanaService: SolanaService;

  beforeAll(() => {
    solanaService = new SolanaService();
  });

  it("createWallet", async () => {
    // 使用 SolanaService 创建钱包
    const { publicKey, secretKey, base64SecretKey, mnemonic } = await solanaService.createWallet();

    expect(secretKey).toBeDefined();
  });
  // it("getAccountBalance", async () => {
  //   // 使用 SolanaService 获取账户余额
  //   const balance = await solanaService.getAccountBalance();
  //   expect(balance).toBeGreaterThan(0);
  // });
});