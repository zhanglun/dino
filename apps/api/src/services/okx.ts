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
}