import ccxt
import pandas as pd
from datetime import datetime
import time

class CryptoArbitrage:
    def __init__(self, exchanges=['binance', 'huobi', 'okx'], symbol='JUP/USDT', proxy=None):
        """
        初始化套利程序
        :param exchanges: 交易所列表
        :param symbol: 交易对
        :param proxy: 代理设置，格式如 'http://127.0.0.1:7890'
        """
        self.exchanges = {}
        self.symbol = symbol
        
        # 代理配置
        self.proxy = proxy
        if proxy:
            print(f"使用代理: {proxy}")
        
        # 初始化交易所，使用公共API
        for exchange_id in exchanges:
            try:
                exchange_class = getattr(ccxt, exchange_id)
                # 交易所配置
                config = {
                    'enableRateLimit': True,
                    'timeout': 30000,
                }
                
                # 添加代理配置
                if proxy:
                    config.update({
                        'proxies': {
                            'http': proxy,  # HTTP代理
                            'https': proxy, # HTTPS代理
                        }
                    })
                
                exchange = exchange_class(config)
                
                # 初始化市场数据
                exchange.load_markets()
                if self.symbol in exchange.markets:
                    self.exchanges[exchange_id] = exchange
                    print(f"成功初始化 {exchange_id} 交易所")
                else:
                    print(f"警告: {exchange_id} 不支持交易对 {self.symbol}")
            except Exception as e:
                print(f"初始化 {exchange_id} 时出错: {str(e)}")

    def fetch_prices(self):
        """获取各个交易所的价格"""
        prices = {}
        for exchange_id, exchange in self.exchanges.items():
            try:
                ticker = exchange.fetch_ticker(self.symbol)
                if ticker and 'bid' in ticker and 'ask' in ticker and ticker['bid'] and ticker['ask']:
                    prices[exchange_id] = {
                        'bid': float(ticker['bid']),  # 买入价
                        'ask': float(ticker['ask']),  # 卖出价
                        'timestamp': ticker['timestamp']
                    }
                    print(f"{exchange_id} - 买入: {ticker['bid']}, 卖出: {ticker['ask']}")
            except Exception as e:
                print(f"获取 {exchange_id} 价格时出错: {str(e)}")
            time.sleep(1)  # 添加延迟避免请求过快
        return prices

    def find_arbitrage_opportunities(self, prices, min_profit_percent=0.5):
        """
        寻找套利机会
        :param prices: 各交易所价格
        :param min_profit_percent: 最小利润百分比
        :return: 套利机会列表
        """
        if len(prices) < 2:
            print("警告: 可用交易所数量不足，无法进行套利")
            return []
            
        opportunities = []
        exchanges = list(prices.keys())
        
        for i in range(len(exchanges)):
            for j in range(i + 1, len(exchanges)):
                exchange1 = exchanges[i]
                exchange2 = exchanges[j]
                
                try:
                    # 计算从exchange1买入，在exchange2卖出的利润
                    profit1 = (prices[exchange2]['bid'] - prices[exchange1]['ask']) / prices[exchange1]['ask'] * 100
                    
                    # 计算从exchange2买入，在exchange1卖出的利润
                    profit2 = (prices[exchange1]['bid'] - prices[exchange2]['ask']) / prices[exchange2]['ask'] * 100
                    
                    if profit1 > min_profit_percent:
                        opportunities.append({
                            'buy_exchange': exchange1,
                            'sell_exchange': exchange2,
                            'profit_percent': profit1,
                            'buy_price': prices[exchange1]['ask'],
                            'sell_price': prices[exchange2]['bid']
                        })
                    
                    if profit2 > min_profit_percent:
                        opportunities.append({
                            'buy_exchange': exchange2,
                            'sell_exchange': exchange1,
                            'profit_percent': profit2,
                            'buy_price': prices[exchange2]['ask'],
                            'sell_price': prices[exchange1]['bid']
                        })
                except Exception as e:
                    print(f"计算 {exchange1} 和 {exchange2} 之间的套利机会时出错: {str(e)}")
        
        return opportunities

    def monitor_opportunities(self, interval=10, min_profit_percent=0.5):
        """
        持续监控套利机会
        :param interval: 检查间隔（秒）
        :param min_profit_percent: 最小利润百分比
        """
        if not self.exchanges:
            print("错误: 没有可用的交易所，请检查配置")
            return
            
        print(f"\n开始监控套利机会...")
        print(f"交易对: {self.symbol}")
        print(f"最小利润阈值: {min_profit_percent}%")
        print(f"检查间隔: {interval}秒")
        print(f"可用交易所: {', '.join(self.exchanges.keys())}")
        
        try:
            while True:
                print(f"\n{datetime.now()} - 检查套利机会...")
                
                # 获取价格
                prices = self.fetch_prices()
                if not prices:
                    print("无法获取价格，等待下次检查...")
                    time.sleep(interval)
                    continue
                
                # 寻找套利机会
                opportunities = self.find_arbitrage_opportunities(prices, min_profit_percent)
                
                if opportunities:
                    print("\n发现套利机会:")
                    for opp in opportunities:
                        print(f"从 {opp['buy_exchange']} 买入价格: {opp['buy_price']}")
                        print(f"在 {opp['sell_exchange']} 卖出价格: {opp['sell_price']}")
                        print(f"预期利润: {opp['profit_percent']:.2f}%\n")
                else:
                    print("未发现套利机会")
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n程序已停止")
        except Exception as e:
            print(f"监控过程中出错: {str(e)}")

def main():
    # 创建套利程序实例，设置代理
    proxy = 'http://127.0.0.1:7890'  # 这里替换为您的代理地址
    arbitrage = CryptoArbitrage(proxy=proxy)
    
    # 开始监控套利机会
    arbitrage.monitor_opportunities(interval=10, min_profit_percent=0.5)

if __name__ == "__main__":
    main()
