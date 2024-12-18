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

global_idx = 0
global_current_wallet = None
init = True
global_wallets = []
target_window = None

account1 = shared.get_chrome_data_dir('account1')
driver = shared.init_web_driver(account1)

def open_warlus():
  global target_window

  if target_window:
    driver.switch_to.window(target_window)
  else:
    driver.get('https://stake.walrus.site/')
    target_window = driver.window_handles[0]

# driver.switch_to.window(wallet_window)
# driver.get("chrome-extension://opcgpfmipidbgpenhmajoajpbobppdil/ui.html#/tokens")

# unlock all sui wallet
def unlock_wallet():
  
  def unlock_it():
    button = driver.find_element(By.XPATH, "//*[@id='root']/div/div[1]/div/div/main/div/button")
    button.click()
    input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys("!QAZxsw2#EDC")
    confirm_btn = driver.find_element(By.XPATH, '//*[@id="radix-:ra:"]/div[2]/div/div/button[2]').click()

  unlock_it()

# driver.switch_to.window(target_window)

def unlock_all_wallets():
  global global_wallets
  # 列表中的🔒图标 反查wallet address
  lockers = driver.find_elements(By.CSS_SELECTOR, 'button[data-testid="unlock-account-button"]')
  wallet_count = len(lockers)

  print("总共有{}个钱包".format(wallet_count))
  print(lockers)

  for i, locker in enumerate(lockers):
    print(locker)
    wallet_id = driver.find_element(By.XPATH, '//*[@id="root"]/div/div[1]/div/div/main/div/div[1]/div[2]/div/div[2]/div[2]/div[2]/div').text
    print('钱包{}解锁中'.format(wallet_id), wallet_id)
    locker.click()
    time.sleep(1)
    input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys("!QAZxsw2#EDC")
    button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
    time.sleep(1)

    print("钱包{}解锁成功".format(wallet_id))

    global_wallets.append(wallet_id)

  driver.close()

def select_wallet_to_connect(idx):
  wallets = driver.find_elements(By.CSS_SELECTOR, 'div[data-radix-collection-item]')
  print(wallets)

  for wallet in wallets:
    try:
      checked = wallet.find_element(By.CSS_SELECTOR, '.text-success')
      if checked:
        wallet.click()
    except:
      print("没有已经选中的钱包, 那么就让我们选中第一个")
    
  select = wallets[idx]
  select.click()
  connect_button = driver.find_element(By.XPATH, "//button[@type='button' and contains(descendant::text(), 'Connect')]").click()

  return 1

def cache_wallets():
  return 1

def open_get_wal_modal():
  driver.switch_to.window(target_window)
  print("开始打开质押wal的窗口")

  button = driver.find_element(By.CSS_SELECTOR, '#root > div > header > ul > li:first-child')
  button.click()
  time.sleep(1)
  input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]').send_keys("1")
  exchange = driver.find_element(By.XPATH, "//button[@type='submit' and contains(., 'Exchange')]").click() 

def disconnect_current_wallet():
  print("断开当前钱包 {}".format(global_current_wallet))
  switch_button = driver.find_element(By.CSS_SELECTOR, "#root > div > header > ul > li:last-child")
  switch_button.click()
  driver.find_element(By.XPATH, "//button[@data-radix-collection-item and text()='Disconnect']").click()

# 连接钱包，如果已经连接，退出链接，按照钱包顺序连接
def connect_wallet():
  switch_button = driver.find_element(By.CSS_SELECTOR, "#root > div > header > ul > li:last-child")

  if switch_button.text == "Connect Wallet":
    switch_button.click()
    
    time.sleep(1)

    select_sui_button = driver.find_element(By.XPATH, "//button[starts-with(@class, 'WalletListItem_walletItem') and contains(., 'Sui Wallet')]").click()
    
  else:
    disconnect_current_wallet()

    time.sleep(3)

    connect_wallet()

def get_ammount_in_warlus():
  amount = driver.find_element(By.CSS_SELECTOR, "#root > div > header > ul > li:nth-child(2) span:first-child").text

  return amount

def confirm_transcation():
  wallet_float_window = driver.window_handles[-1]

  driver.switch_to.window(wallet_float_window)
  time.sleep(5)
  driver.find_element(By.XPATH, "//button[@type='button' and contains(., 'Approve')]").click()

  #TODO: 验证是否可以交易 需要判断余额或者判断是否二次确认
  print("交易成功")

  time.sleep(5)
  return 1

def switch_wallet(idx):
  connect_wallet()

  time.sleep(5)
  wallet_float_window = driver.window_handles[-1]
  driver.switch_to.window(wallet_float_window)

  select_wallet_to_connect(idx);

def stake_warlus():
  stake_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Stake')]")
  idx = random.randint(0, len(stake_buttons) - 1)
  stake_buttons[idx].click()

  input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]').send_keys("1")
  confirm_stake_btn = driver.find_element(By.XPATH, "//button[@type='submit' and contains(., 'Stake')]").click()


def interact_with_warlus():
  global global_idx
  global global_wallets
  global target_window

  print("====> 开始和warlus页面交互")
  print("====> 第{}个钱包开始, 钱包地址: {}".format(global_idx, global_wallets[global_idx]))

  if (global_idx >= len(global_wallets)):
    print("所有钱包都交互完毕，退出")

    return

  driver.switch_to.window(target_window)

  time.sleep(5)
  amount = get_ammount_in_warlus()
  
  print("钱包余额{}".format(amount))

  if float(amount) <= 1:
    print("余额不足，切换到下一个钱包")
    switch_wallet(global_idx)
    global_idx += 1
    time.sleep(3)
    interact_with_warlus()
  else:
    open_get_wal_modal()
    time.sleep(3)
    result = confirm_transcation()

    #TODO: stake warlus
    stake_warlus()

def start_job():
  global global_idx
  global target_window

  # 打开网页
  open_warlus()
  
  connect_wallet()

  time.sleep(5)

  wallet_float_window = driver.window_handles[-1]
  driver.switch_to.window(wallet_float_window)

  unlock_all_wallets()

  driver.switch_to.window(target_window)

  connect_wallet()

  print("等待warlus加载完成")

  interact_with_warlus()

  return 1

start_job()
