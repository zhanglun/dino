from web3_login import Web3LoginManager
from config import RPC_URLS, CHAIN_IDS, API_ENDPOINTS
import asyncio


async def login_example():
    # 创建登录管理器
    login_manager = Web3LoginManager()

    # 创建新会话
    session = login_manager.create_session(
        rpc_url=RPC_URLS["mainnet"],
        chain_id=CHAIN_IDS["mainnet"],
        private_key="your-private-key"  # 可选
    )

    # 连接钱包
    wallet_info = await session.connect_wallet("metamask")
    print("Wallet connected:", wallet_info)

    # 执行登录
    login_result = await session.login_with_signature(
        API_ENDPOINTS["development"]
    )
    print("Login successful:", login_result)

    # 获取余额
    balance = session.get_balance()
    print(f"Balance: {balance} ETH")

    return session

asyncio.run(login_example())