import { sendGetRequest, sendPostRequest } from "../lib/cex";
import { CacheService } from "./cache";

export class OKXService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  async getChains() {
    const cachedChains = await this.cacheService.getCachedChains();

    if (cachedChains) {
      return cachedChains;
    }

    const url = "/api/v5/wallet/chain/supported-chains";
    const { data } = await sendGetRequest(url);

    return data;
  }

  async getTokenDetail(chainIndex: string, address: string) {
    const cachedDetail = await this.cacheService.getCachedTokenDetail( address);

    if (cachedDetail) {
      console.log("🚀 ~ file: okx.ts:28 ~ OKXService ~ getTokenDetail ~ cachedDetail: FROM CACHE")
      return cachedDetail;
    }

    const url = "/api/v5/wallet/token/token-detail";
    const { data } = await sendGetRequest(url, {
      chainIndex,
      tokenAddress: address,
    });

    await this.cacheService.setCachedTokenDetail(address, data)

    return data;
  }
}