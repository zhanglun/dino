from selenium import webdriver
import time
import os
from selenium.webdriver import Chrome
from selenium.webdriver import ChromeOptions
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import random
import json

import shared

account1 = shared.get_chrome_data_dir('account1')
driver = shared.init_web_driver(account1)
loop_window = None

driver.get('https://stake.walrus.site/')

# shared.open_new_tab(driver)
loop_window = driver.window_handles[0]
# wallet_window = driver.window_handles[1]

def open_warlus():
  global loop_window

  if loop_window:
    driver.switch_to.window(loop_window)
  else:
    driver.get('https://stake.walrus.site/')
    loop_window = driver.window_handles[0]

# driver.switch_to.window(wallet_window)
# driver.get("chrome-extension://opcgpfmipidbgpenhmajoajpbobppdil/ui.html#/tokens")

# unlock all sui wallet
def unlock_wallet():
  
  def unlock_it():
    button = driver.find_element(By.XPATH, "//*[@id='root']/div/div[1]/div/div/main/div/button")
    button.click()

    input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys("!QAZxsw2#EDC")
    
    confirm_btn = driver.find_element(By.XPATH, '//*[@id="radix-:ra:"]/div[2]/div/div/button[2]').click()

  cnt = 0

  while cnt < 10:
    try:
      unlock_it()

      # time.sleep(1)
      # switch = driver.find_element(By.XPATH, '//*[@id="root"]/div/div[1]/div/div/main/div/div[1]/div[3]/button').click()

      # wallets = driver.find_element(By.CLASS_NAME, 'div[id="radix-:r9:"]>div>div')
      
      # print(wallets)
      # print("还有共有{}个钱包需要解锁".format(len(wallets)))
      
      # for wallet in wallets:
      #   wallet.click() 
      #   unlock_it()
      #   print('钱包{}解锁成功'.format(wallet.text))
      #   time.sleep(1)
      return -1

    except:
      time.sleep(2)
      cnt += 1

  return -1

# unlock_wallet()

driver.switch_to.window(loop_window)

def unlock_all_wallets():
  # 列表中的🔒图标 反查wallet address
  lockers = driver.find_elements(By.CSS_SELECTOR, 'button[data-testid="unlock-account-button"]')
  wallet_count = len(lockers)

  print("总共有{}个钱包".format(wallet_count))
  print(lockers)

  for i, locker in enumerate(lockers):
    print(locker)
    wallet_id = driver.find_element(By.XPATH, '//*[@id="root"]/div/div[1]/div/div/main/div/div[1]/div[2]/div/div[2]/div/div[2]').text
    print(wallet_id)
    locker.click()
    time.sleep(1)
    input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys("!QAZxsw2#EDC")
    button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
    time.sleep(1)

    print("钱包{}解锁成功".format(wallet_id))

  select_wallet_to_connect(0)

def select_wallet_to_connect(idx):
  wallets = driver.find_elements(By.CSS_SELECTOR, 'div[data-radix-collection-item]')
  print(wallets)
  select = wallets[idx]
  select.click()
  connect_button = driver.find_element(By.XPATH, "//button[@type='button' and contains(descendant::text(), 'Connect')]").click()

  return 1

def cache_wallets():
  return 1

def open_get_wal_modal():
  driver.switch_to.window(loop_window)
  print("开始打开质押wal的窗口")

  button = driver.find_element(By.CSS_SELECTOR, '#root > div > header > ul > li:first-child')
  button.click()
  time.sleep(1)
  input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]').send_keys("1")
  exchange = driver.find_element(By.XPATH, "//button[@type='submit' and contains(., 'Exchange')]").click() 

# 连接钱包，如果已经连接，退出链接，按照钱包顺序连接
def connect_wallet():
  switch_button = driver.find_element(By.CSS_SELECTOR, "#root > div > header > ul > li:last-child")

  if switch_button.text == "Connect Wallet":
    switch_button.click()
    
    time.sleep(1)

    select_sui_button = driver.find_element(By.XPATH, "//button[starts-with(@class, 'WalletListItem_walletItem') and contains(., 'Sui Wallet')]").click()
    
  else:
    switch_button.click()
    driver.find_element(By.XPATH, "//button[@data-radix-collection-item and text()='Disconnect']").click()
    # TODO: disconnet wallet, unlock all wallets and then connect wallet
    print("TODO -> disconnet wallet, unlock all wallets and then connect wallet")

    connect_wallet()

print(driver.window_handles)

wallet_float_window = driver.window_handles[-1]

driver.switch_to.window(wallet_float_window)

time.sleep(2)

# unlock_all_wallets()

def get_ammount_in_warlus():
  amount = driver.find_element(By.CSS_SELECTOR, "#root > div > header > ul > li:nth-child(2) span:first-child").text

  return amount

def confirm_transcation():
  wallet_float_window = driver.window_handles[-1]

  driver.switch_to.window(wallet_float_window)
  time.sleep(5)
  driver.find_element(By.XPATH, "//button[@type='button' and contains(., 'Approve')]").click()

  print("交易成功")

  time.sleep(5)

global_count = 0
init = True


def switch_wallet(idx):
  connect_wallet()

  time.sleep(5)
  wallet_float_window = driver.window_handles[-1]
  driver.switch_to.window(wallet_float_window)

  select_wallet_to_connect(idx);


def interact_with_warlus():
  global global_count
  global loop_window

  driver.switch_to.window(loop_window)
  amount = get_ammount_in_warlus()

  if float(amount) <= 1:
    print("余额不足，切换到下一个钱包")
    switch_wallet(global_count)
    global_count += 1
    time.sleep(3)
    interact_with_warlus()
  else:
    open_get_wal_modal()

def start_job():
  global global_count
  global loop_window

  # 打开网页
  open_warlus()
  
  connect_wallet()

  time.sleep(5)
  wallet_float_window = driver.window_handles[-1]
  driver.switch_to.window(wallet_float_window)
  unlock_all_wallets()

  global_count += 1

  time.sleep(5)
  print("等待warlus加载完成")

  interact_with_warlus()
  
  # 如果连接了钱包，先断开，然后获取到钱包列表
  # 3. 循环执行交互
  # 3.1 链接钱包
  # 3.2 打开质押wal的窗口
  # 3.3 确认交易 
  # 3.4 交易成功
  # 3.5 连接下一个钱包 ...

  return 1

start_job()
