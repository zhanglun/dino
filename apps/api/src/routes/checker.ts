import { Hono } from "hono";
import { sendGetRequest, sendPostRequest } from "../lib/cex";

const router = new Hono();

router.get("/", async (c) => {
  // GET 请求示例
  const getRequestPath = "/api/v5/wallet/token/current-price";
  const data = {
    chainIndex: "1",
    tokenAddress: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72",
  };

  const result = await sendPostRequest(getRequestPath, data);
  console.log("🚀 ~ file: checker.ts:17 ~ router.get ~ result:", result);

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
  const url = "/api/v5/wallet/chain/supported-chains";
  const result = await sendGetRequest(url) as Promise<Response>;

  console.log("🚀 ~ file: checker.ts:33 ~ router.get ~ result:", result)

  return c.json(result);
});
