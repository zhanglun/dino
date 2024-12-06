import { ethers } from 'ethers';
import axios from 'axios';

interface TokenBalance {
  token: string;
  symbol: string;
  amount: string;
  decimals: number;
  value: number;
  chainId: number;
}

export class BlockchainService {
  private providers: Record<number, ethers.Provider>;
  private apiKeys: Record<string, string>;
  
  constructor() {
    // 初始化不同链的 provider
    this.providers = {
      1: new ethers.JsonRpcProvider('https://eth.public-rpc.com'),
      56: new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org'),
      137: new ethers.JsonRpcProvider('https://polygon-rpc.com')
    };
    
    // API keys
    this.apiKeys = {
      etherscan: process.env.ETHERSCAN_API_KEY || '',
      bscscan: process.env.BSCSCAN_API_KEY || '',
      polygonscan: process.env.POLYGONSCAN_API_KEY || ''
    };
  }
  
  async getAddressAssets(address: string) {
    const assets: TokenBalance[] = [];
    const supportedChains = [
      { id: 1, name: 'eth', scanApi: 'https://api.etherscan.io/api' },
      { id: 56, name: 'bsc', scanApi: 'https://api.bscscan.com/api' },
      { id: 137, name: 'polygon', scanApi: 'https://api.polygonscan.com/api' }
    ];
    
    for (const chain of supportedChains) {
      try {
        // 获取原生代币余额
        const nativeBalance = await this.getNativeBalance(address, chain.id);
        assets.push({
          token: '0x0000000000000000000000000000000000000000',
          symbol: this.getNativeSymbol(chain.name),
          amount: nativeBalance,
          decimals: 18,
          value: 0,
          chainId: chain.id
        });
        
        // 获取代币余额
        const tokens = await this.getTokenBalances(address, chain.scanApi, chain.id);
        assets.push(...tokens);
      } catch (error) {
        console.error(`Error fetching ${chain.name} assets:`, error);
      }
    }
    
    // 获取价格（使用 CoinGecko 免费 API）
    for (const asset of assets) {
      try {
        const price = await this.getTokenPrice(asset.token, asset.chainId);
        const amount = ethers.formatUnits(asset.amount, asset.decimals);
        asset.value = parseFloat(amount) * price;
      } catch (error) {
        console.error(`Error fetching price for ${asset.symbol}:`, error);
      }
    }
    
    return assets;
  }
  
  private async getNativeBalance(address: string, chainId: number): Promise<string> {
    const provider = this.providers[chainId];
    const balance = await provider.getBalance(address);
    return balance.toString();
  }
  
  private async getTokenBalances(address: string, scanApi: string, chainId: number): Promise<TokenBalance[]> {
    const apiKey = this.getApiKey(chainId);
    const response = await axios.get(scanApi, {
      params: {
        module: 'account',
        action: 'tokentx',
        address: address,
        apikey: apiKey
      }
    });
    
    if (response.data.status === '1') {
      const tokens = new Map<string, TokenBalance>();
      
      for (const tx of response.data.result) {
        const token = tx.contractAddress.toLowerCase();
        if (!tokens.has(token)) {
          tokens.set(token, {
            token,
            symbol: tx.tokenSymbol,
            amount: '0',
            decimals: parseInt(tx.tokenDecimal),
            value: 0,
            chainId
          });
        }
      }
      
      // 获取每个代币的当前余额
      for (const token of tokens.values()) {
        try {
          const contract = new ethers.Contract(
            token.token,
            ['function balanceOf(address) view returns (uint256)'],
            this.providers[chainId]
          );
          const balance = await contract.balanceOf(address);
          token.amount = balance.toString();
        } catch (error) {
          console.error(`Error fetching balance for token ${token.symbol}:`, error);
        }
      }
      
      return Array.from(tokens.values());
    }
    
    return [];
  }
  
  private getApiKey(chainId: number): string {
    switch (chainId) {
      case 1: return this.apiKeys.etherscan;
      case 56: return this.apiKeys.bscscan;
      case 137: return this.apiKeys.polygonscan;
      default: return '';
    }
  }
  
  private getNativeSymbol(chain: string): string {
    const symbols = {
      eth: 'ETH',
      bsc: 'BNB',
      polygon: 'MATIC'
    };
    return symbols[chain] || 'ETH';
  }
  
  async getTokenPrice(address: string, chainId: number): Promise<number> {
    try {
      // 使用 CoinGecko API 获取价格
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/token_price/${this.getChainPlatform(chainId)}`,
        {
          params: {
            contract_addresses: address,
            vs_currencies: 'usd'
          }
        }
      );
      
      return response.data[address.toLowerCase()]?.usd || 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }
  
  private getChainPlatform(chainId: number): string {
    const platforms = {
      1: 'ethereum',
      56: 'binance-smart-chain',
      137: 'polygon-pos'
    };
    return platforms[chainId] || 'ethereum';
  }
}
