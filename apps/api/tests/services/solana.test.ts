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
    const { publicKey, hexSecretKey, base64SecretKey, mnemonic } =
      await solanaService.createWallet();

    console.log("助记词:", mnemonic);
    console.log("公钥:", publicKey);
    console.log("base64SecretKey:", base64SecretKey);
    console.log("hexSecretKey", hexSecretKey);

    expect(base64SecretKey).toBeDefined();
    expect(mnemonic).toBeDefined();

    // const connection = new Connection("https://api.devnet.solana.com");
    // const res = await connection.requestAirdrop(publicKey);

    // 1. 验证私钥与公钥对应关系
  const privateKey = Uint8Array.from(Buffer.from(base64SecretKey, 'base64'));
  const regeneratedKeypair = Keypair.fromSecretKey(privateKey);
  const regeneratedPublicKey = regeneratedKeypair.publicKey.toString();

  expect(regeneratedPublicKey).toBe(publicKey);

  // const balance = await solanaService.getAccountBalance(regeneratedKeypair.publicKey);
  // console.log("🚀 ~ file: solana.test.ts:36 ~ it ~ balance:", balance)
  
  const info = await solanaService.getAccountInfo(regeneratedKeypair.publicKey);
  console.log("🚀 ~ file: solana.test.ts:39 ~ it ~ info:", info)

  });
  // it("getAccountBalance", async () => {
  //   // 使用 SolanaService 获取账户余额
  //   const balance = await solanaService.getAccountBalance();
  //   expect(balance).toBeGreaterThan(0);
  // });
});
