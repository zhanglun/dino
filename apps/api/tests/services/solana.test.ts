import { describe, it, expect, beforeAll } from "vitest";
import { SolanaService } from "../../src/services/solana";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

describe("SolanaService", () => {
  let solanaService: SolanaService;

  beforeAll(() => {
    solanaService = new SolanaService();
  });

  it("Create wallet", async () => {
    // 使用 SolanaService 创建钱包
    const { address, publicKey, privateKey, mnemonic } =
      await solanaService.createWallet();

    console.log("Address:", address);
    console.log("助记词:", mnemonic);
    console.log("公钥:", publicKey);
    console.log("私钥:", privateKey);

    expect(address).toBeDefined();
    expect(mnemonic).toBeDefined();
  });
  // it("getAccountBalance", async () => {
  //   // 使用 SolanaService 获取账户余额
  //   const balance = await solanaService.getAccountBalance();
  //   expect(balance).toBeGreaterThan(0);
  // });
});
