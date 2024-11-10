from web3 import Web3, HTTPProvider

address = '0xxx'
rpc = 'https://bsc-dataseed1.binance.org:443'

web3 = Web3(HTTPProvider(rpc))
balance = web3.fromWei(web3.eth.getBalance(address), "ether")
print(balance)