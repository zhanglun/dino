import requests
import time
from datetime import datetime
import json

class SolanaArbitrage:
    def __init__(self, token_pair='JUP/USDC', proxy=None):
        """
        初始化 Solana 生态套利程序
        :param token_pair: 交易对，例如 'JUP/USDC'
        :param proxy: 代理设置
        """
        self.token_pair = token_pair
        self.base_token, self.quote_token = token_pair.split('/')
        self.proxy = proxy if proxy else {}
        
        # Jupiter API endpoint
        self.jupiter_api = "https://price.jup.ag/v4"
        self.raydium_api = "https://api-v3.raydium.io"  # Raydium API v3
        
        # 已知的 Solana token 地址
        self.token_addresses = {
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
            'SOL': 'So11111111111111111111111111111111111111112',
            'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        }
        
        print(f"初始化 Solana 套利程序...")
        print(f"交易对: {token_pair}")
        print(f"使用代理: {proxy if proxy else '否'}")

    def get_jupiter_price(self):
        """获取 Jupiter 上的价格"""
        try:
            # 构建请求参数
            params = {
                'ids': f'{self.token_addresses[self.base_token]}',
                'vsToken': self.token_addresses[self.quote_token]
            }
            
            response = requests.get(
                f"{self.jupiter_api}/price", 
                params=params,
                proxies=self.proxy
            )
            
            if response.status_code == 200:
                data = response.json()
                price = float(data['data'][self.token_addresses[self.base_token]]['price'])
                return {
                    'price': price,
                    'timestamp': data['timeTaken'],
                }
            else:
                print(f"获取 Jupiter 价格失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"获取 Jupiter 价格时出错: {str(e)}")
            return None

    def get_raydium_price(self):
        """获取 Raydium 上的价格"""
        try:
            # 构建请求参数
            params = {
                'inputMint': self.token_addresses[self.base_token],
                'outputMint': self.token_addresses[self.quote_token],
                'amount': '1000000',  # 1 USDC
                'slippage': 0.5,
            }
            
            # 获取交易对价格
            response = requests.get(
                f"{self.raydium_api}/quote",
                params=params,
                proxies=self.proxy
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['success'] and data['data']:
                    # 计算价格（输出金额/输入金额）
                    out_amount = float(data['data']['outAmount'])
                    in_amount = float(data['data']['inAmount'])
                    price = out_amount / in_amount
                    
                    return {
                        'price': price,
                        'timestamp': int(time.time() * 1000)
                    }
                else:
                    print(f"Raydium 上未找到 {self.token_pair} 的价格数据")
                    return None
            else:
                print(f"获取 Raydium 价格失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"获取 Raydium 价格时出错: {str(e)}")
            return None

    def get_orca_price(self):
        """获取 Orca 上的价格（示例）"""
        # 这里需要实现 Orca 的价格获取逻辑
        pass

    def find_arbitrage_opportunities(self, prices, min_profit_percent=0.5):
        """
        寻找套利机会
        :param prices: 各平台价格
        :param min_profit_percent: 最小利润百分比
        """
        if len(prices) < 2:
            print("可用价格数据不足，无法计算套利机会")
            return []

        opportunities = []
        platforms = list(prices.keys())

        for i in range(len(platforms)):
            for j in range(i + 1, len(platforms)):
                platform1 = platforms[i]
                platform2 = platforms[j]

                try:
                    # 计算价格差异
                    price1 = prices[platform1]['price']
                    price2 = prices[platform2]['price']

                    # 计算利润百分比
                    profit1 = (price2 - price1) / price1 * 100
                    profit2 = (price1 - price2) / price2 * 100

                    if profit1 > min_profit_percent:
                        opportunities.append({
                            'buy_platform': platform1,
                            'sell_platform': platform2,
                            'buy_price': price1,
                            'sell_price': price2,
                            'profit_percent': profit1
                        })

                    if profit2 > min_profit_percent:
                        opportunities.append({
                            'buy_platform': platform2,
                            'sell_platform': platform1,
                            'buy_price': price2,
                            'sell_price': price1,
                            'profit_percent': profit2
                        })

                except Exception as e:
                    print(f"计算 {platform1} 和 {platform2} 之间的套利机会时出错: {str(e)}")

        return opportunities

    def monitor_opportunities(self, interval=5, min_profit_percent=0.5):
        """
        持续监控套利机会
        :param interval: 检查间隔（秒）
        :param min_profit_percent: 最小利润百分比
        """
        print(f"\n开始监控 Solana 生态套利机会...")
        print(f"最小利润阈值: {min_profit_percent}%")
        print(f"检查间隔: {interval}秒")

        try:
            while True:
                print(f"\n{datetime.now()} - 检查套利机会...")

                # 获取各平台价格
                prices = {
                    'Jupiter': self.get_jupiter_price(),
                    'Raydium': self.get_raydium_price(),
                    # 'Orca': self.get_orca_price()
                }

                # 移除没有数据的平台
                prices = {k: v for k, v in prices.items() if v is not None}

                if not prices:
                    print("无法获取价格数据，等待下次检查...")
                    time.sleep(interval)
                    continue

                # 显示当前价格
                print("\n当前价格:")
                for platform, data in prices.items():
                    print(f"{platform}: {data['price']} {self.quote_token}")

                # 寻找套利机会
                opportunities = self.find_arbitrage_opportunities(prices, min_profit_percent)

                if opportunities:
                    print("\n发现套利机会:")
                    for opp in opportunities:
                        print(f"从 {opp['buy_platform']} 买入价格: {opp['buy_price']} {self.quote_token}")
                        print(f"在 {opp['sell_platform']} 卖出价格: {opp['sell_price']} {self.quote_token}")
                        print(f"预期利润: {opp['profit_percent']:.2f}%\n")
                else:
                    print("未发现套利机会")

                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n程序已停止")
        except Exception as e:
            print(f"监控过程中出错: {str(e)}")

def main():
    # 创建套利程序实例
    proxy = 'http://127.0.0.1:7890'  # 替换为您的代理地址
    arbitrage = SolanaArbitrage(
        token_pair='JUP/USDC',
        proxy={'http': proxy, 'https': proxy}
    )
    
    # 开始监控套利机会
    arbitrage.monitor_opportunities(interval=5, min_profit_percent=0.5)

if __name__ == "__main__":
    main()
