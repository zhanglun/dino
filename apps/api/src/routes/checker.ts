import { Hono } from "hono";
import { sendGetRequest, sendPostRequest } from "../lib/cex";

const router = new Hono();

router.get("/", async (c) => {
  // GET 请求示例
  const getRequestPath = "/api/v5/dex/aggregator/quote";
  const getParams = {
    chainId: 42161,
    amount: 1000000000000,
    toTokenAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    fromTokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  };
  
  const result = await sendGetRequest(getRequestPath, getParams);

  // // POST 请求示例
  // const postRequestPath = "/api/v5/mktplace/nft/ordinals/listings";
  // const postParams = {
  //   slug: "sats",
  // };
  // sendPostRequest(postRequestPath, postParams);
  // return c.json({ status: "ok" });
});

export { router as checkerRouter };
