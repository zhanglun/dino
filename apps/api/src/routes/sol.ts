import { Hono } from "hono";
import { SolanaService } from "../services/solana";

const router = new Hono();
const solanaService = new SolanaService();

router.post("/import-wallet", async (c) => {

});

router.post("/wallets", async (c) => {
  return solanaService.createWallet();  
});