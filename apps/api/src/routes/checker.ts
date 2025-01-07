import { Hono } from "hono";
import { sendGetRequest, sendPostRequest } from "../lib/cex";
import { CacheService } from "../services/cache";

const router = new Hono();
const cacheService = new CacheService();

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

  // // POST 请求示例
  // const postRequestPath = "/api/v5/mktplace/nft/ordinals/listings";
  // const postParams = {
  //   slug: "sats",
  // };
  // sendPostRequest(postRequestPath, postParams);
  // return c.json({ status: "ok" });
});

export { router as checkerRouter };

router.get("/chains", async (c) => {
  try {
    const cachedChains = await cacheService.getCachedChains();

    if (cachedChains) {
      return c.json(cachedChains);
    }
    const url = "/api/v5/wallet/chain/supported-chains";
    const { data } = await sendGetRequest(url);

    const result = await cacheService.setCachedChains(data);

    return c.json(data);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

router.get("/tokens", async (c) => {
  const url = "/api/v5/wallet/token/token-detail";
  const { chain, address } = c.req.query();

  const result = await sendGetRequest(url, {
    chain,
    address,
  });

  return c.json(result);
});
