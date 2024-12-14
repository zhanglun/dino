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

driver.get('https://stake.walrus.site/')

# shared.open_new_tab(driver)
loop_window = driver.window_handles[0]
# wallet_window = driver.window_handles[1]

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
  connect_button = driver.find_element(By.XPATH, '//*[@id="root"]/div/div[1]/div/div/main/div/div[2]/div/button[2]').click()
  
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


def open_get_wal_modal():
  driver.switch_to.window(loop_window)
  print("开始打开质押wal的窗口")

  button = driver.find_element(By.CSS_SELECTOR, '#root > div > header > ul > li:first-child')
  button.click()
  time.sleep(1)
  input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"]').send_keys("1")
  exchange = driver.find_element(By.XPATH, "//button[@type='submit' and contains(., 'Exchange')]").click() 


def connect_wallet():
  cnt = 0

  while cnt < 5:
    try:
      switch_button = driver.find_element(By.CSS_SELECTOR, "#root > div > header > ul > li:last-child")

      if switch_button.text == "Connect Wallet":
        switch_button.click()
        
        time.sleep(1)

        select_sui_button = driver.find_element(By.XPATH, "//button[starts-with(@class, 'WalletListItem_walletItem') and contains(., 'Sui Wallet')]").click()

        time.sleep(1)
        # connect_button = driver.find_element(By.XPATH, '//*[@id="root"]/div/div[1]/div/div/main/div/div[2]/div/button[2]').click()
        break;
        
      else:
        switch_button.click()
        driver.find_element(By.XPATH, "//button[@data-radix-collection-item and text()='Disconnect']").click()
        # TODO: disconnet wallet, unlock all wallets and then connect wallet
        print("TODO -> disconnet wallet, unlock all wallets and then connect wallet")

        connect_wallet()
        break
        
      # button = driver.find_element(By.XPATH, "//*[@id='root']/div[1]/header/ul/li[2]/button")
      # button.click()

      # input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys("!QAZxsw2#EDC")
      # confirm_btn = driver.find_element(By.XPATH, '//*[@id="radix-:r9:"]/div[2]/div/div/button[2]').click()

    except Exception as e:
      # print(e)
      time.sleep(1)

      cnt += 1

  return 1

connect_wallet()

print(driver.window_handles)

wallet_float_window = driver.window_handles[-1]

driver.switch_to.window(wallet_float_window)

time.sleep(2)

unlock_all_wallets()


def confirm_transcation():
  wallet_float_window = driver.window_handles[-1]

  driver.switch_to.window(wallet_float_window)
  time.sleep(5)
  driver.find_element(By.XPATH, "//button[@type='button' and contains(., 'Approve')]").click()

  print("交易成功")

  time.sleep(5)


def interact_with_wallets():
  global_count = 0
  wallets = driver.find_elements(By.CSS_SELECTOR, 'div[data-radix-collection-item]')

  while global_count < len(wallets):
    wallets[global_count].click()
    connect_button = driver.find_element(By.XPATH, "//button[@type='button' and contains(descendant::text(), 'Connect')]").click()
    global_count += 1

    open_get_wal_modal()

    confirm_transcation()


interact_with_wallets()
