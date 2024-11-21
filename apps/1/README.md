# 加密货币套利程序

这是一个简单的加密货币套利程序演示，用于监控不同交易所之间的价格差异并发现套利机会。

## 功能特点

- 支持多个主流交易所（Binance、Huobi、OKEx等）
- 实时监控价格差异
- 自动计算套利机会
- 可配置最小利润阈值
- 支持自定义交易对

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

1. 在项目根目录创建 `.env` 文件
2. 添加各交易所的API密钥：

```env
BINANCE_API_KEY=你的binance_api_key
BINANCE_SECRET=你的binance_secret
HUOBI_API_KEY=你的huobi_api_key
HUOBI_SECRET=你的huobi_secret
OKEX_API_KEY=你的okex_api_key
OKEX_SECRET=你的okex_secret
```

## 使用方法

运行程序：

```bash
python arbitrage.py
```

## 注意事项

- 本程序仅作为演示用途，实际交易时需要考虑更多因素（如交易手续费、市场深度等）
- 使用前请确保已经正确配置了交易所的API密钥
- 建议先使用小额资金测试
- 请遵守各交易所的使用条款和规定
