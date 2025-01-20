import crypto from "node:crypto";
import {
  Transaction,
<<<<<<< HEAD
  generateKeyPairSigner,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
  Rpc,
  createKeyPairFromPrivateKeyBytes,
} from "@solana/web3.js";
import bip39 from "bip39";

// const RPC_URL = process.env.NODE_ENV === 'development' ? clusterApiUrl("devnet") : clusterApiUrl("mainnet-beta");
const RPC_URL = process.env.SOLANA_RPC_URL as string;

export class SolanaService {
  private connection: Rpc<any>;
=======
  createSolanaRpc,
  createKeyPairSignerFromPrivateKeyBytes,
  Rpc,
  devnet,
  createSolanaRpcSubscriptions,
  airdropFactory,
  lamports,
  Address,
} from "@solana/web3.js";
import bip39 from "bip39";

const LAMPORTS_PER_SOL = BigInt(1_000_000_000);
const DECIMALS = 9;
const DROP_AMOUNT = 100;
const RPC_URL = process.env.SOLANA_RPC_URL as string;
const CLUSTER = "devnet";
const rpc = createSolanaRpc(devnet(`https://api.${CLUSTER}.solana.com`));
const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet(`wss://api.${CLUSTER}.solana.com`)
);

export class SolanaService {
  private connection: any;
  private rpcSubscriptions: any;
>>>>>>> 759078b71251606474d0dff59b034e70088aa456

  constructor() {
    // this.connection = createSolanaRpc(RPC_URL);
    this.connection = rpc;
    this.rpcSubscriptions = rpcSubscriptions;
  }

  async createWallet(): Promise<any> {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");
<<<<<<< HEAD
    console.log("🚀 ~ file: solana.ts:28 ~ SolanaService ~ createWallet ~ seed:", seed)

    const { address, keyPair } = await createKeyPairSignerFromPrivateKeyBytes(seed.slice(0, 32), true);
    console.log("🚀 ~ file: solana.ts:29 ~ SolanaService ~ createWallet ~ keypair:", address)

    // 获取钱包的公钥
    const publicKey = keyPair.publicKey;
    console.log(
      "🚀 ~ file: solana.ts:28 ~ SolanaService ~ createWallet ~ publicKey:",
      publicKey
    );

    // 获取钱包的私钥
    // const privateKey = bs58.encode(keypair.secretKey);
    const privateKey = keyPair.privateKey
    console.log("🚀 ~ file: solana.ts:40 ~ SolanaService ~ createWallet ~ privateKey:", privateKey)
    // const base64SecretKey = Buffer.from(privateKey).toString("base64");
    // // 十六进制编码
    // const hexSecretKey = privateKey.reduce((hexString, byte) => {
    //   return hexString + byte.toString(16).padStart(2, "0");
    // }, "");
=======
    console.log(
      "🚀 ~ file: solana.ts:21 ~ SolanaService ~ createWallet ~ seed:",
      seed
    );

    const { address, keyPair } = await createKeyPairSignerFromPrivateKeyBytes(
      seed.slice(0, 32)
    );
    const { publicKey, privateKey } = keyPair;
    const exported = await crypto.subtle.exportKey("raw", publicKey);
    const exportedKeyBuffer = new Uint8Array(exported);
    console.log("🚀 ~ file: solana.ts:49 ~ SolanaService ~ createWallet ~ exportedKeyBuffer:", exportedKeyBuffer)
>>>>>>> 759078b71251606474d0dff59b034e70088aa456

    return {
      publicKey,
      privateKey,
<<<<<<< HEAD
      // base64SecretKey,
      // hexSecretKey,
=======
      address,
>>>>>>> 759078b71251606474d0dff59b034e70088aa456
      mnemonic,
    };
  }

  async getAirdrop(address: Address) {
    // const airdrop = airdropFactory({
    //   rpc: this.connection,
    //   rpcSubscriptions: this.rpcSubscriptions,
    // });
    // const airdropTx = await airdrop({
    //   commitment: "processed",
    //   lamports: lamports(LAMPORTS_PER_SOL),
    //   recipientAddress: address,
    // });
    // console.log("🚀 ~ file: solana.ts:66 ~ SolanaService ~ getAirdrop ~ airdropTx:", airdropTx)
    // console.log(`✅ - Airdropped 1 SOL to payer: ${airdropTx}`);

    // return airdropTx;

    const tx1 = await this.connection.requestAirdrop(
      lamports(LAMPORTS_PER_SOL),
      { commitment: 'processed' }
  ).send();
  console.log(`✅ - user1 airdropped 1 SOL using RPC methods`);
  console.log(`✅ - tx1: ${tx1}`);

  }

  // async getAccountBalance(publicKey: PublicKey): Promise<number> {
  //   const balance = await this.connection.getBalance(publicKey);
  //   return balance;
  // }

  // async getAccountInfo(
  //   publicKey: PublicKey
  // ): Promise<null | AccountInfo<Buffer>> {
  //   const accountInfo = await this.connection.getAccountInfo(publicKey);
  //   return accountInfo;
  // }

  // async buyToken(
  //   privateKey: Uint8Array,
  //   contractAddress: string,
  //   amountUsd: number
  // ): Promise<Transaction> {
  //   // 构建买入交易
  //   const transaction = new Transaction();
  //   // ... (省略具体实现)
  //   return transaction;
  // }

  // async sellTokenLimit(
  //   privateKey: Uint8Array,
  //   contractAddress: string,
  //   sellPrice: number
  // ): Promise<Transaction> {
  //   // 构建限价卖出交易
  //   const transaction = new Transaction();
  //   // ... (省略具体实现)
  //   return transaction;
  // }

  // async sendTransaction(
  //   transaction: Transaction,
  //   privateKey: Uint8Array
  // ): Promise<string> {
  //   // 发送交易到 Solana 网络
  //   const signature = await sendAndConfirmTransaction(
  //     this.connection,
  //     transaction,
  //     [privateKey]
  //   );
  //   return signature;
  // }
}
