import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL as string);
  }

  async getAccountBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance;
  }
}
