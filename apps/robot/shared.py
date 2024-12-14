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

def open_new_tab(driver):
  js = "window.open()"
  driver.execute_script(js)

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

