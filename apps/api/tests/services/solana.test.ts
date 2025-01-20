import { describe, it, expect, beforeAll } from "vitest";
import { SolanaService } from "../../src/services/solana";
import { airdropFactory, isAddress } from "@solana/web3.js";

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

<<<<<<< HEAD
    // expect(base64SecretKey).toBeDefined();
    expect(mnemonic).toBeDefined();

    // const connection = new Connection("https://api.devnet.solana.com");
    // const res = await connection.requestAirdrop(publicKey);

    // 1. 验证私钥与公钥对应关系
  // const privateKey = Uint8Array.from(Buffer.from(base64SecretKey, 'base64'));
  // const regeneratedKeypair = Keypair.fromSecretKey(privateKey);
  // const regeneratedPublicKey = regeneratedKeypair.publicKey.toString();

  // expect(regeneratedPublicKey).toBe(publicKey);

  // const balance = await solanaService.getAccountBalance(regeneratedKeypair.publicKey);
  // console.log("🚀 ~ file: solana.test.ts:36 ~ it ~ balance:", balance)
  
  // const info = await solanaService.getAccountInfo(regeneratedKeypair.publicKey);
  // console.log("🚀 ~ file: solana.test.ts:39 ~ it ~ info:", info)
=======
    expect(address).toBeDefined();
    expect(mnemonic).toBeDefined();

    expect(isAddress(address)).toBe(true);
>>>>>>> 759078b71251606474d0dff59b034e70088aa456

    await solanaService.getAirdrop(address);
    // const airdrop = airdropFactory({ rpc: solanaService.connection, rpcSubscriptions });
    // const airdropTx = await airdrop({
    //     commitment: 'processed',
    //     lamports: lamports(LAMPORTS_PER_SOL),
    //     recipientAddress: payer.address
    // });
    // console.log(`✅ - Airdropped 1 SOL to payer: ${airdropTx}`);
  });
  // it("getAccountBalance", async () => {
  //   // 使用 SolanaService 获取账户余额
  //   const balance = await solanaService.getAccountBalance();
  //   expect(balance).toBeGreaterThan(0);
  // });
});
