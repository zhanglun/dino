import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import bip39 from "bip39";

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL as string);
  }

  async createWallet(): Promise<any> {
    const mnemonic = bip39.generateMnemonic();
    console.log('助记词:', mnemonic);
    
    // 从助记词生成种子
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    
    // 使用种子生成Solana钱包密钥对
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    
    // 获取钱包的公钥
    const publicKey = keypair.publicKey.toBase58();
    console.log('公钥:', publicKey);
    
    // 获取钱包的私钥
    // const privateKey = bs58.encode(keypair.secretKey);
    const secretKey = keypair.secretKey;
    const base64SecretKey = Buffer.from(secretKey).toString('base64');
    console.log('私钥:', keypair.secretKey);
    console.log('base64SecretKey:', base64SecretKey);

    return {
      publicKey,
      secretKey,
      base64SecretKey,
      mnemonic
    }
  }

  async getAccountBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance;
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
