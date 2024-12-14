from selenium import webdriver
import time
import os
from selenium.webdriver import Chrome
from selenium.webdriver import ChromeOptions
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import random

import json

def init_web_driver(chrome_data_dir):
    chrome_options = ChromeOptions()

    chrome_options.add_experimental_option("detach", True)
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)

    chrome_options.add_argument(f"--user-data-dir={chrome_data_dir}") 
    chrome_options.add_argument("--disable-blink-features")
    chrome_options.add_argument("--disable-blink-features-AutomationControlled")

    driver = Chrome(options=chrome_options)
    
    return driver


def get_chrome_data_dir(dir_name):
  data_dir = os.path.join(os.getcwd(), 'data')

  try:
    chrome_data_dir = os.path.join(data_dir, dir_name)
    if not os.path.exists(chrome_data_dir):
        os.makedirs(chrome_data_dir)
    return chrome_data_dir
  except Exception as e:
    print(e)
    return data_dir


account1 = get_chrome_data_dir('account1')
driver = init_web_driver(account1)
driver.get('https://beta.loopfi.xyz/')

js = "window.open()"
driver.execute_script(js)

print(driver.window_handles)
print(driver.window_handles[-1])
print(driver.window_handles[1])


loop_window = driver.window_handles[0]
metamask_window = driver.window_handles[1]

driver.switch_to.window(metamask_window)
driver.get('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html')

def get_text(select, attempts=10):
  cnt = 0

  while cnt < attempts:
    try:
      return driver.find_element(By.CSS_SELECTOR, select).text
    except:
      time.sleep(2)
      cnt += 1

  return -1


def get_ammount(attempts=10):
  global meta_handle
  driver.switch_to.window(meta_handle)
  driver.get('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html')

  return get_text('.currency-display-component__text', attempts)

def login_wallet():
  cnt = 0

  while cnt < 10:
    try:
      input = driver.find_element(By.CSS_SELECTOR, '.MuiInputBase-input.MuiInput-input').send_keys("12345678")
      btn = driver.find_element(By.CSS_SELECTOR, 'button[data-testid="unlock-submit"]').click()
    except:
      time.sleep(2)
      cnt += 1

  return -1


login_wallet()

driver.switch_to.window(loop_window)

def get_faucet():
  btn = driver.find_element(By.XPATH, '//*[@id="root"]/div/div[1]/div/button')
  btn.click()

get_faucet()




