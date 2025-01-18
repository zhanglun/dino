import crypto from "node:crypto";
import {
  Transaction,
  createSolanaRpc,
  createKeyPairSignerFromPrivateKeyBytes,
  Rpc,
} from "@solana/web3.js";
import bip39 from "bip39";

// const RPC_URL = process.env.NODE_ENV === 'development' ? clusterApiUrl("devnet") : clusterApiUrl("mainnet-beta");
const RPC_URL = process.env.SOLANA_RPC_URL as string;

export class SolanaService {
  private connection: Rpc;

  constructor() {
    this.connection = createSolanaRpc(RPC_URL); 
  }

  async createWallet(): Promise<any> {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");
    console.log("🚀 ~ file: solana.ts:21 ~ SolanaService ~ createWallet ~ seed:", seed)

    const { address, keyPair } = await createKeyPairSignerFromPrivateKeyBytes(seed.slice(0, 32));
    const { publicKey, privateKey} = keyPair;

    return {
      publicKey,
      privateKey,
      address,
      mnemonic,
    };
  }

  async getAccountBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance;
  }

  async getAccountInfo(
    publicKey: PublicKey
  ): Promise<null | AccountInfo<Buffer>> {
    const accountInfo = await this.connection.getAccountInfo(publicKey);
    return accountInfo;
  }

  async buyToken(
    privateKey: Uint8Array,
    contractAddress: string,
    amountUsd: number
  ): Promise<Transaction> {
    // 构建买入交易
    const transaction = new Transaction();
    // ... (省略具体实现)
    return transaction;
  }

  async sellTokenLimit(
    privateKey: Uint8Array,
    contractAddress: string,
    sellPrice: number
  ): Promise<Transaction> {
    // 构建限价卖出交易
    const transaction = new Transaction();
    // ... (省略具体实现)
    return transaction;
  }

  async sendTransaction(
    transaction: Transaction,
    privateKey: Uint8Array
  ): Promise<string> {
    // 发送交易到 Solana 网络
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [privateKey]
    );
    return signature;
  }
}
