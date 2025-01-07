import { Hono } from "hono";
import { sendGetRequest, sendPostRequest } from "../lib/cex";
import { CacheService } from "../services/cache";
import { OKXService } from "../services/okx";

const router = new Hono();
const cacheService = new CacheService();
const okxService = new OKXService();

router.get("/", async (c) => {
  // GET 请求示例
  const url = "/api/v5/wallet/token/current-price";
  const body = [
    {
      chainIndex: 501,
      tokenAddress: "GM5MBekSureTyKu4iJ5NukeHVgXVWbt4kQwz9rupump",
    },
  ];

  const result = await sendPostRequest(url, body);

  return c.json(result);
});

export { router as checkerRouter };

router.get("/chains", async (c) => {
  try {
    const data = await okxService.getChains();

    await cacheService.setCachedChains(data);

    return c.json(data);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

router.get("/tokens", async (c) => {
  const { chain, address } = c.req.query();
  const chains = await okxService.getChains();
  const matched = chains.find((c) => c.shortName.toLowerCase() === chain);

  if (matched) {
    const { chainIndex } = matched;

    const result = await okxService.getTokenDetail(chainIndex, address);

    return c.json(result);
  } else {
    return c.json({ error: "Chain not found" }, 404);
  }
});
